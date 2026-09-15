-- Publication consent for Now We See You profiles.
--
-- New profiles cannot be published until permission has been recorded.
-- Profiles that were already published before this migration are grandfathered.

alter table public.profiles
  add column if not exists consent_status text not null default 'not_requested',
  add column if not exists consent_requested_at timestamptz,
  add column if not exists consent_approved_at timestamptz,
  add column if not exists consent_method text;

alter table public.profiles
  add constraint profiles_consent_status_check
  check (
    consent_status in ('not_requested', 'requested', 'approved')
  );

alter table public.profiles
  add constraint profiles_consent_method_check
  check (
    consent_method is null
    or consent_method in ('approval_link', 'in_person', 'legacy')
  );


-- Existing published profiles were created before this workflow existed.
-- Preserve them and mark them as legacy-approved.
update public.profiles
set
  consent_status = 'approved',
  consent_approved_at = coalesce(created_at, now()),
  consent_method = 'legacy'
where status = 'published';


-- Each email request gets its own short-lived approval token.
-- Only a SHA-256 hash of the token is stored.
create table if not exists public.profile_consent_requests (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  email text not null,

  token_hash text not null unique,

  requested_at timestamptz not null default now(),

  approved_at timestamptz,

  expires_at timestamptz not null,

  invalidated_at timestamptz,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists profile_consent_requests_profile_id_idx
  on public.profile_consent_requests(profile_id);

create index if not exists profile_consent_requests_token_hash_idx
  on public.profile_consent_requests(token_hash);


-- Consent requests contain private email addresses and token hashes.
-- They must never be readable through the public API.
alter table public.profile_consent_requests enable row level security;


-- The service role used by Edge Functions bypasses RLS.
-- No anon policy is intentionally created.
--
-- Authenticated administrators do not need direct browser access to this
-- table. Requesting and approving consent happens through Edge Functions.


-- Database-level publication guard.
-- This protects the invariant even if a client bypasses the React UI.
create or replace function public.require_profile_publication_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
     and old.status is distinct from 'published'
     and new.consent_status is distinct from 'approved'
  then
    raise exception
      'Publication permission must be approved before this profile can be published.';
  end if;

  return new;
end;
$$;


drop trigger if exists require_profile_publication_consent
  on public.profiles;

create trigger require_profile_publication_consent
before update of status on public.profiles
for each row
execute function public.require_profile_publication_consent();


-- Also protect against somebody inserting a profile directly as published.
create or replace function public.require_new_profile_publication_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
     and new.consent_status is distinct from 'approved'
  then
    raise exception
      'Publication permission must be approved before this profile can be published.';
  end if;

  return new;
end;
$$;


drop trigger if exists require_new_profile_publication_consent
  on public.profiles;

create trigger require_new_profile_publication_consent
before insert on public.profiles
for each row
execute function public.require_new_profile_publication_consent();