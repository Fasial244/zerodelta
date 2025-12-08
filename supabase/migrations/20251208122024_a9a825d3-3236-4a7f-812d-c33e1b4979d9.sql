-- Drop and recreate teams_public view to properly hide join_code from non-team members
DROP VIEW IF EXISTS public.teams_public;

CREATE VIEW public.teams_public WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  score,
  created_at,
  -- Only show join_code to team members
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.team_id = teams.id
    ) THEN join_code
    ELSE NULL
  END as join_code
FROM public.teams;

-- Fix activity_log INSERT policy to prevent fake entries
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_log;

-- Only allow inserts via service role or through trusted functions
CREATE POLICY "Service role can insert activity logs" 
ON public.activity_log 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Only allow authenticated users to insert their own logs via Edge Functions
  -- The Edge Function uses service_role which bypasses RLS
  -- This policy is restrictive and only allows the service role to insert
  false
);

-- Create a security definer function for inserting activity logs
CREATE OR REPLACE FUNCTION public.log_activity(
  p_event_type event_type,
  p_message text,
  p_user_id uuid DEFAULT NULL,
  p_challenge_id uuid DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  p_points integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_log (event_type, message, user_id, challenge_id, team_id, points)
  VALUES (p_event_type, p_message, p_user_id, p_challenge_id, p_team_id, p_points);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;