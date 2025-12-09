-- Security Fix: Create submission_attempts_public view to hide IP addresses
CREATE OR REPLACE VIEW public.submission_attempts_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  challenge_id,
  is_correct,
  created_at
FROM public.submission_attempts;

-- Grant select on the public view
GRANT SELECT ON public.submission_attempts_public TO authenticated;

-- Verify teams_public view exists and is secure (already created, this is a safety check)
-- The teams_public view should only expose: id, name, score, created_at (NOT join_code)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'teams_public' AND schemaname = 'public') THEN
    RAISE EXCEPTION 'teams_public view does not exist - security risk';
  END IF;
END $$;

-- Verify challenges_public view exists (already created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'challenges_public' AND schemaname = 'public') THEN
    RAISE EXCEPTION 'challenges_public view does not exist - security risk';
  END IF;
END $$;