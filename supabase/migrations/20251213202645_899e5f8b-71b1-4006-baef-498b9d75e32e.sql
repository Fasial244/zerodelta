-- Create public leaderboard view that aggregates data safely
-- This allows anon users to view the scoreboard without exposing raw profiles/solves

CREATE OR REPLACE VIEW public.leaderboard_public AS
SELECT
  p.id::text AS player_id,
  COALESCE(p.username, 'Anonymous') AS username,
  p.avatar_url,
  COALESCE(SUM(s.points_awarded), 0)::int AS total_points,
  COUNT(s.id)::int AS solve_count,
  COUNT(s.id) FILTER (WHERE s.is_first_blood)::int AS first_bloods,
  p.created_at
FROM public.profiles p
JOIN public.competition_registrations cr ON cr.user_id = p.id
JOIN public.competitions c ON c.id = cr.competition_id AND c.is_active = true
LEFT JOIN public.solves s ON s.user_id = p.id
WHERE COALESCE(p.is_banned, false) = false
  AND cr.status = 'approved'
GROUP BY p.id, p.username, p.avatar_url, p.created_at
ORDER BY COALESCE(SUM(s.points_awarded), 0) DESC, p.created_at ASC;

-- Grant read access to anon and authenticated
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;

-- Create public stats view for user counter
CREATE OR REPLACE VIEW public.scoreboard_stats_public AS
SELECT
  (SELECT COUNT(*) 
   FROM public.competition_registrations cr
   JOIN public.competitions c ON c.id = cr.competition_id AND c.is_active = true
   WHERE cr.status = 'approved')::int AS user_count,
  (SELECT c.name FROM public.competitions c WHERE c.is_active = true LIMIT 1) AS competition_name,
  NOW() AS generated_at;

GRANT SELECT ON public.scoreboard_stats_public TO anon, authenticated;