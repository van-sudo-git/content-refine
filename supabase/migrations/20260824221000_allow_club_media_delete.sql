-- Club media deletion:
-- Artist -> portrait
-- Photographer -> additional
-- Journalist -> portrait or additional
-- No club deletion once the linked profile is published.

CREATE OR REPLACE FUNCTION private.can_delete_nomination_image(
  _nomination_id uuid,
  _image_type text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.nomination_id = _nomination_id
        AND p.status = 'published'
    )
    AND EXISTS (
      SELECT 1
      FROM public.nominations n

      LEFT JOIN public.club_roles journalist
        ON journalist.id = n.journalist_id

      LEFT JOIN public.club_roles photographer
        ON photographer.id = n.photographer_id

      LEFT JOIN public.club_roles artist
        ON artist.id = n.artist_id

      WHERE n.id = _nomination_id
        AND (
          (
            journalist.user_id = _user_id
            AND journalist.role = 'journalist'::public.club_role
            AND _image_type IN ('portrait', 'additional')
          )
          OR
          (
            artist.user_id = _user_id
            AND artist.role = 'artist'::public.club_role
            AND _image_type = 'portrait'
          )
          OR
          (
            photographer.user_id = _user_id
            AND photographer.role = 'photographer'::public.club_role
            AND _image_type = 'additional'
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION private.can_delete_nomination_image(uuid, text, uuid)
FROM PUBLIC;

REVOKE ALL ON FUNCTION private.can_delete_nomination_image(uuid, text, uuid)
FROM anon;

GRANT EXECUTE ON FUNCTION private.can_delete_nomination_image(uuid, text, uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION private.can_delete_nomination_image(uuid, text, uuid)
TO service_role;


DROP POLICY IF EXISTS
  "Photographers and artists can delete nomination images"
ON public.profile_images;

DROP POLICY IF EXISTS
  "Assigned club members can delete nomination images"
ON public.profile_images;

CREATE POLICY "Assigned club members can delete nomination images"
ON public.profile_images
FOR DELETE
TO authenticated
USING (
  nomination_id IS NOT NULL
  AND private.can_delete_nomination_image(
    nomination_id,
    image_type,
    auth.uid()
  )
);


-- Storage paths are:
-- nominations/<nomination_id>/...
--
-- Storage cannot tell portrait vs additional from the path,
-- so it checks assignment + unpublished state.
-- profile_images above enforces the image-type restriction.

CREATE OR REPLACE FUNCTION private.can_delete_nomination_file(
  _nomination_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.nomination_id = _nomination_id
        AND p.status = 'published'
    )
    AND EXISTS (
      SELECT 1
      FROM public.nominations n

      LEFT JOIN public.club_roles journalist
        ON journalist.id = n.journalist_id

      LEFT JOIN public.club_roles photographer
        ON photographer.id = n.photographer_id

      LEFT JOIN public.club_roles artist
        ON artist.id = n.artist_id

      WHERE n.id = _nomination_id
        AND (
          (
            journalist.user_id = _user_id
            AND journalist.role = 'journalist'::public.club_role
          )
          OR
          (
            photographer.user_id = _user_id
            AND photographer.role = 'photographer'::public.club_role
          )
          OR
          (
            artist.user_id = _user_id
            AND artist.role = 'artist'::public.club_role
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION private.can_delete_nomination_file(uuid, uuid)
FROM PUBLIC;

REVOKE ALL ON FUNCTION private.can_delete_nomination_file(uuid, uuid)
FROM anon;

GRANT EXECUTE ON FUNCTION private.can_delete_nomination_file(uuid, uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION private.can_delete_nomination_file(uuid, uuid)
TO service_role;


DROP POLICY IF EXISTS
  "Assigned photographers and artists can delete nomination files"
ON storage.objects;

DROP POLICY IF EXISTS
  "Assigned club members can delete nomination files"
ON storage.objects;

CREATE POLICY "Assigned club members can delete nomination files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = 'nominations'
  AND private.can_delete_nomination_file(
    private.try_uuid((storage.foldername(name))[2]),
    auth.uid()
  )
);