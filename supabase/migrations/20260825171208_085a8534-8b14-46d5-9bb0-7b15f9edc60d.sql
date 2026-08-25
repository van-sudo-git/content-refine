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
           destination_url = 'https://nowweseeyou.org/gallery/' || NEW.slug
     WHERE profile_slug = OLD.slug;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_profile_qr_redirect_on_slug_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_profile_qr_redirect_on_slug_change() FROM anon;
REVOKE ALL ON FUNCTION private.sync_profile_qr_redirect_on_slug_change() FROM authenticated;

DROP POLICY IF EXISTS "Journalists can create their profile redirect" ON public.redirects;
CREATE POLICY "Journalists can create their profile redirect"
ON public.redirects
FOR INSERT
TO authenticated
WITH CHECK (
  active = true
  AND destination_url = 'https://nowweseeyou.org/gallery/' || profile_slug
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
  AND destination_url = 'https://nowweseeyou.org/gallery/' || profile_slug
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.slug = profile_slug
      AND private.can_journalist_manage_qr(p.id, auth.uid())
  )
);

UPDATE public.redirects
   SET destination_url = 'https://nowweseeyou.org/gallery/'
     || substring(destination_url from length('https://nowweseeyou.lovable.app/gallery/') + 1)
 WHERE destination_url LIKE 'https://nowweseeyou.lovable.app/gallery/%';