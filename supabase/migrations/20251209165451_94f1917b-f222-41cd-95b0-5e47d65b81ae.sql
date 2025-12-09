-- Update the check constraint for university_id to match new validation rules
-- ID: 10 digits starting with "22" OR Phone: 10 digits starting with "05"

-- First drop the old constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_university_id_format;

-- Add the new constraint
ALTER TABLE public.profiles ADD CONSTRAINT check_university_id_format 
CHECK (
  university_id IS NULL OR 
  university_id ~ '^22[0-9]{8}$' OR  -- 10 digits starting with 22
  university_id ~ '^05[0-9]{8}$'     -- 10 digits starting with 05
);