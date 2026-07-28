ALTER TABLE public.club_roles
  ADD COLUMN email text,
  ALTER COLUMN user_id DROP NOT NULL,
  ADD CONSTRAINT club_roles_user_or_email_present
    CHECK (user_id IS NOT NULL OR email IS NOT NULL);

CREATE UNIQUE INDEX club_roles_school_role_email_uniq
  ON public.club_roles (school_id, role, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX club_roles_email_idx
  ON public.club_roles (lower(email));