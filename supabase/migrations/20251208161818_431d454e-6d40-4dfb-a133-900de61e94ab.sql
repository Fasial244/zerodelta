-- Add RLS policy to allow authenticated users to view challenges_public
-- First, enable RLS on the view if not already enabled
ALTER VIEW public.challenges_public SET (security_invoker = false);

-- Drop and recreate the view with SECURITY DEFINER to bypass underlying table RLS
DROP VIEW IF EXISTS public.challenges_public;

CREATE VIEW public.challenges_public 
WITH (security_barrier = false)
AS
SELECT 
  id,
  title,
  description,
  points,
  category,
  flag_type,
  connection_info,
  dependencies,
  solve_count,
  first_blood_user_id,
  first_blood_at,
  is_active,
  created_at,
  updated_at
FROM public.challenges;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.challenges_public TO authenticated;
GRANT SELECT ON public.challenges_public TO anon;