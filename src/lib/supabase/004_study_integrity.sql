-- 004_study_integrity.sql
-- Notes for live DB (do not replay 001–003). Helpers live in private;
-- search_path = ''; GRANT EXECUTE only to authenticated (never PUBLIC).
-- Apply in the Supabase SQL editor after review.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Columns: SRS, folders, share expiry
-- ---------------------------------------------------------------------------
alter table public.flashcards
  add column if not exists ease_factor numeric not null default 2.5,
  add column if not exists interval_days integer not null default 0,
  add column if not exists repetitions integer not null default 0,
  add column if not exists due_at timestamptz not null default now();

create index if not exists flashcards_user_due_at_idx
  on public.flashcards (user_id, due_at);

alter table public.flashcard_sets
  add column if not exists folder text;

alter table public.reviewers
  add column if not exists folder text;

alter table public.material_shares
  add column if not exists expires_at timestamptz;

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references public.flashcard_sets(id) on delete cascade,
  score integer not null default 0,
  total integer not null default 0,
  answers jsonb,
  created_at timestamptz not null default now()
);

alter table public.practice_sessions enable row level security;

drop policy if exists "Users can view own practice sessions" on public.practice_sessions;
create policy "Users can view own practice sessions"
  on public.practice_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own practice sessions" on public.practice_sessions;
create policy "Users can insert own practice sessions"
  on public.practice_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create index if not exists practice_sessions_user_id_idx
  on public.practice_sessions (user_id, created_at desc);

create table if not exists private.share_rate_limits (
  bucket text not null,
  identifier_hash text not null,
  window_start timestamptz not null default now(),
  hit_count integer not null default 1,
  primary key (bucket, identifier_hash)
);

-- ---------------------------------------------------------------------------
-- increment_stat: raise per-call cap to 500 (client still chunks by 10)
-- ---------------------------------------------------------------------------
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

  perform public.check_achievements();
end;
$$;

