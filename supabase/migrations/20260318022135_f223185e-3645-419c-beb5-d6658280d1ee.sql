
-- Make author_name nullable for anonymous posts
ALTER TABLE public.appreciations ALTER COLUMN author_name DROP NOT NULL;

-- Allow admins to delete appreciations
CREATE POLICY "Admins can delete appreciations"
  ON public.appreciations FOR DELETE
  TO authenticated
  USING (is_any_school_admin((auth.jwt() ->> 'email'::text)));

-- Allow admins to view all appreciations (including rejected/pending)
CREATE POLICY "Admins can view all appreciations"
  ON public.appreciations FOR SELECT
  TO authenticated
  USING (is_any_school_admin((auth.jwt() ->> 'email'::text)));
