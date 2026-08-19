-- 1. Link nominations to profiles
ALTER TABLE public.profiles
  ADD COLUMN nomination_id uuid REFERENCES public.nominations(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX profiles_nomination_id_key
  ON public.profiles (nomination_id)
  WHERE nomination_id IS NOT NULL;

-- 2. Human-readable name on club roles
ALTER TABLE public.club_roles ADD COLUMN name text;

-- 3. Allow images attached to a nomination before a profile exists
ALTER TABLE public.profile_images
  ADD COLUMN nomination_id uuid REFERENCES public.nominations(id) ON DELETE SET NULL;

ALTER TABLE public.profile_images ALTER COLUMN profile_id DROP NOT NULL;

ALTER TABLE public.profile_images
  ADD CONSTRAINT profile_images_target_present
  CHECK (profile_id IS NOT NULL OR nomination_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS profile_images_nomination_id_idx
  ON public.profile_images (nomination_id);

-- Assignment-based access for creative club roles, not gated on a profile row
CREATE POLICY "Photographers and artists can add nomination images"
  ON public.profile_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    nomination_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.nominations n
      JOIN public.club_roles cr
        ON cr.id IN (n.photographer_id, n.artist_id)
      WHERE n.id = profile_images.nomination_id
        AND cr.user_id = auth.uid()
        AND cr.role IN ('photographer'::public.club_role, 'artist'::public.club_role)
    )
  );

CREATE POLICY "Assigned club members can view nomination images"
  ON public.profile_images
  FOR SELECT
  TO authenticated
  USING (
    nomination_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.nominations n
      JOIN public.club_roles cr
        ON cr.id IN (n.journalist_id, n.photographer_id, n.artist_id)
      WHERE n.id = profile_images.nomination_id
        AND cr.user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers and artists can update nomination images"
  ON public.profile_images
  FOR UPDATE
  TO authenticated
  USING (
    nomination_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.nominations n
      JOIN public.club_roles cr
        ON cr.id IN (n.photographer_id, n.artist_id)
      WHERE n.id = profile_images.nomination_id
        AND cr.user_id = auth.uid()
        AND cr.role IN ('photographer'::public.club_role, 'artist'::public.club_role)
    )
  )
  WITH CHECK (
    nomination_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.nominations n
      JOIN public.club_roles cr
        ON cr.id IN (n.photographer_id, n.artist_id)
      WHERE n.id = profile_images.nomination_id
        AND cr.user_id = auth.uid()
        AND cr.role IN ('photographer'::public.club_role, 'artist'::public.club_role)
    )
  );

CREATE POLICY "Photographers and artists can delete nomination images"
  ON public.profile_images
  FOR DELETE
  TO authenticated
  USING (
    nomination_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.nominations n
      JOIN public.club_roles cr
        ON cr.id IN (n.photographer_id, n.artist_id)
      WHERE n.id = profile_images.nomination_id
        AND cr.user_id = auth.uid()
        AND cr.role IN ('photographer'::public.club_role, 'artist'::public.club_role)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_images TO authenticated;
GRANT ALL ON public.profile_images TO service_role;