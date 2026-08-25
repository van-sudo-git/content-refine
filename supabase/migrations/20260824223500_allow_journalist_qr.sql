-- Journalist QR generation with the same tracked redirect used by Admin.
--
-- Goals:
--   * Assigned Journalist can generate/refresh QR only for their own draft profile.
--   * QR image management is limited to image_type = 'qr'.
--   * QR files are limited to profile-qr/<profile_id>/... in the public bucket.
--   * Redirect rows remain the analytics entry point used by qr-redirect.
--   * If a saved profile slug changes, existing physical QR codes keep working:
--     the redirect id stays stable while its destination/profile_slug are updated.

CREATE OR REPLACE FUNCTION private.can_journalist_manage_qr(
  _profile_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.nominations n ON n.id = p.nomination_id
    JOIN public.club_roles cr ON cr.id = n.journalist_id
    WHERE p.id = _profile_id
      AND p.status <> 'published'
      AND cr.user_id = _user_id
      AND cr.role = 'journalist'::public.club_role
  );
$$;

REVOKE ALL ON FUNCTION private.can_journalist_manage_qr(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_journalist_manage_qr(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.can_journalist_manage_qr(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_journalist_manage_qr(uuid, uuid) TO service_role;

-- Keep a durable QR redirect working when the public profile slug changes.
-- The redirect row's id is intentionally NOT changed because that id is encoded
-- in already-printed QR codes and is also the key used by redirect analytics.
CREATE OR REPLACE FUNCTION private.sync_profile_qr_redirect_on_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    UPDATE public.redirects
       SET profile_slug = NEW.slug,
           destination_url = 'https://nowweseeyou.lovable.app/gallery/' || NEW.slug
     WHERE profile_slug = OLD.slug;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_profile_qr_redirect_on_slug_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_profile_qr_redirect_on_slug_change() FROM anon;
REVOKE ALL ON FUNCTION private.sync_profile_qr_redirect_on_slug_change() FROM authenticated;

DROP TRIGGER IF EXISTS profiles_sync_qr_redirect_slug ON public.profiles;
CREATE TRIGGER profiles_sync_qr_redirect_slug
AFTER UPDATE OF slug ON public.profiles
FOR EACH ROW
WHEN (NEW.slug IS DISTINCT FROM OLD.slug)
EXECUTE FUNCTION private.sync_profile_qr_redirect_on_slug_change();

-- Journalist may read/update an existing QR row (including one created by Admin)
-- and insert a QR row if the profile does not have one yet.
GRANT SELECT, INSERT, UPDATE ON public.profile_images TO authenticated;

DROP POLICY IF EXISTS "Journalists can view their profile QR" ON public.profile_images;
CREATE POLICY "Journalists can view their profile QR"
ON public.profile_images
FOR SELECT
TO authenticated
USING (
  image_type = 'qr'
  AND profile_id IS NOT NULL
  AND private.can_journalist_manage_qr(profile_id, auth.uid())
);

DROP POLICY IF EXISTS "Journalists can add their profile QR" ON public.profile_images;
CREATE POLICY "Journalists can add their profile QR"
ON public.profile_images
FOR INSERT
TO authenticated
WITH CHECK (
  image_type = 'qr'
  AND profile_id IS NOT NULL
  AND nomination_id IS NULL
  AND private.can_journalist_manage_qr(profile_id, auth.uid())
);

DROP POLICY IF EXISTS "Journalists can update their profile QR" ON public.profile_images;
CREATE POLICY "Journalists can update their profile QR"
ON public.profile_images
FOR UPDATE
TO authenticated
USING (
  image_type = 'qr'
  AND profile_id IS NOT NULL
  AND private.can_journalist_manage_qr(profile_id, auth.uid())
)
WITH CHECK (
  image_type = 'qr'
  AND profile_id IS NOT NULL
  AND private.can_journalist_manage_qr(profile_id, auth.uid())
);

-- Newly generated Admin + Journalist QRs use profile-qr/<profile_id>/qr-*.png.
-- Admin already has broad storage access; this adds only the Journalist slice.
DROP POLICY IF EXISTS "Journalists can upload their profile QR files" ON storage.objects;
CREATE POLICY "Journalists can upload their profile QR files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'profile-qr'
  AND private.can_journalist_manage_qr(
    private.try_uuid((storage.foldername(name))[2]),
    auth.uid()
  )
);

DROP POLICY IF EXISTS "Journalists can delete their profile QR files" ON storage.objects;
CREATE POLICY "Journalists can delete their profile QR files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'profile-qr'
  AND private.can_journalist_manage_qr(
    private.try_uuid((storage.foldername(name))[2]),
    auth.uid()
  )
);

-- The redirect is the analytics boundary. qr-redirect receives ?id=<redirect id>
-- and increment_redirect_daily records every scan in redirect_events_daily.
GRANT SELECT, INSERT, UPDATE ON public.redirects TO authenticated;

DROP POLICY IF EXISTS "Journalists can view their profile redirects" ON public.redirects;
CREATE POLICY "Journalists can view their profile redirects"
ON public.redirects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.slug = profile_slug
      AND private.can_journalist_manage_qr(p.id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Journalists can create their profile redirect" ON public.redirects;
CREATE POLICY "Journalists can create their profile redirect"
ON public.redirects
FOR INSERT
TO authenticated
WITH CHECK (
  active = true
  AND destination_url = 'https://nowweseeyou.lovable.app/gallery/' || profile_slug
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.slug = profile_slug
      AND private.can_journalist_manage_qr(p.id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Journalists can update their profile redirect" ON public.redirects;
CREATE POLICY "Journalists can update their profile redirect"
ON public.redirects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.slug = profile_slug
      AND private.can_journalist_manage_qr(p.id, auth.uid())
  )
)
WITH CHECK (
  active = true
  AND destination_url = 'https://nowweseeyou.lovable.app/gallery/' || profile_slug
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.slug = profile_slug
      AND private.can_journalist_manage_qr(p.id, auth.uid())
  )
);