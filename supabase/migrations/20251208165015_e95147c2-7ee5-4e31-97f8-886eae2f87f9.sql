-- 1. FIX: Challenge Solutions Exposed (Strict Lockdown)
REVOKE ALL ON public.challenges FROM anon, authenticated;
GRANT SELECT ON public.challenges TO service_role;

DROP POLICY IF EXISTS "Challenges viewable by authenticated" ON public.challenges;
DROP POLICY IF EXISTS "Public view metadata" ON public.challenges;

-- 2. FIX: IP Addresses Leaked - Create secure view
CREATE OR REPLACE VIEW public.submission_attempts_public 
WITH (security_invoker = true) AS
SELECT id, user_id, challenge_id, is_correct, created_at
FROM public.submission_attempts;

REVOKE SELECT ON public.submission_attempts FROM anon, authenticated;
GRANT SELECT ON public.submission_attempts_public TO authenticated;

-- 3. FIX: Grant SELECT on public views
GRANT SELECT ON public.challenges_public TO anon, authenticated;

-- 4. FIX: Security Invoker on views
ALTER VIEW public.challenges_public SET (security_invoker = true);

-- 5. FIX: teams_public currently exposes join_code - recreate without it
DROP VIEW IF EXISTS public.teams_public;
CREATE VIEW public.teams_public 
WITH (security_invoker = true) AS
SELECT id, name, score, created_at
FROM public.teams;

GRANT SELECT ON public.teams_public TO anon, authenticated;