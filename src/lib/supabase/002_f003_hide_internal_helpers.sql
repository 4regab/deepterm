-- F-003: Hide internal helpers from PostgREST schema cache.
--
-- Context
-- -------
-- The OWASP pentest report (see report.md) flagged PostgREST's verbose
-- PGRST202 "Perhaps you meant to call the function public.<name>" hints and
-- PGRST205 "Perhaps you meant the table 'public.<name>'" hints as an
-- information-disclosure primitive. An attacker probing with typos can map
-- every public function and table name in seconds.
--
-- Why REVOKE doesn't work
-- -----------------------
-- PostgREST's fuzzy-match hint surface is built at the authenticator level
-- from every object in the exposed schemas (public). Revoking EXECUTE on a
-- per-role basis does NOT remove objects from the hint corpus, it only
-- prevents the eventual call. Verified empirically during pentest.
--
-- Strategy
-- --------
-- 1. Create a `private` schema that is NOT exposed to PostgREST. Supabase's
--    default db-schemas config only lists `public` (plus `graphql_public` /
--    `storage`), so anything in `private` is unreachable over the REST API
--    and invisible to fuzzy-match hints.
-- 2. `ALTER FUNCTION ... SET SCHEMA private` every helper that is NOT a
--    documented public entry point, including all trigger functions.
--    Triggers keep firing because pg_trigger resolves by oid, not by name.
-- 3. Rewrite the surviving public RPCs (`add_xp`, `get_user_xp_stats`,
--    `record_study_activity`, `get_dashboard_data`) so they reference
--    `private.<helper>`. They remain SECURITY DEFINER, so the owner's USAGE
--    on `private` is what grants execution — not the caller's role.
-- 4. `NOTIFY pgrst, 'reload schema'` so the cache rebuild is immediate.
--
-- Effect: the only names that can appear in "Perhaps you meant..." hints are
-- documented public RPCs (add_xp, get_dashboard_data, get_shared_material,
-- cancel_account_deletion, request_account_deletion, etc.). Internal names
-- like `calculate_level`, `handle_new_user`, `validate_share_code`,
-- `update_study_streak`, `check_user_is_unlimited`, `increment_ai_usage`,
-- the sanitize_* triggers, and the enforce_ai_rate_limit_* triggers are
-- unreachable and unnamed over REST.
--
-- Corresponds to hosted migrations:
--   20260509060556_f003_minimize_postgrest_schema_disclosure.sql  (no-op fallback)
--   20260509061600_f003_move_internal_helpers_to_private_schema.sql (this file)

set local search_path to public, pg_temp;

-- 1. Private schema
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role;

-- 2. Move internal helpers out of public
alter function public.calculate_level(integer)          set schema private;
alter function public.get_xp_for_level(integer)         set schema private;
alter function public.get_xp_in_current_level(integer)  set schema private;

alter function public.get_shared_flashcard_set(text)    set schema private;
alter function public.get_shared_flashcards(text)       set schema private;
alter function public.validate_share_code(text)         set schema private;
alter function public.is_flashcard_set_shared(uuid)     set schema private;
alter function public.is_reviewer_shared(uuid)          set schema private;

alter function public.check_user_is_unlimited(uuid)     set schema private;
alter function public.update_study_streak(uuid, date)   set schema private;
alter function public.check_achievements()              set schema private;
alter function public.increment_ai_usage(date)          set schema private;
alter function public.get_next_topic_for_generation()   set schema private;
alter function public.get_materials_counts()            set schema private;
alter function public.get_sidebar_data()                set schema private;

-- Trigger functions: pg_trigger tracks oid, so moving them is transparent.
alter function public.handle_new_user()                    set schema private;
alter function public.update_updated_at_column()           set schema private;
alter function public.sanitize_profile_full_name()         set schema private;
alter function public.sanitize_reviewer_title()            set schema private;
alter function public.enforce_ai_rate_limit()              set schema private;
alter function public.enforce_ai_rate_limit_on_insert()    set schema private;
alter function public._share_lookup_log_housekeep()        set schema private;

