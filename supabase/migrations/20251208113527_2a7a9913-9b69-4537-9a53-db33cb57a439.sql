-- Enable RLS on the challenges_public view
-- Views inherit RLS from their base tables, but we can make it explicit
-- The view already uses SECURITY INVOKER so it respects the base table's RLS

-- Create a policy explicitly for the view to make security intentions clear
-- First, we need to ensure the base table policies are working correctly

-- The challenges table already has RLS enabled with:
-- "Challenges viewable by authenticated" - SELECT for all authenticated users
-- "Admins can manage challenges" - ALL for admins

-- Since the view uses SECURITY INVOKER and selects from challenges,
-- it automatically inherits the RLS policies from the challenges table.
-- However, to satisfy the linter, we can create an explicit RLS setup.

-- Actually, views with SECURITY INVOKER don't need their own RLS policies
-- They inherit from the base table. The finding is a false positive.
-- Let's verify the view is properly configured by recreating it with explicit settings.

DROP VIEW IF EXISTS public.challenges_public;

CREATE VIEW public.challenges_public 
WITH (security_invoker = true)
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
FROM public.challenges
WHERE is_active = true;

-- Grant access to authenticated users
GRANT SELECT ON public.challenges_public TO authenticated;

-- Add a comment explaining the security model
COMMENT ON VIEW public.challenges_public IS 'Public view of challenges that excludes sensitive flag data. Uses SECURITY INVOKER to respect base table RLS policies.';