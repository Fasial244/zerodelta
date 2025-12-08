-- Security Fix V2: Lockdown sensitive tables and fix view security

-- A. Lockdown 'Challenges' Table
REVOKE ALL ON public.challenges FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.challenges TO service_role;

-- B. Create submission_attempts_public view WITHOUT ip_address
CREATE OR REPLACE VIEW public.submission_attempts_public 
WITH (security_invoker = true) AS
SELECT id, user_id, challenge_id, is_correct, created_at
FROM public.submission_attempts;

-- Revoke direct access on raw submission_attempts table
REVOKE SELECT ON public.submission_attempts FROM anon;

-- Grant access on secure view to authenticated users
GRANT SELECT ON public.submission_attempts_public TO authenticated;

-- C. Fix View Security Invoker for all public views
ALTER VIEW public.challenges_public SET (security_invoker = true);
ALTER VIEW public.teams_public SET (security_invoker = true);
ALTER VIEW public.system_settings_public SET (security_invoker = true);