revoke all on function public.increment_stat(text, integer) from public;
grant execute on function public.increment_stat(text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- add_xp: allow up to 1000 to match client clamp
-- ---------------------------------------------------------------------------
create or replace function public.add_xp(p_amount integer)
returns table(new_total_xp integer, new_level integer, xp_in_level integer, xp_for_next integer, leveled_up boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_level integer;
  v_new_total_xp integer;
  v_new_level integer;
  v_amount integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount < 1 then
    raise exception 'Invalid XP amount. Must be between 1 and 1000.';
  end if;
  v_amount := least(p_amount, 1000);

  select current_level into v_old_level from public.user_stats where user_id = v_user_id;

  update public.user_stats
  set total_xp = total_xp + v_amount,
      current_level = public.calculate_level(total_xp + v_amount),
      updated_at = now()
  where user_id = v_user_id
  returning total_xp, current_level into v_new_total_xp, v_new_level;

  return query select
    v_new_total_xp,
    v_new_level,
    public.get_xp_in_current_level(v_new_total_xp),
    public.get_xp_for_level(v_new_level),
    v_new_level > coalesce(v_old_level, 1);
end;
$$;

revoke all on function public.add_xp(integer) from public;
grant execute on function public.add_xp(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- record_study_activity: clamp non-negative bounded inputs
-- ---------------------------------------------------------------------------
create or replace function public.record_study_activity(
  p_minutes integer default 0,
  p_flashcards integer default 0,
  p_quizzes integer default 0,
  p_pomodoros integer default 0,
  p_activity_date date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := coalesce(p_activity_date, current_date);
  v_minutes integer := greatest(0, least(coalesce(p_minutes, 0), 1440));
  v_flashcards integer := greatest(0, least(coalesce(p_flashcards, 0), 1000));
  v_quizzes integer := greatest(0, least(coalesce(p_quizzes, 0), 100));
  v_pomodoros integer := greatest(0, least(coalesce(p_pomodoros, 0), 100));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.study_activity (user_id, activity_date, minutes_studied, flashcards_reviewed, quizzes_completed, pomodoro_sessions)
  values (v_user_id, v_today, v_minutes, v_flashcards, v_quizzes, v_pomodoros)
  on conflict (user_id, activity_date)
  do update set
    minutes_studied = public.study_activity.minutes_studied + excluded.minutes_studied,
    flashcards_reviewed = public.study_activity.flashcards_reviewed + excluded.flashcards_reviewed,
    quizzes_completed = public.study_activity.quizzes_completed + excluded.quizzes_completed,
    pomodoro_sessions = public.study_activity.pomodoro_sessions + excluded.pomodoro_sessions,
    updated_at = now();

  update public.user_stats
  set total_study_minutes = total_study_minutes + v_minutes,
      quizzes_completed = public.user_stats.quizzes_completed + v_quizzes,
      pomodoro_sessions = public.user_stats.pomodoro_sessions + v_pomodoros,
      updated_at = now()
  where user_id = v_user_id;

  perform public.update_study_streak(v_user_id, v_today);
  perform public.check_achievements();
end;
$$;

revoke all on function public.record_study_activity(integer, integer, integer, integer, date) from public;
grant execute on function public.record_study_activity(integer, integer, integer, integer, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Refund a wasted AI generation (parse/abort/timeout after increment)
-- ---------------------------------------------------------------------------
create or replace function private.refund_ai_usage()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  if v_user_id is null then
    return false;
  end if;

  update public.ai_usage
  set generation_count = greatest(generation_count - 1, 0),
      updated_at = now()
  where user_id = v_user_id
    and reset_date = v_today
  returning generation_count into v_count;

  return found;
end;
$$;

create or replace function public.refund_ai_usage()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.refund_ai_usage();
end;
$$;

revoke all on function public.refund_ai_usage() from public;
grant execute on function public.refund_ai_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- Durable share copy rate limit
-- ---------------------------------------------------------------------------
create or replace function public.consume_share_rate_limit(
  p_bucket text,
  p_identifier_hash text,
  p_max integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer := greatest(1, least(coalesce(p_max, 20), 120));
  v_window integer := greatest(10, least(coalesce(p_window_seconds, 60), 3600));
  v_row private.share_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  if p_bucket is null or p_identifier_hash is null or length(p_identifier_hash) < 8 then
    return query select false, 0, v_window;
    return;
  end if;

  insert into private.share_rate_limits (bucket, identifier_hash, window_start, hit_count)
  values (p_bucket, p_identifier_hash, v_now, 1)
  on conflict (bucket, identifier_hash)
  do update set
    window_start = case
      when private.share_rate_limits.window_start <= v_now - make_interval(secs => v_window)
        then v_now
      else private.share_rate_limits.window_start
    end,
    hit_count = case
      when private.share_rate_limits.window_start <= v_now - make_interval(secs => v_window)
        then 1
      else private.share_rate_limits.hit_count + 1
    end
  returning * into v_row;

  if v_row.hit_count > v_max then
    return query select false, 0,
      greatest(1, ceil(extract(epoch from (v_row.window_start + make_interval(secs => v_window) - v_now)))::integer);
  else
    return query select true, v_max - v_row.hit_count,
      greatest(1, ceil(extract(epoch from (v_row.window_start + make_interval(secs => v_window) - v_now)))::integer);
  end if;
end;
$$;

revoke all on function public.consume_share_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_share_rate_limit(text, text, integer, integer) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- copy_shared_material: one transaction for flashcard set or reviewer
-- ---------------------------------------------------------------------------
create or replace function public.copy_shared_material(p_share_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_payload json;
  v_type text;
  v_new_id uuid;
  v_item json;
  v_category json;
  v_term json;
  v_category_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_payload := public.get_shared_material(p_share_code, null);
  if v_payload is null then
    raise exception 'Shared material not found';
  end if;

  v_type := v_payload->>'type';

  if v_type = 'flashcard_set' then
    insert into public.flashcard_sets (user_id, title, color)
    values (
      v_user_id,
      coalesce(v_payload->'material'->>'title', 'Shared set') || ' (Copy)',
      '#E0F2FE'
    )
    returning id into v_new_id;

    for v_item in select * from json_array_elements(coalesce(v_payload->'items', '[]'::json))
    loop
      insert into public.flashcards (set_id, user_id, front, back, status)
      values (
        v_new_id,
        v_user_id,
        coalesce(v_item->>'front', v_item->>'term', ''),
        coalesce(v_item->>'back', v_item->>'definition', ''),
        'new'
      );
    end loop;

    perform public.increment_stat('flashcard_sets_created', 1);

    return jsonb_build_object(
      'success', true,
      'materialId', v_new_id,
      'materialType', 'flashcard_set',
      'redirectUrl', '/materials/' || v_new_id
    );
  elsif v_type = 'reviewer' then
    insert into public.reviewers (user_id, title, extraction_mode)
    values (
      v_user_id,
      coalesce(v_payload->'material'->>'title', 'Shared reviewer') || ' (Copy)',
      coalesce(v_payload->'material'->>'extraction_mode', 'full')
    )
    returning id into v_new_id;

    for v_category in select * from json_array_elements(coalesce(v_payload->'categories', '[]'::json))
    loop
      insert into public.reviewer_categories (reviewer_id, user_id, name, color)
      values (
        v_new_id,
        v_user_id,
        coalesce(v_category->>'name', 'Category'),
        coalesce(v_category->>'color', '#E0F2FE')
      )
      returning id into v_category_id;

      for v_term in select * from json_array_elements(coalesce(v_category->'terms', '[]'::json))
      loop
        insert into public.reviewer_terms (category_id, user_id, term, definition, examples, keywords)
        values (
          v_category_id,
          v_user_id,
          coalesce(v_term->>'term', ''),
          coalesce(v_term->>'definition', ''),
          coalesce(array(select json_array_elements_text(coalesce(v_term->'examples', '[]'::json))), '{}'),
          coalesce(array(select json_array_elements_text(coalesce(v_term->'keywords', '[]'::json))), '{}')
        );
      end loop;
    end loop;

    perform public.increment_stat('reviewers_created', 1);

    return jsonb_build_object(
      'success', true,
      'materialId', v_new_id,
      'materialType', 'reviewer',
      'redirectUrl', '/materials/' || v_new_id
    );
  end if;

  raise exception 'Unknown material type';
end;
$$;

revoke all on function public.copy_shared_material(text) from public;
grant execute on function public.copy_shared_material(text) to authenticated;