-- 3. Rewrite public RPCs that depended on the moved helpers. These RPCs are
-- SECURITY DEFINER and owned by postgres/service_role, which has USAGE on
-- `private`; the caller (anon / authenticated) does not.

create or replace function public.add_xp(p_amount integer)
  returns table(new_total_xp integer, new_level integer, xp_in_level integer, xp_for_next integer, leveled_up boolean)
  language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_level integer;
  v_new_total_xp integer;
  v_new_level integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount < 1 or p_amount > 100 then raise exception 'Invalid XP amount. Must be between 1 and 100.'; end if;

  select current_level into v_old_level from public.user_stats where user_id = v_user_id;

  update public.user_stats
     set total_xp = total_xp + p_amount,
         current_level = private.calculate_level(total_xp + p_amount),
         updated_at = now()
   where user_id = v_user_id
  returning total_xp, current_level into v_new_total_xp, v_new_level;

  return query select
    v_new_total_xp,
    v_new_level,
    private.get_xp_in_current_level(v_new_total_xp),
    private.get_xp_for_level(v_new_level),
    v_new_level > coalesce(v_old_level, 1);
end;
$$;

create or replace function public.get_user_xp_stats()
  returns table(total_xp integer, current_level integer, xp_in_level integer, xp_for_next integer)
  language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_xp integer;
  v_level integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select us.total_xp, us.current_level into v_total_xp, v_level
    from public.user_stats us where us.user_id = v_user_id;
  v_total_xp := coalesce(v_total_xp, 0);
  v_level    := coalesce(v_level, 1);
  return query select
    v_total_xp,
    v_level,
    private.get_xp_in_current_level(v_total_xp),
    private.get_xp_for_level(v_level);
end;
$$;

create or replace function public.record_study_activity(
  p_minutes integer default 0,
  p_flashcards integer default 0,
  p_quizzes integer default 0,
  p_pomodoros integer default 0
) returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  insert into public.study_activity (user_id, activity_date, minutes_studied, flashcards_reviewed, quizzes_completed, pomodoro_sessions)
  values (v_user_id, v_today, p_minutes, p_flashcards, p_quizzes, p_pomodoros)
  on conflict (user_id, activity_date) do update set
    minutes_studied     = public.study_activity.minutes_studied     + p_minutes,
    flashcards_reviewed = public.study_activity.flashcards_reviewed + p_flashcards,
    quizzes_completed   = public.study_activity.quizzes_completed   + p_quizzes,
    pomodoro_sessions   = public.study_activity.pomodoro_sessions   + p_pomodoros,
    updated_at = now();

  update public.user_stats
     set total_study_minutes = total_study_minutes + p_minutes,
         quizzes_completed   = user_stats.quizzes_completed + p_quizzes,
         pomodoro_sessions   = user_stats.pomodoro_sessions + p_pomodoros,
         updated_at = now()
   where user_id = v_user_id;

  perform private.update_study_streak(v_user_id);
  perform private.check_achievements();
end;
$$;

create or replace function public.record_study_activity(
  p_minutes integer default 0,
  p_flashcards integer default 0,
  p_quizzes integer default 0,
  p_pomodoros integer default 0,
  p_activity_date date default null
) returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := coalesce(p_activity_date, current_date);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  insert into public.study_activity (user_id, activity_date, minutes_studied, flashcards_reviewed, quizzes_completed, pomodoro_sessions)
  values (v_user_id, v_today, p_minutes, p_flashcards, p_quizzes, p_pomodoros)
  on conflict (user_id, activity_date) do update set
    minutes_studied     = public.study_activity.minutes_studied     + p_minutes,
    flashcards_reviewed = public.study_activity.flashcards_reviewed + p_flashcards,
    quizzes_completed   = public.study_activity.quizzes_completed   + p_quizzes,
    pomodoro_sessions   = public.study_activity.pomodoro_sessions   + p_pomodoros,
    updated_at = now();

  update public.user_stats
     set total_study_minutes = total_study_minutes + p_minutes,
         quizzes_completed   = user_stats.quizzes_completed + p_quizzes,
         pomodoro_sessions   = user_stats.pomodoro_sessions + p_pomodoros,
         updated_at = now()
   where user_id = v_user_id;

  perform private.update_study_streak(v_user_id, v_today);
