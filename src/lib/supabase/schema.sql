-- ============================================
-- DeepTerm Learning Platform - Complete Database Schema
-- Single Source of Truth
-- Generated: 2024
-- ============================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This file consolidates all schema definitions, functions, and policies
-- ============================================

-- ============================================
-- SECTION 1: CORE TABLES
-- ============================================

-- 1.1 PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

create index if not exists profiles_id_idx on public.profiles using btree (id);

-- 1.2 MATERIALS TABLE (uploaded study materials)
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text,
  file_url text,
  file_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.materials enable row level security;

create policy "Users can view own materials" on public.materials for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own materials" on public.materials for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own materials" on public.materials for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own materials" on public.materials for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists materials_user_id_idx on public.materials using btree (user_id);

-- 1.3 FLASHCARD SETS TABLE
create table if not exists public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  color text default '#E0F2FE',
  last_studied timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.flashcard_sets enable row level security;

create policy "Users can view own flashcard sets" on public.flashcard_sets for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own flashcard sets" on public.flashcard_sets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own flashcard sets" on public.flashcard_sets for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own flashcard sets" on public.flashcard_sets for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists flashcard_sets_user_id_idx on public.flashcard_sets using btree (user_id);

-- 1.4 FLASHCARDS TABLE
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references public.flashcard_sets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  status text default 'new' check (status in ('new', 'learning', 'review', 'mastered')),
  last_reviewed timestamptz,
  created_at timestamptz default now()
);

alter table public.flashcards enable row level security;

create policy "Users can view own flashcards" on public.flashcards for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own flashcards" on public.flashcards for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own flashcards" on public.flashcards for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own flashcards" on public.flashcards for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists flashcards_set_id_idx on public.flashcards using btree (set_id);
create index if not exists flashcards_user_id_idx on public.flashcards using btree (user_id);


-- 1.5 QUIZZES TABLE
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  source_content text,
  question_types text[] default array['multipleChoice', 'trueFalse'],
  verbatim boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quizzes enable row level security;

create policy "Users can view own quizzes" on public.quizzes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own quizzes" on public.quizzes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own quizzes" on public.quizzes for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own quizzes" on public.quizzes for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists quizzes_user_id_idx on public.quizzes using btree (user_id);

-- 1.6 QUIZ QUESTIONS TABLE
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('multipleChoice', 'trueFalse', 'fillBlank', 'combined')),
  question text not null,
  options jsonb,
  correct_answer text not null,
  explanation text,
  created_at timestamptz default now()
);

alter table public.quiz_questions enable row level security;

create policy "Users can view own quiz questions" on public.quiz_questions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own quiz questions" on public.quiz_questions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own quiz questions" on public.quiz_questions for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own quiz questions" on public.quiz_questions for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions using btree (quiz_id);
create index if not exists quiz_questions_user_id_idx on public.quiz_questions using btree (user_id);

-- 1.7 QUIZ ATTEMPTS TABLE
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer not null,
  total_questions integer not null,
  percentage integer not null,
  answers jsonb,
  completed_at timestamptz default now()
);

alter table public.quiz_attempts enable row level security;

create policy "Users can view own quiz attempts" on public.quiz_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own quiz attempts" on public.quiz_attempts for insert to authenticated with check ((select auth.uid()) = user_id);

create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts using btree (quiz_id);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts using btree (user_id);

