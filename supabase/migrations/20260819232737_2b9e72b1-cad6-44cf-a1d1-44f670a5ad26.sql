CREATE OR REPLACE FUNCTION public.attach_profile_to_nomination_image()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_id IS NULL AND NEW.nomination_id IS NOT NULL THEN
    SELECT p.id INTO NEW.profile_id
    FROM public.profiles p
    WHERE p.nomination_id = NEW.nomination_id
    ORDER BY p.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_profile_to_nomination_image() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_profile_to_nomination_image() FROM anon;
REVOKE ALL ON FUNCTION public.attach_profile_to_nomination_image() FROM authenticated;

DROP TRIGGER IF EXISTS attach_profile_to_nomination_image ON public.profile_images;
CREATE TRIGGER attach_profile_to_nomination_image
BEFORE INSERT ON public.profile_images
FOR EACH ROW
EXECUTE FUNCTION public.attach_profile_to_nomination_image();