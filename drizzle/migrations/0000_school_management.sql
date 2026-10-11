ALTER TABLE public.schools
  ADD COLUMN display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN archived boolean NOT NULL DEFAULT false;

WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY name, id)::integer AS position
  FROM public.schools
)
UPDATE public.schools s SET display_order = ranked.position
FROM ranked WHERE s.id = ranked.id;

CREATE OR REPLACE FUNCTION private.guard_school_management()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.display_order IS DISTINCT FROM OLD.display_order
     OR NEW.archived IS DISTINCT FROM OLD.archived THEN
     IF NOT COALESCE(private.is_global_admin(auth.jwt() ->> 'email'), false) THEN
      RAISE EXCEPTION 'Only global admins can change school order or archive schools.';
    END IF;
  END IF;
  IF NEW.archived THEN NEW.accepting_nominations := false; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_school_management
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION private.guard_school_management();

CREATE OR REPLACE FUNCTION public.reorder_schools(p_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE active_count integer;
BEGIN
  IF NOT COALESCE(private.is_global_admin(auth.jwt() ->> 'email'), false) THEN
    RAISE EXCEPTION 'Global admin access required.';
  END IF;
  LOCK TABLE public.schools IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO active_count FROM public.schools WHERE archived = false;
  IF p_ids IS NULL
     OR cardinality(p_ids) <> active_count
     OR (SELECT count(DISTINCT id) FROM unnest(p_ids) AS supplied(id)) <> active_count
     OR EXISTS (
       SELECT 1 FROM unnest(p_ids) AS supplied(id)
       WHERE NOT EXISTS (
         SELECT 1 FROM public.schools s WHERE s.id = supplied.id AND NOT s.archived
        )
     ) THEN
    RAISE EXCEPTION 'School list changed. Refresh and try again.';
  END IF;
  UPDATE public.schools s SET display_order = ordered.position::integer
  FROM unnest(p_ids) WITH ORDINALITY AS ordered(id, position)
  WHERE s.id = ordered.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_school_archived(p_school_id uuid, p_archived boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE(private.is_global_admin(auth.jwt() ->> 'email'), false) THEN
    RAISE EXCEPTION 'Global admin access required.';
  END IF;
  IF p_archived IS NULL THEN RAISE EXCEPTION 'Archive value is required.'; END IF;
  UPDATE public.schools
  SET archived = p_archived,
      accepting_nominations = CASE WHEN p_archived THEN false ELSE accepting_nominations END
  WHERE id = p_school_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'School not found.'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.reject_archived_school_nomination()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.schools WHERE id = NEW.school_id AND archived
  ) THEN
    RAISE EXCEPTION 'This school is archived and cannot receive new nominations.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reject_archived_school_nomination
BEFORE INSERT ON public.nominations
FOR EACH ROW EXECUTE FUNCTION private.reject_archived_school_nomination();

REVOKE ALL ON FUNCTION public.reorder_schools(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_school_archived(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_schools(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_school_archived(uuid, boolean) TO authenticated;