-- 1.8 REVIEWERS TABLE (extracted terms/definitions)
create table if not exists public.reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  source_content text,
  extraction_mode text default 'full' check (extraction_mode in ('full', 'sentence', 'keywords')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reviewers enable row level security;

create policy "Users can view own reviewers" on public.reviewers for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own reviewers" on public.reviewers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own reviewers" on public.reviewers for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own reviewers" on public.reviewers for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists reviewers_user_id_idx on public.reviewers using btree (user_id);

-- 1.9 REVIEWER CATEGORIES TABLE
create table if not exists public.reviewer_categories (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references public.reviewers(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#E0F2FE',
  created_at timestamptz default now()
);

alter table public.reviewer_categories enable row level security;

create policy "Users can view own reviewer categories" on public.reviewer_categories for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own reviewer categories" on public.reviewer_categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own reviewer categories" on public.reviewer_categories for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own reviewer categories" on public.reviewer_categories for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists reviewer_categories_reviewer_id_idx on public.reviewer_categories using btree (reviewer_id);
create index if not exists reviewer_categories_user_id_idx on public.reviewer_categories using btree (user_id);

-- 1.10 REVIEWER TERMS TABLE
create table if not exists public.reviewer_terms (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.reviewer_categories(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  term text not null,
  definition text not null,
  examples text[],
  keywords text[],
  created_at timestamptz default now()
);

alter table public.reviewer_terms enable row level security;

create policy "Users can view own reviewer terms" on public.reviewer_terms for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own reviewer terms" on public.reviewer_terms for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own reviewer terms" on public.reviewer_terms for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own reviewer terms" on public.reviewer_terms for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists reviewer_terms_category_id_idx on public.reviewer_terms using btree (category_id);
create index if not exists reviewer_terms_user_id_idx on public.reviewer_terms using btree (user_id);


-- ============================================
-- SECTION 2: ACTIVITY & STATS TABLES
-- ============================================

-- 2.1 POMODORO SESSIONS TABLE
create table if not exists public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  phase text not null check (phase in ('work', 'shortBreak', 'longBreak')),
  duration_minutes integer not null,
  completed boolean default true,
  started_at timestamptz not null,
  ended_at timestamptz default now()
);

alter table public.pomodoro_sessions enable row level security;

create policy "Users can view own pomodoro sessions" on public.pomodoro_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own pomodoro sessions" on public.pomodoro_sessions for insert to authenticated with check ((select auth.uid()) = user_id);

create index if not exists pomodoro_sessions_user_id_idx on public.pomodoro_sessions using btree (user_id);
create index if not exists pomodoro_sessions_ended_at_idx on public.pomodoro_sessions using btree (ended_at);

-- 2.2 STUDY ACTIVITY TABLE (daily tracking)
create table if not exists public.study_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_date date not null,
  minutes_studied integer default 0,
  flashcards_reviewed integer default 0,
  quizzes_completed integer default 0,
  pomodoro_sessions integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, activity_date)
);

alter table public.study_activity enable row level security;

create policy "Users can view own study activity" on public.study_activity for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own study activity" on public.study_activity for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own study activity" on public.study_activity for update to authenticated using ((select auth.uid()) = user_id);

create index if not exists study_activity_user_id_idx on public.study_activity using btree (user_id);
create index if not exists study_activity_date_idx on public.study_activity using btree (activity_date);

-- 2.3 USER STATS TABLE (aggregated statistics with XP system)
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_study_minutes integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  flashcard_sets_created integer default 0,
  flashcards_mastered integer default 0,
  quizzes_completed integer default 0,
  perfect_quizzes integer default 0,
  pomodoro_sessions integer default 0,
  reviewers_created integer default 0,
  materials_uploaded integer default 0,
  total_xp integer default 0,
  current_level integer default 1,
  updated_at timestamptz default now()
);

alter table public.user_stats enable row level security;

create policy "Users can view own stats" on public.user_stats for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own stats" on public.user_stats for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own stats" on public.user_stats for update to authenticated using ((select auth.uid()) = user_id);

-- ============================================
-- SECTION 3: ACHIEVEMENTS SYSTEM
-- ============================================

-- 3.1 ACHIEVEMENTS DEFINITION TABLE
create table if not exists public.achievement_definitions (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  color text not null,
  bg text not null,
  requirement_type text not null,
  requirement_value integer not null,
  created_at timestamptz default now()
);

alter table public.achievement_definitions enable row level security;

create policy "Authenticated users can view achievement definitions" on public.achievement_definitions for select to authenticated using (true);

-- 3.2 USER ACHIEVEMENTS TABLE
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text references public.achievement_definitions(id) on delete cascade not null,
  progress integer default 0,
  unlocked boolean default false,
  unlocked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "Users can view own achievements" on public.user_achievements for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own achievements" on public.user_achievements for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own achievements" on public.user_achievements for update to authenticated using ((select auth.uid()) = user_id);

create index if not exists user_achievements_user_id_idx on public.user_achievements using btree (user_id);


-- ============================================
-- SECTION 4: AI USAGE & RATE LIMITING
-- ============================================

-- 4.1 AI USAGE TABLE
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  generation_count integer default 0,
  reset_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.ai_usage enable row level security;

create policy "Users can view own ai usage" on public.ai_usage for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own ai usage" on public.ai_usage for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own ai usage" on public.ai_usage for update to authenticated using ((select auth.uid()) = user_id);

create index if not exists ai_usage_user_id_idx on public.ai_usage using btree (user_id);

-- 4.2 UNLIMITED USERS TABLE (admin/whitelist)
create table if not exists public.unlimited_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.unlimited_users enable row level security;

-- SECURITY FIX (VULN-002): Users can only check their own unlimited status
-- Previous policy allowed anonymous enumeration of all premium users
create policy "Users can check own unlimited status" on public.unlimited_users for select to authenticated using ((select auth.uid()) = user_id);

-- ============================================
-- SECTION 5: MATERIAL SHARING
-- ============================================

