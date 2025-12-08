-- Fix Security Issue 1: Revoke direct teams table access to protect join_code
-- Users must use teams_public view which excludes join_code
REVOKE SELECT ON public.teams FROM authenticated;
GRANT SELECT ON public.teams_public TO authenticated;

-- Create RPC function for team members to get their own join_code securely
CREATE OR REPLACE FUNCTION public.get_my_team_join_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_code TEXT;
BEGIN
  SELECT t.join_code INTO team_code
  FROM teams t
  JOIN profiles p ON p.team_id = t.id
  WHERE p.id = auth.uid();
  
  RETURN team_code;
END;
$$;

-- Fix Security Issue 2: Protect sensitive system_settings (flag_salt, honeypot_hash)
-- Create a public view that excludes sensitive settings
CREATE OR REPLACE VIEW public.system_settings_public AS
SELECT key, value, description, updated_at
FROM public.system_settings
WHERE key NOT IN ('flag_salt', 'honeypot_hash');

-- Revoke direct access to system_settings for non-admins
-- Drop existing policy first
DROP POLICY IF EXISTS "Settings viewable by authenticated" ON public.system_settings;

-- Create new policy: only admins can SELECT from raw table
CREATE POLICY "Only admins can view all settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Grant access to the safe public view
GRANT SELECT ON public.system_settings_public TO authenticated;