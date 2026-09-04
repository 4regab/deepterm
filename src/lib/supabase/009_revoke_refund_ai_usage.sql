-- 009_revoke_refund_ai_usage.sql
-- STATUS: NOT applied to live DB until owner runs it in Supabase SQL editor
--         (or via migration runner). Do not assume PostgREST grants are live.
--
-- Fixes:
-- 1) HIGH — public.refund_ai_usage() was EXECUTE-granted to authenticated,
--    so any signed-in user could refund their own AI quota via PostgREST.
--    Revoke client access; refunds go through service-role-only RPC.
-- 2) HIGH — achievements stuck at 0/60: the 5-arg record_study_activity
--    (what the app calls with p_activity_date) never ran check_achievements;
--    increment_stat still called public.check_achievements() after it moved
--    to private (so set-create stats/unlocks silently failed).

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- 1. Service-role-only AI refund (by user id — auth.uid() is null for service)
-- ---------------------------------------------------------------------------
create or replace function private.refund_ai_usage_for(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  if p_user_id is null then
    return false;
  end if;

  update public.ai_usage
  set generation_count = greatest(generation_count - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and reset_date = v_today;

  return found;
end;
$$;

create or replace function public.refund_ai_usage_for(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Callable only with SUPABASE_SECRET_KEY / service_role (grants below).
  return private.refund_ai_usage_for(p_user_id);
end;
$$;

revoke all on function public.refund_ai_usage_for(uuid) from public;
revoke all on function public.refund_ai_usage_for(uuid) from anon;
revoke all on function public.refund_ai_usage_for(uuid) from authenticated;
grant execute on function public.refund_ai_usage_for(uuid) to service_role;

revoke all on function private.refund_ai_usage_for(uuid) from public;
revoke all on function private.refund_ai_usage_for(uuid) from anon;
revoke all on function private.refund_ai_usage_for(uuid) from authenticated;

-- Revoke the legacy no-arg client-callable refund (signature from 006).
revoke all on function public.refund_ai_usage() from public;
revoke all on function public.refund_ai_usage() from anon;
revoke all on function public.refund_ai_usage() from authenticated;
-- Keep service_role able to call the legacy wrapper only if it still needs
-- auth.uid() context; prefer refund_ai_usage_for going forward.
grant execute on function public.refund_ai_usage() to service_role;

-- ---------------------------------------------------------------------------
-- 2. Achievements: fix unlock path after private.check_achievements move
-- ---------------------------------------------------------------------------
create or replace function public.record_study_activity(
  p_minutes integer default 0,
  p_flashcards integer default 0,
  p_quizzes integer default 0,
  p_pomodoros integer default 0,
  p_activity_date date default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := coalesce(p_activity_date, current_date);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.study_activity (
    user_id, activity_date, minutes_studied, flashcards_reviewed, quizzes_completed, pomodoro_sessions
  )
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
  perform private.check_achievements();
end;
$$;

revoke all on function public.record_study_activity(integer, integer, integer, integer, date) from public;
grant execute on function public.record_study_activity(integer, integer, integer, integer, date) to authenticated, service_role;

create or replace function public.increment_stat(p_stat_name text, p_amount integer default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_safe_amount integer;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount < 1 then
    v_safe_amount := 1;
  elsif p_amount > 500 then
    v_safe_amount := 500;
  else
    v_safe_amount := p_amount;
  end if;

  case p_stat_name
    when 'flashcards_mastered' then
      update public.user_stats set flashcards_mastered = flashcards_mastered + v_safe_amount, updated_at = now() where user_id = v_user_id;
    when 'perfect_quizzes' then
      update public.user_stats set perfect_quizzes = perfect_quizzes + v_safe_amount, updated_at = now() where user_id = v_user_id;
    when 'quizzes_completed' then
      update public.user_stats set quizzes_completed = quizzes_completed + v_safe_amount, updated_at = now() where user_id = v_user_id;
    when 'pomodoro_sessions' then
      update public.user_stats set pomodoro_sessions = pomodoro_sessions + v_safe_amount, updated_at = now() where user_id = v_user_id;
    when 'flashcard_sets_created' then
      update public.user_stats set flashcard_sets_created = flashcard_sets_created + v_safe_amount, updated_at = now() where user_id = v_user_id;
    when 'reviewers_created' then
      update public.user_stats set reviewers_created = reviewers_created + v_safe_amount, updated_at = now() where user_id = v_user_id;
    when 'materials_uploaded' then
      update public.user_stats set materials_uploaded = materials_uploaded + v_safe_amount, updated_at = now() where user_id = v_user_id;
    else
      return;
  end case;

  perform private.check_achievements();
end;
$$;

revoke all on function public.increment_stat(text, integer) from public;
grant execute on function public.increment_stat(text, integer) to authenticated, service_role;

-- Sync achievements whenever the client fetches them (heals already-bumped stats).
create or replace function public.get_user_achievements()
returns table (
  id text,
  title text,
  description text,
  icon text,
  color text,
  bg text,
  progress integer,
  requirement_value integer,
  unlocked boolean,
  unlocked_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  perform private.check_achievements();

  return query
  select
    ad.id,
    ad.title,
    ad.description,
    ad.icon,
    ad.color,
    ad.bg,
    coalesce(ua.progress, 0) as progress,
    ad.requirement_value,
    coalesce(ua.unlocked, false) as unlocked,
    ua.unlocked_at
  from public.achievement_definitions ad
  left join public.user_achievements ua
    on ua.achievement_id = ad.id and ua.user_id = auth.uid()
  order by ua.unlocked desc nulls last, ad.id;
end;
$$;

revoke all on function public.get_user_achievements() from public;
grant execute on function public.get_user_achievements() to authenticated, service_role;
