-- 1. Storage access for assigned photographers/artists -----------------------
-- Files for a nomination live under `nominations/<nomination_id>/...`.
CREATE OR REPLACE FUNCTION private.is_nomination_media_editor(_nomination_id uuid, _user_id uuid)
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
      ON cr.id = n.photographer_id
      OR cr.id = n.artist_id
    WHERE n.id = _nomination_id
      AND cr.user_id = _user_id
      AND cr.role = ANY (ARRAY['photographer'::club_role, 'artist'::club_role])
  );
$$;

REVOKE ALL ON FUNCTION private.is_nomination_media_editor(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_nomination_media_editor(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_nomination_media_editor(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_nomination_media_editor(uuid, uuid) TO service_role;

-- Safe uuid cast for the 2nd path segment (skip non-uuid folder names).
CREATE OR REPLACE FUNCTION private.try_uuid(_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN _text::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.try_uuid(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.try_uuid(text) FROM anon;
GRANT EXECUTE ON FUNCTION private.try_uuid(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.try_uuid(text) TO service_role;

DROP POLICY IF EXISTS "Assigned photographers and artists can upload nomination files" ON storage.objects;
CREATE POLICY "Assigned photographers and artists can upload nomination files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'nominations'
  AND private.is_nomination_media_editor(
        private.try_uuid((storage.foldername(name))[2]), auth.uid())
);

DROP POLICY IF EXISTS "Assigned photographers and artists can update nomination files" ON storage.objects;
CREATE POLICY "Assigned photographers and artists can update nomination files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'nominations'
  AND private.is_nomination_media_editor(
        private.try_uuid((storage.foldername(name))[2]), auth.uid())
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'nominations'
  AND private.is_nomination_media_editor(
        private.try_uuid((storage.foldername(name))[2]), auth.uid())
);

DROP POLICY IF EXISTS "Assigned photographers and artists can delete nomination files" ON storage.objects;
CREATE POLICY "Assigned photographers and artists can delete nomination files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'nominations'
  AND private.is_nomination_media_editor(
        private.try_uuid((storage.foldername(name))[2]), auth.uid())
);

-- 3. Durable contributor attribution -----------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_contributors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_role_id uuid REFERENCES public.club_roles(id) ON DELETE SET NULL,
  contributor_name text NOT NULL,
  contribution_type club_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_contributors
  ADD CONSTRAINT profile_contributors_type_allowed
  CHECK (contribution_type IN ('journalist'::club_role, 'photographer'::club_role, 'artist'::club_role));

CREATE UNIQUE INDEX IF NOT EXISTS profile_contributors_unique_credit
  ON public.profile_contributors (profile_id, contribution_type, contributor_name);

GRANT SELECT ON public.profile_contributors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contributors TO authenticated;
GRANT ALL ON public.profile_contributors TO service_role;

ALTER TABLE public.profile_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributors of published profiles are public"
ON public.profile_contributors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_contributors.profile_id
      AND p.status = 'published'
  )
);

CREATE POLICY "Admins can manage profile contributors"
ON public.profile_contributors FOR ALL TO authenticated
USING (private.is_any_school_admin(auth.jwt() ->> 'email'))
WITH CHECK (private.is_any_school_admin(auth.jwt() ->> 'email'));

-- 2. Attach nomination images + snapshot contributors on profile creation ----
CREATE OR REPLACE FUNCTION public.link_nomination_assets_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.nomination_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- attach any images already uploaded against the nomination; nomination_id is kept
  UPDATE public.profile_images
     SET profile_id = NEW.id
   WHERE nomination_id = NEW.nomination_id
     AND (profile_id IS NULL OR profile_id IS DISTINCT FROM NEW.id);

  -- durable snapshot of the assigned contributors' names
  INSERT INTO public.profile_contributors (profile_id, club_role_id, contributor_name, contribution_type)
  SELECT NEW.id, cr.id, cr.name, t.contribution_type
    FROM public.nominations n
    CROSS JOIN LATERAL (
      VALUES
        (n.journalist_id, 'journalist'::club_role),
        (n.photographer_id, 'photographer'::club_role),
        (n.artist_id, 'artist'::club_role)
    ) AS t(club_role_id, contribution_type)
    JOIN public.club_roles cr ON cr.id = t.club_role_id
   WHERE n.id = NEW.nomination_id
     AND cr.name IS NOT NULL
     AND length(btrim(cr.name)) > 0
  ON CONFLICT (profile_id, contribution_type, contributor_name) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_link_nomination_assets ON public.profiles;
CREATE TRIGGER profiles_link_nomination_assets
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_nomination_assets_to_profile();

DROP TRIGGER IF EXISTS profiles_link_nomination_assets_upd ON public.profiles;
CREATE TRIGGER profiles_link_nomination_assets_upd
AFTER UPDATE OF nomination_id ON public.profiles
FOR EACH ROW
WHEN (NEW.nomination_id IS NOT NULL AND NEW.nomination_id IS DISTINCT FROM OLD.nomination_id)
EXECUTE FUNCTION public.link_nomination_assets_to_profile();
