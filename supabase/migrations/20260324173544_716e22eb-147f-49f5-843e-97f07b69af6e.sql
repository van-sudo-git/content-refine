
-- Profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    department text,
    bio text,
    school_id uuid REFERENCES public.schools(id),
    status text NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published profiles are public"
ON public.profiles FOR SELECT TO public
USING (status = 'published');

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (is_any_school_admin((auth.jwt() ->> 'email'::text)))
WITH CHECK (is_any_school_admin((auth.jwt() ->> 'email'::text)));

-- Profile images table
CREATE TABLE public.profile_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    image_type text NOT NULL DEFAULT 'additional',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile images for published profiles are public"
ON public.profile_images FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND status = 'published'));

CREATE POLICY "Admins can manage profile images"
ON public.profile_images FOR ALL TO authenticated
USING (is_any_school_admin((auth.jwt() ->> 'email'::text)))
WITH CHECK (is_any_school_admin((auth.jwt() ->> 'email'::text)));

-- Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Storage policies
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "Admins can upload profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND is_any_school_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can delete profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images' AND is_any_school_admin((auth.jwt() ->> 'email'::text)));

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_profiles_slug ON public.profiles(slug);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_profile_images_profile_id ON public.profile_images(profile_id);
CREATE INDEX idx_profile_images_type ON public.profile_images(image_type);
