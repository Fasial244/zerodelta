-- Phase 1: Add constraints to profiles table for enhanced registration

-- 1. Add UNIQUE constraint on username (prevents duplicate usernames)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Add CHECK constraint for university_id format
-- Must be: 10 digits starting with '2' OR phone number (10-15 digits)
ALTER TABLE public.profiles ADD CONSTRAINT check_university_id_format 
CHECK (
  university_id IS NULL OR 
  university_id ~ '^2[0-9]{9}$' OR 
  university_id ~ '^[0-9]{10,15}$'
);

-- 3. Update RLS policy to allow users to check username uniqueness
CREATE POLICY "Allow username uniqueness check"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: full_name and university_id are already in the table but nullable
-- New users will be required to fill these via client-side validation