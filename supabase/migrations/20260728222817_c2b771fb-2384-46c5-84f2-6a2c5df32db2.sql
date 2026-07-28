
-- Ensure pg_net is available for trigger HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =========================
-- Enums
-- =========================
CREATE TYPE public.club_role AS ENUM ('journalist','photographer','artist','pr');
CREATE TYPE public.nomination_status AS ENUM ('pending','approved','assigned','in_progress','submitted','published');

-- =========================
-- club_roles table
-- =========================
CREATE TABLE public.club_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.club_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id, role)
);
CREATE INDEX club_roles_school_role_idx ON public.club_roles (school_id, role);
CREATE INDEX club_roles_user_idx ON public.club_roles (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_roles TO authenticated;
GRANT ALL ON public.club_roles TO service_role;

ALTER TABLE public.club_roles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_club_roles_updated_at
  BEFORE UPDATE ON public.club_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Helper functions (private schema)
-- =========================
CREATE OR REPLACE FUNCTION private.has_club_role(_user_id uuid, _school_id uuid, _role public.club_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role = _role
  );
$$;

-- =========================
-- RLS: club_roles
-- =========================
CREATE POLICY "Users view own club roles"
  ON public.club_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "School admins view club roles"
  ON public.club_roles FOR SELECT TO authenticated
  USING (private.is_school_admin(auth.jwt() ->> 'email', school_id));

CREATE POLICY "Global admins view all club roles"
  ON public.club_roles FOR SELECT TO authenticated
  USING (private.is_global_admin(auth.jwt() ->> 'email'));

CREATE POLICY "School admins manage club roles"
  ON public.club_roles FOR ALL TO authenticated
  USING (private.is_school_admin(auth.jwt() ->> 'email', school_id))
  WITH CHECK (private.is_school_admin(auth.jwt() ->> 'email', school_id));

CREATE POLICY "Global admins manage all club roles"
  ON public.club_roles FOR ALL TO authenticated
  USING (private.is_global_admin(auth.jwt() ->> 'email'))
  WITH CHECK (private.is_global_admin(auth.jwt() ->> 'email'));

-- =========================
-- flyers table
-- =========================
CREATE TABLE public.flyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id),
  redirect_id text REFERENCES public.redirects(id) ON DELETE SET NULL,
  file_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX flyers_school_idx ON public.flyers (school_id);
CREATE INDEX flyers_profile_idx ON public.flyers (profile_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flyers TO authenticated;
GRANT ALL ON public.flyers TO service_role;

ALTER TABLE public.flyers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_flyers_updated_at
  BEFORE UPDATE ON public.flyers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "PR and admins view flyers"
  ON public.flyers FOR SELECT TO authenticated
  USING (
    private.has_club_role(auth.uid(), school_id, 'pr'::public.club_role)
    OR private.is_school_admin(auth.jwt() ->> 'email', school_id)
    OR private.is_global_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "PR and admins insert flyers"
  ON public.flyers FOR INSERT TO authenticated
  WITH CHECK (
    private.has_club_role(auth.uid(), school_id, 'pr'::public.club_role)
    OR private.is_school_admin(auth.jwt() ->> 'email', school_id)
    OR private.is_global_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "PR and admins update flyers"
  ON public.flyers FOR UPDATE TO authenticated
  USING (
    private.has_club_role(auth.uid(), school_id, 'pr'::public.club_role)
    OR private.is_school_admin(auth.jwt() ->> 'email', school_id)
    OR private.is_global_admin(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    private.has_club_role(auth.uid(), school_id, 'pr'::public.club_role)
    OR private.is_school_admin(auth.jwt() ->> 'email', school_id)
    OR private.is_global_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins delete flyers"
  ON public.flyers FOR DELETE TO authenticated
  USING (
    private.is_school_admin(auth.jwt() ->> 'email', school_id)
    OR private.is_global_admin(auth.jwt() ->> 'email')
  );

-- =========================
-- profiles: PR read policy
-- =========================
CREATE POLICY "PR can view all school profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    school_id IS NOT NULL
    AND private.has_club_role(auth.uid(), school_id, 'pr'::public.club_role)
  );

-- =========================
-- nominations: assignment columns + status enum
-- =========================
ALTER TABLE public.nominations
  ADD COLUMN journalist_id   uuid REFERENCES public.club_roles(id) ON DELETE SET NULL,
  ADD COLUMN photographer_id uuid REFERENCES public.club_roles(id) ON DELETE SET NULL,
  ADD COLUMN artist_id       uuid REFERENCES public.club_roles(id) ON DELETE SET NULL;

-- Swap status text -> nomination_status enum with backfill
ALTER TABLE public.nominations ADD COLUMN status_new public.nomination_status NOT NULL DEFAULT 'pending';

UPDATE public.nominations
   SET status_new = CASE lower(status)
     WHEN 'approved' THEN 'approved'::public.nomination_status
     WHEN 'pending'  THEN 'pending'::public.nomination_status
     ELSE 'pending'::public.nomination_status
   END;

ALTER TABLE public.nominations DROP COLUMN status;
ALTER TABLE public.nominations RENAME COLUMN status_new TO status;

CREATE INDEX nominations_status_idx ON public.nominations (status);

-- can_read_nomination helper (avoids recursive RLS through club_roles)
CREATE OR REPLACE FUNCTION private.can_read_nomination(_nomination_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    JOIN public.club_roles cr
      ON cr.id = n.journalist_id
      OR cr.id = n.photographer_id
      OR cr.id = n.artist_id
    WHERE n.id = _nomination_id
      AND cr.user_id = _user_id
  );
$$;

CREATE POLICY "Assigned members view nomination"
  ON public.nominations FOR SELECT TO authenticated
  USING (private.can_read_nomination(id, auth.uid()));

-- =========================
-- Status-change trigger -> edge functions via pg_net
-- =========================
CREATE OR REPLACE FUNCTION public.notify_nomination_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved'::public.nomination_status THEN
    fn_url := 'https://mxhkpmqaoifrufzpqszl.supabase.co/functions/v1/notify-nomination-assigned';
  ELSIF NEW.status = 'published'::public.nomination_status THEN
    fn_url := 'https://mxhkpmqaoifrufzpqszl.supabase.co/functions/v1/notify-nomination-published';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('nomination_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER nominations_status_notify
  AFTER UPDATE OF status ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.notify_nomination_status_change();
