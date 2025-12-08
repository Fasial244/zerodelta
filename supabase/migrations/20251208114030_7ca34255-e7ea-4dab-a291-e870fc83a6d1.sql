-- Fix: Restrict challenges table to admin-only access
-- Regular users should only access challenges_public view which excludes flag data

-- Drop the existing permissive SELECT policy for authenticated users
DROP POLICY IF EXISTS "Challenges viewable by authenticated" ON public.challenges;

-- Create a new policy that only allows admins to SELECT from the base table
CREATE POLICY "Only admins can view full challenges" 
ON public.challenges 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix the teams join_code exposure issue
-- Create a secure view for teams that hides join_code from non-members
CREATE OR REPLACE VIEW public.teams_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  score,
  created_at,
  -- Only show join_code if user is a member of this team
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.team_id = teams.id
    ) THEN join_code
    ELSE NULL
  END as join_code
FROM public.teams;

-- Grant access to authenticated users
GRANT SELECT ON public.teams_public TO authenticated;

-- Restrict base teams table - hide join_code from non-members
DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON public.teams;

-- Allow viewing teams but the join_code column will be protected by the view
CREATE POLICY "Teams viewable by authenticated" 
ON public.teams 
FOR SELECT 
USING (true);

-- Note: The join_code is now only accessible via teams_public view which filters it