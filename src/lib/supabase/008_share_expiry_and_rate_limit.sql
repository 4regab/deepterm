-- 008_share_expiry_and_rate_limit.sql
-- FIND-003 / FIND-004 remediations.
-- Helpers that are not PostgREST entry points stay in private;
-- search_path = ''; GRANT EXECUTE explicitly (never PUBLIC).
--
-- Apply via Supabase migration tooling. Do not replay 001–007.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Share expiry column (was omitted from applied 006)
-- ---------------------------------------------------------------------------
alter table public.material_shares
  add column if not exists expires_at timestamptz;

create index if not exists material_shares_expires_at_idx
  on public.material_shares (expires_at)
  where is_active = true and expires_at is not null;

-- ---------------------------------------------------------------------------
-- Durable share rate-limit table
-- ---------------------------------------------------------------------------
create table if not exists private.share_rate_limits (
  bucket text not null,
  identifier_hash text not null,
  window_start timestamptz not null default now(),
  hit_count integer not null default 1,
  primary key (bucket, identifier_hash)
);

revoke all on table private.share_rate_limits from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Active + unexpired share predicate (private helpers used by RLS / internal)
-- ---------------------------------------------------------------------------
create or replace function private.is_flashcard_set_shared(set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.material_shares
    where material_type = 'flashcard_set'
      and material_id = set_id
      and is_active = true
      and (expires_at is null or expires_at > now())
  );
$$;

create or replace function private.is_reviewer_shared(reviewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.material_shares
    where material_type = 'reviewer'
      and material_id = reviewer_id
      and is_active = true
      and (expires_at is null or expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- get_shared_material: enforce expires_at
-- ---------------------------------------------------------------------------
create or replace function public.get_shared_material(
  p_share_code text,
  p_identifier_hash text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_share record;
  v_result json;
  v_recent_count integer;
  v_rate_limit constant integer := 30;
  v_window constant interval := interval '1 minute';
begin
  if p_identifier_hash is not null and char_length(p_identifier_hash) > 0 then
    select count(*) into v_recent_count
    from public.share_lookup_log
    where identifier_hash = p_identifier_hash
      and looked_up_at > now() - v_window;

    if v_recent_count >= v_rate_limit then
      insert into public.share_lookup_log (identifier_hash, share_code, found)
      values (p_identifier_hash, null, false);
      return null;
    end if;
  end if;

  select * into v_share
  from public.material_shares
  where share_code = p_share_code
    and is_active = true
    and (expires_at is null or expires_at > now());

  if not found then
    insert into public.share_lookup_log (identifier_hash, share_code, found)
    values (coalesce(p_identifier_hash, ''), p_share_code, false);
    return null;
  end if;

  if v_share.material_type = 'flashcard_set' then
    select json_build_object(
      'type', 'flashcard_set',
      'share', json_build_object(
        'id', v_share.id,
        'code', v_share.share_code,
        'created_at', v_share.created_at,
        'expires_at', v_share.expires_at
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
        'created_at', v_share.created_at,
        'expires_at', v_share.expires_at
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

  insert into public.share_lookup_log (identifier_hash, share_code, found)
  values (coalesce(p_identifier_hash, ''), p_share_code, true);

  return v_result;
end;
$$;

revoke all on function public.get_shared_material(text, text) from public;
grant execute on function public.get_shared_material(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Durable consume_share_rate_limit (PostgREST entry point for app callers)
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
-- copy_shared_material: pass identity hash + honour expiry via get_shared_material
-- ---------------------------------------------------------------------------
drop function if exists public.copy_shared_material(text);

create or replace function public.copy_shared_material(
  p_share_code text,
  p_identifier_hash text default null
)
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

  -- Rate limiting is enforced by the app via consume_share_rate_limit before
  -- this RPC; get_shared_material still receives the identity hash for lookup RL + expiry.
  v_payload := public.get_shared_material(p_share_code, p_identifier_hash);
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

revoke all on function public.copy_shared_material(text, text) from public;
grant execute on function public.copy_shared_material(text, text) to authenticated;

notify pgrst, 'reload schema';
