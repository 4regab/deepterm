-- 007_folders_normalize_security_definer.sql
-- Notes for live DB (do not replay 001-003). Helpers live in private;
-- search_path = ''; GRANT EXECUTE only to authenticated (never PUBLIC).
--
-- STATUS: APPLIED to lopurzvtignkqyubqgtz as migration
-- folders_normalize_security_definer. Do not re-run it blindly.
--
-- Bug: private.folders_normalize() was SECURITY INVOKER and called
-- private.sanitize_folder_name(). authenticated has no USAGE on schema
-- private (002), so INSERT/UPDATE on public.folders failed with
-- "permission denied for schema private". Folder create/rename in the
-- library and create wizard were broken.
--
-- auth.uid() still reads the session JWT under SECURITY DEFINER, so the
-- user_id pin stays honest. sanitize_folder_name stays revoked from
-- authenticated; only the definer (postgres) executes it.

create or replace function private.folders_normalize()
returns trigger
language plpgsql
security definer
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

revoke all on function private.folders_normalize() from public;
revoke all on function private.folders_normalize() from anon;
grant execute on function private.folders_normalize() to authenticated;
