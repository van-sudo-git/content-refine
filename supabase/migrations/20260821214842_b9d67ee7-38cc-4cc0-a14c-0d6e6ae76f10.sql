ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reflection_video_url text,
  ADD COLUMN IF NOT EXISTS reflection_quote text,
  ADD COLUMN IF NOT EXISTS reflection_recorded_date date;

CREATE OR REPLACE FUNCTION public.sync_nomination_status_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.nomination_id IS NOT NULL
     AND NEW.status = 'published'
     AND coalesce(OLD.status, '') <> 'published' THEN
    UPDATE public.nominations
    SET status = 'published'::public.nomination_status,
        updated_at = now()
    WHERE id = NEW.nomination_id
      AND status <> 'published'::public.nomination_status;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_nomination_status_on_publish() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_nomination_status_on_publish() TO service_role;

DROP TRIGGER IF EXISTS profiles_sync_nomination_publish ON public.profiles;
CREATE TRIGGER profiles_sync_nomination_publish
AFTER INSERT OR UPDATE OF status, nomination_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_nomination_status_on_publish();

UPDATE public.nominations n
SET status = 'published'::public.nomination_status,
    updated_at = now()
FROM public.profiles p
WHERE p.nomination_id = n.id
  AND p.status = 'published'
  AND n.status <> 'published'::public.nomination_status;