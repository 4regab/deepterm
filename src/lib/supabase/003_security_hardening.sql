-- Applied remotely via Supabase MCP (project lopurzvtignkqyubqgtz).
-- Do not re-run blindly; these grants already exist in production.
--
-- 1) revoke_anon_execute_on_user_rpcs
--    SECURITY DEFINER functions:
--      private.*  -> service_role only
--      public blog/share reads -> anon + authenticated + service_role
--      remaining public RPCs -> authenticated + service_role
-- 2) revoke_authenticated_from_admin_rpcs
--      admin_cancel_account_deletion, admin_reset_ai_usage,
--      finalize_account_deletions -> service_role only
--
-- The live database already had SET search_path = '' on SECURITY DEFINER
-- functions and RLS enabled on every public table.

do $$
declare
  fn record;
  public_read text[] := array[
    'get_published_posts',
    'get_post_by_slug',
    'get_category_post_counts',
    'get_shared_material'
  ];
  admin_only text[] := array[
    'admin_cancel_account_deletion',
    'admin_reset_ai_usage',
    'finalize_account_deletions'
  ];
begin
  for fn in
    select p.oid::regprocedure as sig, p.proname, n.nspname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
  loop
    execute format('revoke all on function %s from public', fn.sig);

    if fn.nspname = 'private' or fn.proname = any(admin_only) then
      execute format('revoke all on function %s from anon, authenticated', fn.sig);
      execute format('grant execute on function %s to service_role', fn.sig);
    elsif fn.proname = any(public_read) then
      execute format('grant execute on function %s to anon, authenticated, service_role', fn.sig);
    else
      execute format('revoke all on function %s from anon', fn.sig);
      execute format('grant execute on function %s to authenticated, service_role', fn.sig);
    end if;
  end loop;
end $$;
