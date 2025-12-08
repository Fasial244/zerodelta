-- Fix the security definer view warning by using SECURITY INVOKER
-- and creating a proper RLS policy that filters out sensitive keys

-- Drop the old view
DROP VIEW IF EXISTS public.system_settings_public;

-- Create view with SECURITY INVOKER (inherits caller's permissions)
CREATE VIEW public.system_settings_public
WITH (security_invoker = true)
AS
SELECT key, value, description, updated_at
FROM public.system_settings
WHERE key NOT IN ('flag_salt', 'honeypot_hash');

-- Grant access
GRANT SELECT ON public.system_settings_public TO authenticated;

-- Update the RLS policy to allow non-admins to read non-sensitive settings
DROP POLICY IF EXISTS "Only admins can view all settings" ON public.system_settings;

-- Allow authenticated users to read only non-sensitive settings
CREATE POLICY "Users can view non-sensitive settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  key NOT IN ('flag_salt', 'honeypot_hash') 
  OR has_role(auth.uid(), 'admin'::app_role)
);