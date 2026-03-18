
-- Schools table (extendable to other schools in the district)
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  district TEXT NOT NULL DEFAULT 'Lake Washington School District',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert Lake Washington High School as the first school
INSERT INTO public.schools (name, district) VALUES ('Lake Washington High School', 'Lake Washington School District');

-- School admins table (email-based access control per school)
CREATE TABLE public.school_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (school_id, email)
);

-- Nominations table
CREATE TABLE public.nominations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  nominee_name TEXT NOT NULL,
  nominee_role TEXT NOT NULL,
  nominee_department TEXT NOT NULL,
  reason TEXT NOT NULL,
  nominator_name TEXT NOT NULL,
  nominator_email TEXT NOT NULL,
  nominee_informed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'featured')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;

-- Schools are publicly readable
CREATE POLICY "Schools are viewable by everyone" ON public.schools FOR SELECT USING (true);

-- Helper function: check if an email is an admin for a school
CREATE OR REPLACE FUNCTION public.is_school_admin(_email TEXT, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE email = lower(_email) AND school_id = _school_id
  )
$$;

-- Helper function: check if email is admin for any school
CREATE OR REPLACE FUNCTION public.is_any_school_admin(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE email = lower(_email)
  )
$$;

-- School admins: only admins of that school can view
CREATE POLICY "Admins can view their school admins" ON public.school_admins
  FOR SELECT USING (
    public.is_school_admin(auth.jwt() ->> 'email', school_id)
  );

-- School admins: only admins can insert new admins for their school
CREATE POLICY "Admins can add admins to their school" ON public.school_admins
  FOR INSERT WITH CHECK (
    public.is_school_admin(auth.jwt() ->> 'email', school_id)
  );

-- School admins: only admins can remove admins from their school
CREATE POLICY "Admins can remove admins from their school" ON public.school_admins
  FOR DELETE USING (
    public.is_school_admin(auth.jwt() ->> 'email', school_id)
  );

-- Nominations: anyone can insert (public form)
CREATE POLICY "Anyone can submit nominations" ON public.nominations
  FOR INSERT WITH CHECK (true);

-- Nominations: admins can view nominations for their school
CREATE POLICY "Admins can view their school nominations" ON public.nominations
  FOR SELECT USING (
    public.is_school_admin(auth.jwt() ->> 'email', school_id)
  );

-- Nominations: admins can update nominations for their school
CREATE POLICY "Admins can update their school nominations" ON public.nominations
  FOR UPDATE USING (
    public.is_school_admin(auth.jwt() ->> 'email', school_id)
  );

-- Timestamp trigger for nominations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_nominations_updated_at
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
