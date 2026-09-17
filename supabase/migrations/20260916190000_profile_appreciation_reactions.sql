create table public.profile_reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_id text not null,
  reaction_type text not null default 'appreciate',
  created_at timestamptz not null default now(),

  constraint profile_reactions_type_check
    check (reaction_type = 'appreciate'),

  constraint profile_reactions_unique_visitor
    unique (profile_id, visitor_id, reaction_type)
);

create index profile_reactions_profile_id_idx
  on public.profile_reactions(profile_id);

alter table public.profile_reactions enable row level security;


-- Public pages can ask for the count and whether this browser has reacted,
-- without receiving the underlying visitor IDs.
create or replace function public.get_profile_appreciation_state(
  p_profile_id uuid,
  p_visitor_id text
)
returns table (
  appreciation_count bigint,
  appreciated boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(r.id)::bigint as appreciation_count,
    coalesce(
      bool_or(r.visitor_id = p_visitor_id),
      false
    ) as appreciated
  from public.profile_reactions r
  where r.profile_id = p_profile_id
    and r.reaction_type = 'appreciate'
    and exists (
      select 1
      from public.profiles p
      where p.id = p_profile_id
        and p.status = 'published'
    );
$$;


-- Toggle one anonymous browser's appreciation.
-- Reactions are allowed only on published profiles.
create or replace function public.toggle_profile_appreciation(
  p_profile_id uuid,
  p_visitor_id text
)
returns table (
  appreciation_count bigint,
  appreciated boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exists boolean;
  v_appreciated boolean;
begin
  if p_visitor_id is null
     or length(trim(p_visitor_id)) < 10
     or length(p_visitor_id) > 100 then
    raise exception 'Invalid visitor identifier';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.status = 'published'
  ) then
    raise exception 'Profile is not available';
  end if;

  -- Serialize toggles for the same profile + visitor pair.
  perform pg_advisory_xact_lock(
    hashtext(p_profile_id::text),
    hashtext(p_visitor_id)
  );

  select exists (
    select 1
    from public.profile_reactions r
    where r.profile_id = p_profile_id
      and r.visitor_id = p_visitor_id
      and r.reaction_type = 'appreciate'
  )
  into v_exists;

  if v_exists then
    delete from public.profile_reactions r
    where r.profile_id = p_profile_id
      and r.visitor_id = p_visitor_id
      and r.reaction_type = 'appreciate';

    v_appreciated := false;
  else
    insert into public.profile_reactions (
      profile_id,
      visitor_id,
      reaction_type
    )
    values (
      p_profile_id,
      p_visitor_id,
      'appreciate'
    );

    v_appreciated := true;
  end if;

  return query
  select
    count(r.id)::bigint,
    v_appreciated
  from public.profile_reactions r
  where r.profile_id = p_profile_id
    and r.reaction_type = 'appreciate';
end;
$$;


-- Prevent direct table access from public clients.
revoke all on table public.profile_reactions from anon, authenticated;

-- SECURITY DEFINER functions default to EXECUTE for PUBLIC,
-- so revoke that explicitly before granting only the intended roles.
revoke all on function public.get_profile_appreciation_state(uuid, text)
  from public;

revoke all on function public.toggle_profile_appreciation(uuid, text)
  from public;

grant execute on function public.get_profile_appreciation_state(uuid, text)
  to anon, authenticated;

grant execute on function public.toggle_profile_appreciation(uuid, text)
  to anon, authenticated;