-- 006_srs_columns_and_ai_refund.sql
-- Notes for live DB (do not replay 001-003). Helpers live in private;
-- search_path = ''; GRANT EXECUTE only to authenticated (never PUBLIC).
--
-- STATUS: APPLIED to lopurzvtignkqyubqgtz as migration
-- srs_columns_ai_refund_practice_sessions. This is the in-repo record of the
-- additive pieces from 004 that were still missing: flashcard SRS columns,
-- practice_sessions, and refund_ai_usage. Do not re-run it blindly.
--
-- Intentionally omitted from 004: increment_stat / add_xp / record_study_activity
-- replacements, copy_shared_material, consume_share_rate_limit, expires_at.
-- Those either already exist live or have app-level fallbacks.

create schema if not exists private;

alter table public.flashcards
  add column if not exists ease_factor numeric not null default 2.5,
  add column if not exists interval_days integer not null default 0,
  add column if not exists repetitions integer not null default 0,
  add column if not exists due_at timestamptz not null default now();

create index if not exists flashcards_user_due_at_idx
  on public.flashcards (user_id, due_at);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
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
revoke all on function public.refund_ai_usage() from anon;
grant execute on function public.refund_ai_usage() to authenticated;

revoke all on function private.refund_ai_usage() from public;
revoke all on function private.refund_ai_usage() from anon;
revoke all on function private.refund_ai_usage() from authenticated;
