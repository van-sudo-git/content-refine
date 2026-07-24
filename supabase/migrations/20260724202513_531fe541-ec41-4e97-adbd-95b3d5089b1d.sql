ALTER TABLE public.school_admins ADD COLUMN is_global_admin boolean NOT NULL DEFAULT false;

UPDATE public.school_admins
SET is_global_admin = true
WHERE email IN ('evaanahkawat@gmail.com', '1061967@lwsd.org');