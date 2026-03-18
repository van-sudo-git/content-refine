
CREATE TABLE public.appreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug text NOT NULL,
  author_name text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appreciations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit appreciations
CREATE POLICY "Anyone can submit appreciations"
  ON public.appreciations FOR INSERT
  TO public
  WITH CHECK (true);

-- Only approved appreciations are publicly visible
CREATE POLICY "Approved appreciations are public"
  ON public.appreciations FOR SELECT
  TO public
  USING (status = 'approved');

-- Admins can view all appreciations (via school_admins check not needed here, keep simple)
