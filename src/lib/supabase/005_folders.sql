-- 005_folders.sql
-- Notes for live DB (do not replay 001-003). Helpers live in private;
-- search_path = ''; GRANT only to authenticated (never PUBLIC).
--
-- STATUS: ALREADY APPLIED to lopurzvtignkqyubqgtz as migration
-- 20260825024810_folders_table_and_folder_id. This file is the in-repo record
-- of what is deployed, transcribed from supabase_migrations.schema_migrations
-- and verified against pg_constraint / pg_indexes / pg_policies. Do not re-run
-- it blindly.
--
-- Follow-up: 007_folders_normalize_security_definer.sql makes
-- private.folders_normalize() SECURITY DEFINER. The original invoker trigger
-- cannot call private.sanitize_folder_name() because authenticated has no
-- USAGE on schema private.
--
-- Supersedes the `add column if not exists folder text` lines that 004 once
-- carried. That flat text column was never applied and must not be added: the
-- deployed model is relational (public.folders + folder_id FKs).

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Name sanitizer. Mirrors sanitizeFolder() in src/utils/materialFolder.ts:
-- strip angle brackets, collapse whitespace, trim, cap at 40 chars, '' -> null.
-- ---------------------------------------------------------------------------
create or replace function private.sanitize_folder_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    left(
      btrim(regexp_replace(regexp_replace(coalesce(p_name, ''), '[<>]', '', 'g'), '\s+', ' ', 'g')),
      40
    ),
    ''
  );
$$;

revoke all on function private.sanitize_folder_name(text) from public;
revoke all on function private.sanitize_folder_name(text) from anon;
revoke all on function private.sanitize_folder_name(text) from authenticated;

-- ---------------------------------------------------------------------------
-- public.folders
-- ---------------------------------------------------------------------------
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint folders_name_len check (char_length(name) between 1 and 40)
);

-- Case-insensitive uniqueness per user. Duplicate create/rename -> SQLSTATE 23505.
create unique index if not exists folders_user_lower_name_idx
  on public.folders (user_id, lower(name));

create index if not exists folders_user_id_idx
  on public.folders (user_id, created_at desc);

alter table public.folders enable row level security;
alter table public.folders force row level security;

drop policy if exists folders_select_own on public.folders;
create policy folders_select_own
  on public.folders for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists folders_insert_own on public.folders;
create policy folders_insert_own
  on public.folders for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists folders_update_own on public.folders;
create policy folders_update_own
  on public.folders for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists folders_delete_own on public.folders;
create policy folders_delete_own
  on public.folders for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.folders from public;
revoke all on table public.folders from anon;
grant select, insert, update, delete on table public.folders to authenticated;

-- Normalizes the name and pins user_id to auth.uid() server-side, so the
-- client never gets to choose an owner. Runs BEFORE the RLS WITH CHECK.
-- Live copy is SECURITY DEFINER (see 007). Kept invoker here so this file
-- matches the original 20260825024810 migration text.
create or replace function private.folders_normalize()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  v_name := private.sanitize_folder_name(new.name);
  if v_name is null then
    raise exception 'Folder name is required';
  end if;
  new.name := v_name;
  if tg_op = 'INSERT' then
    new.user_id := v_uid;
  else
    if old.user_id is distinct from v_uid then
      raise exception 'Not authorized';
    end if;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists folders_normalize on public.folders;
create trigger folders_normalize
  before insert or update on public.folders
  for each row execute function private.folders_normalize();

-- ---------------------------------------------------------------------------
-- folder_id on the material tables.
-- ON DELETE SET NULL: deleting a folder unfiles its materials, never deletes them.
-- ---------------------------------------------------------------------------
alter table public.flashcard_sets
  add column if not exists folder_id uuid references public.folders(id) on delete set null;

alter table public.reviewers
  add column if not exists folder_id uuid references public.folders(id) on delete set null;

create index if not exists flashcard_sets_folder_id_idx
  on public.flashcard_sets (folder_id);

create index if not exists reviewers_folder_id_idx
  on public.reviewers (folder_id);

-- Blocks filing a material into someone else's folder. RLS alone would not:
-- folders_select_own hides the row, but the FK check runs as the system.
create or replace function private.assert_folder_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.folder_id is null then
    return new;
  end if;
  if not exists (
    select 1
    from public.folders f
    where f.id = new.folder_id
      and f.user_id = new.user_id
  ) then
    raise exception 'Folder not found';
  end if;
  return new;
end;
$$;

drop trigger if exists flashcard_sets_folder_owner on public.flashcard_sets;
create trigger flashcard_sets_folder_owner
  before insert or update of folder_id on public.flashcard_sets
  for each row execute function private.assert_folder_owner();

drop trigger if exists reviewers_folder_owner on public.reviewers;
create trigger reviewers_folder_owner
  before insert or update of folder_id on public.reviewers
  for each row execute function private.assert_folder_owner();
