-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS university_id text,
ADD COLUMN IF NOT EXISTS full_name text;

-- 2. Create authors table
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  social_link text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on authors
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for profiles (update existing to include new columns)
-- Users can already update their own profile, the existing policy covers this

-- 4. RLS Policies for authors
CREATE POLICY "Authors are publicly readable"
ON public.authors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage authors"
ON public.authors
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial author (0xfsl)
INSERT INTO public.authors (name, role, social_link, display_order)
VALUES ('0xfsl (Faisal AL-Jaber)', 'Team Leader', 'https://github.com/0xfsl', 1);