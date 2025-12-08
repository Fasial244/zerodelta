-- Fix the security definer view issue by using SECURITY INVOKER (default)
-- This ensures RLS policies of the querying user are respected

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
FROM public.challenges;

-- Re-grant access to the view
GRANT SELECT ON public.challenges_public TO authenticated;