-- 5.1 MATERIAL SHARES TABLE
create table if not exists public.material_shares (
  id uuid primary key default gen_random_uuid(),
  share_code text unique not null,
  material_type text not null check (material_type in ('flashcard_set', 'reviewer')),
  material_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists material_shares_code_idx on public.material_shares using btree (share_code);
create index if not exists material_shares_material_idx on public.material_shares using btree (material_type, material_id);
create index if not exists material_shares_user_idx on public.material_shares using btree (user_id);

alter table public.material_shares enable row level security;

create policy "Users can view own shares" on public.material_shares for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own shares" on public.material_shares for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own shares" on public.material_shares for update to authenticated using ((select auth.uid()) = user_id);
create policy "Users can delete own shares" on public.material_shares for delete to authenticated using ((select auth.uid()) = user_id);
-- SECURITY FIX (VULN-001): Removed anonymous SELECT policy that exposed all share codes, user IDs, and material IDs
-- Share access is now exclusively through the secure get_shared_material() RPC function


-- ============================================
-- SECTION 6: FUNCTIONS - XP SYSTEM
-- ============================================

-- 6.1 Calculate level from XP (100 XP per level, increasing by 50 each level)
create or replace function public.calculate_level(p_xp integer)
returns integer
language plpgsql
as $$
declare
  v_level integer := 1;
  v_xp_needed integer := 100;
  v_remaining_xp integer := p_xp;
begin
  while v_remaining_xp >= v_xp_needed loop
    v_remaining_xp := v_remaining_xp - v_xp_needed;
    v_level := v_level + 1;
    v_xp_needed := v_xp_needed + 50;
  end loop;
  return v_level;
end;
$$;

-- 6.2 Get XP needed for next level
create or replace function public.get_xp_for_level(p_level integer)
returns integer
language plpgsql
as $$
begin
  return 100 + (p_level - 1) * 50;
end;
$$;

-- 6.3 Get current XP progress within level
create or replace function public.get_xp_in_current_level(p_total_xp integer)
returns integer
language plpgsql
as $$
declare
  v_level integer := 1;
  v_xp_needed integer := 100;
  v_remaining_xp integer := p_total_xp;
begin
  while v_remaining_xp >= v_xp_needed loop
    v_remaining_xp := v_remaining_xp - v_xp_needed;
    v_level := v_level + 1;
    v_xp_needed := v_xp_needed + 50;
  end loop;
  return v_remaining_xp;
end;
$$;

-- 6.4 Add XP and update level (with input validation)
create or replace function public.add_xp(p_amount integer)
returns table(new_total_xp integer, new_level integer, xp_in_level integer, xp_for_next integer, leveled_up boolean)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_level integer;
  v_new_total_xp integer;
  v_new_level integer;
begin
  -- INPUT VALIDATION: Restrict XP amount to reasonable bounds (1-100)
  if p_amount < 1 or p_amount > 100 then
    raise exception 'Invalid XP amount. Must be between 1 and 100.';
  end if;
  
  select current_level into v_old_level from public.user_stats where user_id = v_user_id;
  
  update public.user_stats 
  set total_xp = total_xp + p_amount,
      current_level = public.calculate_level(total_xp + p_amount),
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

-- 6.5 Get user XP stats
create or replace function public.get_user_xp_stats()
returns table(total_xp integer, current_level integer, xp_in_level integer, xp_for_next integer)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_xp integer;
  v_level integer;
begin
  select us.total_xp, us.current_level 
  into v_total_xp, v_level 
  from public.user_stats us 
  where us.user_id = v_user_id;
  
  v_total_xp := coalesce(v_total_xp, 0);
  v_level := coalesce(v_level, 1);
  
  return query select 
    v_total_xp,
    v_level,
    public.get_xp_in_current_level(v_total_xp),
    public.get_xp_for_level(v_level);
end;
$$;

grant execute on function public.calculate_level(integer) to authenticated;
grant execute on function public.get_xp_for_level(integer) to authenticated;
grant execute on function public.get_xp_in_current_level(integer) to authenticated;
grant execute on function public.add_xp(integer) to authenticated;
grant execute on function public.get_user_xp_stats() to authenticated;


-- ============================================
-- SECTION 7: FUNCTIONS - USER MANAGEMENT
-- ============================================

-- 7.1 Handle new user signup (auto-create profile and stats)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  
  insert into public.user_stats (user_id) values (new.id);
  
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7.2 Delete user account
create or replace function public.delete_user()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_user() to authenticated;

-- ============================================
-- SECTION 8: FUNCTIONS - STUDY TRACKING
-- ============================================

-- 8.1 Update study streak (with timezone support)
create or replace function public.update_study_streak(p_user_id uuid, p_local_date date default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_last_date date;
  v_current_streak integer;
  v_longest_streak integer;
  v_today date := coalesce(p_local_date, current_date);
begin
  select last_study_date, current_streak, longest_streak
  into v_last_date, v_current_streak, v_longest_streak
  from public.user_stats
  where user_id = p_user_id;
  
  if v_last_date is null then
    v_current_streak := 1;
  elsif v_last_date = v_today then
    null; -- Same day, no change
  elsif v_last_date = v_today - interval '1 day' then
    v_current_streak := v_current_streak + 1;
  elsif v_last_date < v_today - interval '1 day' then
    v_current_streak := 1;
  end if;
  
  if v_current_streak > coalesce(v_longest_streak, 0) then
    v_longest_streak := v_current_streak;
  end if;
  
  update public.user_stats
  set current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_study_date = v_today,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function public.update_study_streak(uuid, date) to authenticated;

-- 8.2 Record study activity (with timezone support)
create or replace function public.record_study_activity(
  p_minutes integer default 0,
  p_flashcards integer default 0,
  p_quizzes integer default 0,
  p_pomodoros integer default 0,
  p_activity_date date default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := coalesce(p_activity_date, current_date);
begin
  insert into public.study_activity (user_id, activity_date, minutes_studied, flashcards_reviewed, quizzes_completed, pomodoro_sessions)
  values (v_user_id, v_today, p_minutes, p_flashcards, p_quizzes, p_pomodoros)
  on conflict (user_id, activity_date)
  do update set
    minutes_studied = public.study_activity.minutes_studied + p_minutes,
    flashcards_reviewed = public.study_activity.flashcards_reviewed + p_flashcards,
    quizzes_completed = public.study_activity.quizzes_completed + p_quizzes,
    pomodoro_sessions = public.study_activity.pomodoro_sessions + p_pomodoros,
    updated_at = now();
  
  update public.user_stats
  set total_study_minutes = total_study_minutes + p_minutes,
      quizzes_completed = user_stats.quizzes_completed + p_quizzes,
      pomodoro_sessions = user_stats.pomodoro_sessions + p_pomodoros,
      updated_at = now()
  where user_id = v_user_id;
  
  perform public.update_study_streak(v_user_id, v_today);
  perform public.check_achievements();
end;
$$;

grant execute on function public.record_study_activity(integer, integer, integer, integer, date) to authenticated;

-- 8.3 Get study activity for calendar
create or replace function public.get_study_calendar(p_year integer default null)
returns table (
  activity_date date,
  minutes_studied integer,
  level integer
)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_year integer := coalesce(p_year, extract(year from current_date)::integer);
begin
  return query
  select 
    sa.activity_date,
    sa.minutes_studied,
    case 
      when sa.minutes_studied = 0 then 0
      when sa.minutes_studied < 30 then 1
      when sa.minutes_studied < 60 then 2
      when sa.minutes_studied < 120 then 3
      else 4
    end as level
  from public.study_activity sa
  where sa.user_id = auth.uid()
    and extract(year from sa.activity_date) = v_year
  order by sa.activity_date;
end;
$$;

grant execute on function public.get_study_calendar(integer) to authenticated;


-- ============================================
-- SECTION 9: FUNCTIONS - ACHIEVEMENTS
-- ============================================

-- 9.1 Check and update achievements
create or replace function public.check_achievements()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
  v_achievement record;
  v_progress integer;
begin
  select * into v_stats from public.user_stats where user_id = v_user_id;
  
  for v_achievement in select * from public.achievement_definitions loop
    case v_achievement.requirement_type
      when 'flashcard_sets_created' then v_progress := v_stats.flashcard_sets_created;
      when 'flashcards_mastered' then v_progress := v_stats.flashcards_mastered;
      when 'quizzes_completed' then v_progress := v_stats.quizzes_completed;
      when 'perfect_quizzes' then v_progress := v_stats.perfect_quizzes;
      when 'study_streak' then v_progress := v_stats.current_streak;
      when 'pomodoro_sessions' then v_progress := v_stats.pomodoro_sessions;
      when 'total_study_minutes' then v_progress := v_stats.total_study_minutes;
      when 'reviewers_created' then v_progress := v_stats.reviewers_created;
      when 'materials_uploaded' then v_progress := v_stats.materials_uploaded;
      else v_progress := 0;
    end case;
    
    insert into public.user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at)
    values (
      v_user_id,
      v_achievement.id,
      least(v_progress, v_achievement.requirement_value),
      v_progress >= v_achievement.requirement_value,
      case when v_progress >= v_achievement.requirement_value then now() else null end
    )
    on conflict (user_id, achievement_id)
    do update set
      progress = least(v_progress, v_achievement.requirement_value),
      unlocked = v_progress >= v_achievement.requirement_value,
      unlocked_at = case 
        when v_progress >= v_achievement.requirement_value and public.user_achievements.unlocked_at is null 
        then now() 
        else public.user_achievements.unlocked_at 
      end,
      updated_at = now();
  end loop;
end;
$$;

grant execute on function public.check_achievements() to authenticated;

-- 9.2 Get user achievements with definitions
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
security definer set search_path = ''
as $$
begin
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
  left join public.user_achievements ua on ua.achievement_id = ad.id and ua.user_id = auth.uid()
  order by ua.unlocked desc nulls last, ad.id;
end;
$$;

grant execute on function public.get_user_achievements() to authenticated;

-- 9.3 Increment user stat (with whitelist validation)
create or replace function public.increment_stat(p_stat_name text, p_amount integer default 1)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_safe_amount integer;
  v_user_id uuid := auth.uid();
begin
  -- Bounds checking: clamp between 1 and 100
  if p_amount is null or p_amount < 1 then
    v_safe_amount := 1;
  elsif p_amount > 100 then
    v_safe_amount := 100;
  else
    v_safe_amount := p_amount;
  end if;

  -- Whitelist validation
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
      return; -- Invalid stat name, fail silently
  end case;
  
  perform public.check_achievements();
end;
$$;

grant execute on function public.increment_stat(text, integer) to authenticated;


-- ============================================
-- SECTION 10: FUNCTIONS - AI RATE LIMITING
-- ============================================

-- 10.1 Increment AI usage
create or replace function public.increment_ai_usage(p_user_id uuid, p_date date)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.ai_usage (user_id, generation_count, reset_date)
  values (p_user_id, 1, p_date)
  on conflict (user_id)
  do update set
    generation_count = case 
      when public.ai_usage.reset_date = p_date 
      then public.ai_usage.generation_count + 1
      else 1
    end,
    reset_date = p_date,
    updated_at = now();
end;
$$;

grant execute on function public.increment_ai_usage(uuid, date) to authenticated;

-- 10.2 Atomic check and increment AI usage (prevents race conditions)
create or replace function public.check_and_increment_ai_usage(
  p_user_id uuid,
  p_date date,
  p_limit integer
)
returns table(allowed boolean, new_count integer)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_count integer;
begin
  -- Input validation
  if p_limit is null or p_limit < 1 then
    p_limit := 10;
  elsif p_limit > 100 then
    p_limit := 100;
  end if;

  -- Atomic upsert and check
  insert into public.ai_usage (user_id, generation_count, reset_date)
  values (p_user_id, 1, p_date)
  on conflict (user_id)
  do update set
    generation_count = case 
      when public.ai_usage.reset_date = p_date 
      then public.ai_usage.generation_count + 1
      else 1
    end,
    reset_date = p_date,
    updated_at = now()
  returning generation_count into v_count;
  
  return query select (v_count <= p_limit), v_count;
end;
$$;

grant execute on function public.check_and_increment_ai_usage(uuid, date, integer) to authenticated;

-- ============================================
-- SECTION 11: FUNCTIONS - MATERIAL SHARING
-- ============================================

-- 11.1 Check if flashcard_set is shared
create or replace function public.is_flashcard_set_shared(set_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.material_shares 
    where material_type = 'flashcard_set' 
    and material_id = set_id 
    and is_active = true
  );
$$;

-- 11.2 Check if reviewer is shared
create or replace function public.is_reviewer_shared(reviewer_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.material_shares 
    where material_type = 'reviewer' 
    and material_id = reviewer_id 
    and is_active = true
  );
$$;

-- 11.3 Generate share code
create or replace function public.generate_share_code(length integer default 8)
returns text
language plpgsql
set search_path = ''
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
begin
  for i in 1..length loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

grant execute on function public.generate_share_code(integer) to authenticated;

-- 11.4 Get shared material data
create or replace function public.get_shared_material(p_share_code text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_share record;
  v_result json;
begin
  select * into v_share 
  from public.material_shares 
  where share_code = p_share_code and is_active = true;
  
  if not found then
    return null;
  end if;
  
  if v_share.material_type = 'flashcard_set' then
    select json_build_object(
      'type', 'flashcard_set',
      'share', json_build_object(
        'id', v_share.id,
        'code', v_share.share_code,
        'created_at', v_share.created_at
      ),
      'material', json_build_object(
        'id', fs.id,
        'title', fs.title,
        'created_at', fs.created_at
      ),
      'items', coalesce((
        select json_agg(json_build_object(
          'id', f.id,
          'front', f.front,
          'back', f.back
        ) order by f.created_at)
        from public.flashcards f
        where f.set_id = fs.id
      ), '[]'::json),
      'owner', json_build_object(
        'name', coalesce(p.full_name, 'Anonymous'),
        'avatar', p.avatar_url
      )
    ) into v_result
    from public.flashcard_sets fs
    left join public.profiles p on p.id = fs.user_id
    where fs.id = v_share.material_id;
    
  elsif v_share.material_type = 'reviewer' then
    select json_build_object(
      'type', 'reviewer',
      'share', json_build_object(
        'id', v_share.id,
        'code', v_share.share_code,
        'created_at', v_share.created_at
      ),
      'material', json_build_object(
        'id', r.id,
        'title', r.title,
        'extraction_mode', r.extraction_mode,
        'created_at', r.created_at
      ),
      'categories', coalesce((
        select json_agg(json_build_object(
          'id', rc.id,
          'name', rc.name,
          'color', rc.color,
          'terms', coalesce((
            select json_agg(json_build_object(
              'id', rt.id,
              'term', rt.term,
              'definition', rt.definition,
              'examples', rt.examples,
              'keywords', rt.keywords
            ) order by rt.created_at)
            from public.reviewer_terms rt
            where rt.category_id = rc.id
          ), '[]'::json)
        ) order by rc.created_at)
        from public.reviewer_categories rc
        where rc.reviewer_id = r.id
      ), '[]'::json),
      'owner', json_build_object(
        'name', coalesce(p.full_name, 'Anonymous'),
        'avatar', p.avatar_url
      )
    ) into v_result
    from public.reviewers r
    left join public.profiles p on p.id = r.user_id
    where r.id = v_share.material_id;
  end if;
  
  return v_result;
end;
$$;

grant execute on function public.get_shared_material(text) to anon;


-- ============================================
-- SECTION 12: PUBLIC ACCESS POLICIES FOR SHARED MATERIALS
-- ============================================

-- Allow anon to view shared flashcard_sets
create policy "Anyone can view shared flashcard sets" on public.flashcard_sets
  for select to anon
  using (public.is_flashcard_set_shared(id));

-- Allow anon to view flashcards of shared sets
create policy "Anyone can view flashcards of shared sets" on public.flashcards
  for select to anon
  using (public.is_flashcard_set_shared(set_id));

-- Allow anon to view shared reviewers
create policy "Anyone can view shared reviewers" on public.reviewers
  for select to anon
  using (public.is_reviewer_shared(id));

-- Allow anon to view categories of shared reviewers
create policy "Anyone can view categories of shared reviewers" on public.reviewer_categories
  for select to anon
  using (public.is_reviewer_shared(reviewer_id));

-- Allow anon to view terms of shared reviewers (via category)
create policy "Anyone can view terms of shared reviewers" on public.reviewer_terms
  for select to anon
  using (
    exists (
      select 1 from public.reviewer_categories rc
      where rc.id = category_id
      and public.is_reviewer_shared(rc.reviewer_id)
    )
  );

-- ============================================
-- SECTION 13: STORAGE BUCKET
-- ============================================

insert into storage.buckets (id, name, public) values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "Users can upload own materials" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view own materials" on storage.objects
  for select to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own materials" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- SECTION 14: ACHIEVEMENT DEFINITIONS DATA (60 achievements from production)
-- ============================================

-- Note: Use INSERT ... ON CONFLICT for idempotent inserts
-- FLASHCARD MASTERY ACHIEVEMENTS (6)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('flash_master_10', 'Memory Starter', 'Master 10 flashcards', 'BrainCircuit', 'text-green-600', 'bg-green-100', 'flashcards_mastered', 10),
('flash_master_50', 'Memory Builder', 'Master 50 flashcards', 'BrainCircuit', 'text-green-600', 'bg-green-100', 'flashcards_mastered', 50),
('flash_master_100', 'Flashcard Master', 'Master 100 flashcards', 'BrainCircuit', 'text-teal-600', 'bg-teal-100', 'flashcards_mastered', 100),
('flash_master_250', 'Memory Expert', 'Master 250 flashcards', 'BrainCircuit', 'text-cyan-600', 'bg-cyan-100', 'flashcards_mastered', 250),
('flash_master_500', 'Memory Champion', 'Master 500 flashcards', 'Trophy', 'text-yellow-600', 'bg-yellow-100', 'flashcards_mastered', 500),
('flash_master_1000', 'Memory Legend', 'Master 1000 flashcards', 'Trophy', 'text-orange-600', 'bg-orange-100', 'flashcards_mastered', 1000)
on conflict (id) do nothing;

-- FLASHCARD SET ACHIEVEMENTS (4)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('flash_set_1', 'First Steps', 'Create your first flashcard set', 'Zap', 'text-blue-600', 'bg-blue-100', 'flashcard_sets_created', 1),
('flash_set_5', 'Card Collector', 'Create 5 flashcard sets', 'Zap', 'text-blue-600', 'bg-blue-100', 'flashcard_sets_created', 5),
('flash_set_10', 'Deck Builder', 'Create 10 flashcard sets', 'Zap', 'text-indigo-600', 'bg-indigo-100', 'flashcard_sets_created', 10),
('flash_set_25', 'Card Architect', 'Create 25 flashcard sets', 'Zap', 'text-purple-600', 'bg-purple-100', 'flashcard_sets_created', 25)
on conflict (id) do nothing;

-- MATERIAL UPLOAD ACHIEVEMENTS (5)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('material_1', 'First Upload', 'Upload your first study material', 'Upload', 'text-cyan-600', 'bg-cyan-100', 'materials_uploaded', 1),
('material_5', 'Resource Gatherer', 'Upload 5 study materials', 'Upload', 'text-cyan-600', 'bg-cyan-100', 'materials_uploaded', 5),
('material_10', 'Material Master', 'Upload 10 study materials', 'Upload', 'text-teal-600', 'bg-teal-100', 'materials_uploaded', 10),
('material_25', 'Library Builder', 'Upload 25 study materials', 'Upload', 'text-teal-600', 'bg-teal-100', 'materials_uploaded', 25),
('material_50', 'Archive Keeper', 'Upload 50 study materials', 'Trophy', 'text-yellow-600', 'bg-yellow-100', 'materials_uploaded', 50)
on conflict (id) do nothing;

-- POMODORO ACHIEVEMENTS (10)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('pomo_1', 'Focus Beginner', 'Complete your first pomodoro session', 'Timer', 'text-green-600', 'bg-green-100', 'pomodoro_sessions', 1),
('pomo_10', 'Getting Focused', 'Complete 10 pomodoro sessions', 'Timer', 'text-green-600', 'bg-green-100', 'pomodoro_sessions', 10),
('pomo_25', 'Focus Enthusiast', 'Complete 25 pomodoro sessions', 'Timer', 'text-green-600', 'bg-green-100', 'pomodoro_sessions', 25),
('pomo_50', 'Focus Pro', 'Complete 50 pomodoro sessions', 'Timer', 'text-teal-600', 'bg-teal-100', 'pomodoro_sessions', 50),
('pomo_100', 'Century Focus', 'Complete 100 pomodoro sessions', 'Timer', 'text-teal-600', 'bg-teal-100', 'pomodoro_sessions', 100),
('pomo_250', 'Focus Master', 'Complete 250 pomodoro sessions', 'Timer', 'text-cyan-600', 'bg-cyan-100', 'pomodoro_sessions', 250),
('pomo_500', 'Deep Work Expert', 'Complete 500 pomodoro sessions', 'Timer', 'text-cyan-600', 'bg-cyan-100', 'pomodoro_sessions', 500),
('pomo_1000', 'Focus Legend', 'Complete 1000 pomodoro sessions', 'Zap', 'text-yellow-600', 'bg-yellow-100', 'pomodoro_sessions', 1000),
('pomo_2500', 'Productivity Guru', 'Complete 2500 pomodoro sessions', 'Zap', 'text-orange-600', 'bg-orange-100', 'pomodoro_sessions', 2500),
('pomo_5000', 'Time Lord', 'Complete 5000 pomodoro sessions', 'Trophy', 'text-red-600', 'bg-red-100', 'pomodoro_sessions', 5000)
on conflict (id) do nothing;

-- QUIZ COMPLETION ACHIEVEMENTS (5)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('quiz_1', 'Quiz Starter', 'Complete your first quiz', 'BrainCircuit', 'text-purple-600', 'bg-purple-100', 'quizzes_completed', 1),
('quiz_10', 'Quiz Taker', 'Complete 10 quizzes', 'BrainCircuit', 'text-purple-600', 'bg-purple-100', 'quizzes_completed', 10),
('quiz_25', 'Quiz Enthusiast', 'Complete 25 quizzes', 'BrainCircuit', 'text-indigo-600', 'bg-indigo-100', 'quizzes_completed', 25),
('quiz_50', 'Quiz Pro', 'Complete 50 quizzes', 'BrainCircuit', 'text-indigo-600', 'bg-indigo-100', 'quizzes_completed', 50),
('quiz_100', 'Quiz Master', 'Complete 100 quizzes', 'Star', 'text-yellow-600', 'bg-yellow-100', 'quizzes_completed', 100)
on conflict (id) do nothing;

-- PERFECT QUIZ ACHIEVEMENTS (5)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('quiz_perfect_1', 'Perfect Score', 'Score 100% on a quiz', 'Star', 'text-amber-600', 'bg-amber-100', 'perfect_quizzes', 1),
('quiz_perfect_5', 'Quiz Ace', 'Score 100% on 5 quizzes', 'Star', 'text-amber-600', 'bg-amber-100', 'perfect_quizzes', 5),
('quiz_perfect_10', 'Perfectionist', 'Score 100% on 10 quizzes', 'Star', 'text-yellow-600', 'bg-yellow-100', 'perfect_quizzes', 10),
('quiz_perfect_25', 'Flawless', 'Score 100% on 25 quizzes', 'Trophy', 'text-yellow-600', 'bg-yellow-100', 'perfect_quizzes', 25),
('quiz_perfect_50', 'Quiz Legend', 'Score 100% on 50 quizzes', 'Trophy', 'text-orange-600', 'bg-orange-100', 'perfect_quizzes', 50)
on conflict (id) do nothing;

-- REVIEWER ACHIEVEMENTS (5)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('reviewer_1', 'Note Taker', 'Create your first reviewer', 'FileText', 'text-teal-600', 'bg-teal-100', 'reviewers_created', 1),
('reviewer_5', 'Note Collector', 'Create 5 reviewers', 'FileText', 'text-teal-600', 'bg-teal-100', 'reviewers_created', 5),
('reviewer_10', 'Note Organizer', 'Create 10 reviewers', 'FileText', 'text-cyan-600', 'bg-cyan-100', 'reviewers_created', 10),
('reviewer_25', 'Note Master', 'Create 25 reviewers', 'FileText', 'text-cyan-600', 'bg-cyan-100', 'reviewers_created', 25),
('reviewer_50', 'Documentation Pro', 'Create 50 reviewers', 'FileText', 'text-blue-600', 'bg-blue-100', 'reviewers_created', 50)
on conflict (id) do nothing;

-- STREAK ACHIEVEMENTS (10)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('streak_3', '3 Day Streak', 'Study for 3 consecutive days', 'Flame', 'text-orange-600', 'bg-orange-100', 'study_streak', 3),
('streak_7', 'Week Warrior', 'Study for 7 consecutive days', 'Flame', 'text-orange-600', 'bg-orange-100', 'study_streak', 7),
('streak_14', 'Two Week Champion', 'Study for 14 consecutive days', 'Flame', 'text-orange-600', 'bg-orange-100', 'study_streak', 14),
('streak_21', 'Habit Former', 'Study for 21 consecutive days', 'Flame', 'text-red-600', 'bg-red-100', 'study_streak', 21),
('streak_30', 'Monthly Master', 'Study for 30 consecutive days', 'Flame', 'text-red-600', 'bg-red-100', 'study_streak', 30),
('streak_60', 'Two Month Titan', 'Study for 60 consecutive days', 'Flame', 'text-red-600', 'bg-red-100', 'study_streak', 60),
('streak_90', 'Quarter Champion', 'Study for 90 consecutive days', 'Star', 'text-yellow-600', 'bg-yellow-100', 'study_streak', 90),
('streak_180', 'Half Year Hero', 'Study for 180 consecutive days', 'Star', 'text-yellow-600', 'bg-yellow-100', 'study_streak', 180),
('streak_365', 'Year Long Legend', 'Study for 365 consecutive days', 'Trophy', 'text-yellow-600', 'bg-yellow-100', 'study_streak', 365),
('streak_500', 'Unstoppable', 'Study for 500 consecutive days', 'Trophy', 'text-red-600', 'bg-red-100', 'study_streak', 500)
on conflict (id) do nothing;

-- STUDY TIME ACHIEVEMENTS (10)
insert into public.achievement_definitions (id, title, description, icon, color, bg, requirement_type, requirement_value) values
('study_1hr', 'First Hour', 'Study for 1 hour total', 'Clock', 'text-blue-600', 'bg-blue-100', 'total_study_minutes', 60),
('study_5hr', 'Getting Started', 'Study for 5 hours total', 'Clock', 'text-blue-600', 'bg-blue-100', 'total_study_minutes', 300),
('study_10hr', 'Dedicated Learner', 'Study for 10 hours total', 'Clock', 'text-indigo-600', 'bg-indigo-100', 'total_study_minutes', 600),
('study_25hr', 'Committed Student', 'Study for 25 hours total', 'Clock', 'text-indigo-600', 'bg-indigo-100', 'total_study_minutes', 1500),
('study_50hr', 'Knowledge Seeker', 'Study for 50 hours total', 'BookOpen', 'text-purple-600', 'bg-purple-100', 'total_study_minutes', 3000),
('study_100hr', 'Century Club', 'Study for 100 hours total', 'BookOpen', 'text-purple-600', 'bg-purple-100', 'total_study_minutes', 6000),
('study_250hr', 'Scholar', 'Study for 250 hours total', 'BookOpen', 'text-yellow-600', 'bg-yellow-100', 'total_study_minutes', 15000),
('study_500hr', 'Academic', 'Study for 500 hours total', 'Trophy', 'text-yellow-600', 'bg-yellow-100', 'total_study_minutes', 30000),
('study_1000hr', 'Grandmaster', 'Study for 1000 hours total', 'Trophy', 'text-orange-600', 'bg-orange-100', 'total_study_minutes', 60000),
('study_2000hr', 'Legend', 'Study for 2000 hours total', 'Star', 'text-red-600', 'bg-red-100', 'total_study_minutes', 120000)
on conflict (id) do nothing;

-- ============================================
-- END OF SCHEMA
-- ============================================
