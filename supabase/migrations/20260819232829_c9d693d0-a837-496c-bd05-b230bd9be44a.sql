DO $$
DECLARE
  v_school uuid;
  v_nom1 uuid; v_nom2 uuid;
  v_prof1 uuid; v_prof2 uuid;
  v_img1 uuid; v_img2 uuid;
  v_pid uuid; v_nid uuid;
BEGIN
  SELECT id INTO v_school FROM public.schools LIMIT 1;

  -- Case A: image uploaded first, profile created later
  INSERT INTO public.nominations (school_id, nominee_name, nominee_role, nominee_department, reason, nominator_name, nominator_email)
  VALUES (v_school, 'TRG Test A', 'Staff', 'Test', 'test', 'T', 't@example.com') RETURNING id INTO v_nom1;

  INSERT INTO public.profile_images (nomination_id, image_url, image_type)
  VALUES (v_nom1, 'nominations/a.jpg', 'portrait') RETURNING id INTO v_img1;

  SELECT profile_id, nomination_id INTO v_pid, v_nid FROM public.profile_images WHERE id = v_img1;
  IF v_pid IS NOT NULL OR v_nid IS DISTINCT FROM v_nom1 THEN
    RAISE EXCEPTION 'Case A step1 failed: profile_id=% nomination_id=%', v_pid, v_nid;
  END IF;

  INSERT INTO public.profiles (slug, name, role, school_id, nomination_id)
  VALUES ('trg-test-a', 'TRG Test A', 'Staff', v_school, v_nom1) RETURNING id INTO v_prof1;

  SELECT profile_id, nomination_id INTO v_pid, v_nid FROM public.profile_images WHERE id = v_img1;
  IF v_pid IS DISTINCT FROM v_prof1 OR v_nid IS DISTINCT FROM v_nom1 THEN
    RAISE EXCEPTION 'Case A step2 failed: profile_id=% nomination_id=%', v_pid, v_nid;
  END IF;

  -- Case B: profile created first, image uploaded later
  INSERT INTO public.nominations (school_id, nominee_name, nominee_role, nominee_department, reason, nominator_name, nominator_email)
  VALUES (v_school, 'TRG Test B', 'Staff', 'Test', 'test', 'T', 't@example.com') RETURNING id INTO v_nom2;

  INSERT INTO public.profiles (slug, name, role, school_id, nomination_id)
  VALUES ('trg-test-b', 'TRG Test B', 'Staff', v_school, v_nom2) RETURNING id INTO v_prof2;

  INSERT INTO public.profile_images (nomination_id, image_url, image_type)
  VALUES (v_nom2, 'nominations/b.jpg', 'portrait') RETURNING id INTO v_img2;

  SELECT profile_id, nomination_id INTO v_pid, v_nid FROM public.profile_images WHERE id = v_img2;
  IF v_pid IS DISTINCT FROM v_prof2 OR v_nid IS DISTINCT FROM v_nom2 THEN
    RAISE EXCEPTION 'Case B failed: profile_id=% nomination_id=%', v_pid, v_nid;
  END IF;

  RAISE NOTICE 'Both cases passed';

  -- cleanup
  DELETE FROM public.profile_images WHERE id IN (v_img1, v_img2);
  DELETE FROM public.profile_contributors WHERE profile_id IN (v_prof1, v_prof2);
  DELETE FROM public.profiles WHERE id IN (v_prof1, v_prof2);
  DELETE FROM public.nominations WHERE id IN (v_nom1, v_nom2);
END $$;