end;
$$;

create or replace function public.get_dashboard_data()
  returns json language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result json;
  v_profile record;
  v_xp record;
  v_stats record;
  v_user record;
  v_today_minutes integer := 0;
  v_real_streak integer := 0;
begin
  if v_user_id is null then return json_build_object('error', 'Not authenticated'); end if;

  select full_name, email, avatar_url into v_profile
    from public.profiles where id = v_user_id;

  select
    coalesce(us.total_xp, 0) as total_xp,
    coalesce(us.current_level, 1) as current_level,
    private.get_xp_in_current_level(coalesce(us.total_xp, 0)) as xp_in_level,
    private.get_xp_for_level(coalesce(us.current_level, 1)) as xp_for_next
    into v_xp
    from public.user_stats us where us.user_id = v_user_id;

  select
    coalesce(total_study_minutes, 0) as total_study_minutes,
    coalesce(current_streak, 0)      as current_streak,
    coalesce(longest_streak, 0)      as longest_streak,
    coalesce(pomodoro_sessions, 0)   as pomodoro_sessions,
    coalesce(flashcards_mastered, 0) as flashcards_mastered,
    coalesce(quizzes_completed, 0)   as quizzes_completed,
    last_study_date
    into v_stats
    from public.user_stats where user_id = v_user_id;

  select raw_user_meta_data into v_user from auth.users where id = v_user_id;

  select coalesce(
    (select sa.minutes_studied from public.study_activity sa
      where sa.user_id = v_user_id and sa.activity_date = current_date),
    0
  ) into v_today_minutes;

  if v_stats.last_study_date is null then v_real_streak := 0;
  elsif v_stats.last_study_date >= current_date - interval '1 day' then
    v_real_streak := coalesce(v_stats.current_streak, 0);
  else v_real_streak := 0; end if;

  select json_build_object(
    'profile', json_build_object(
      'full_name',  coalesce(v_profile.full_name,  v_user.raw_user_meta_data->>'full_name',  v_user.raw_user_meta_data->>'name'),
      'email',      v_profile.email,
      'avatar_url', coalesce(v_profile.avatar_url, v_user.raw_user_meta_data->>'avatar_url', v_user.raw_user_meta_data->>'picture')
    ),
    'xp', json_build_object(
      'total_xp',      coalesce(v_xp.total_xp, 0),
      'current_level', coalesce(v_xp.current_level, 1),
      'xp_in_level',   coalesce(v_xp.xp_in_level, 0),
      'xp_for_next',   coalesce(v_xp.xp_for_next, 100)
    ),
    'stats', json_build_object(
      'total_study_minutes', coalesce(v_stats.total_study_minutes, 0),
      'today_study_minutes', v_today_minutes,
      'current_streak',      v_real_streak,
      'longest_streak',      coalesce(v_stats.longest_streak, 0),
      'pomodoro_sessions',   coalesce(v_stats.pomodoro_sessions, 0),
      'flashcards_mastered', coalesce(v_stats.flashcards_mastered, 0),
      'quizzes_completed',   coalesce(v_stats.quizzes_completed, 0),
      'last_study_date',     v_stats.last_study_date
    )
  ) into v_result;

  return v_result;
end;
$$;

-- 4. Force PostgREST to drop its cached schema view.
notify pgrst, 'reload schema';
