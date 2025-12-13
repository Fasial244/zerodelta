-- =====================================================
-- CRITICAL SECURITY FIXES - Column-Level Privileges
-- =====================================================

-- 1) PROFILES: Restrict columns users can update (prevent unban/unlock/team bypass)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, avatar_url, full_name, university_id) ON public.profiles TO authenticated;

-- 2) TEAMS: Restrict columns (prevent score/join_code manipulation)
REVOKE UPDATE ON public.teams FROM authenticated;
GRANT UPDATE (name) ON public.teams TO authenticated;

-- 3) SOLVES: Remove direct INSERT - only Edge Function (service_role) should write
DROP POLICY IF EXISTS "Users can insert their own solves" ON public.solves;
REVOKE INSERT ON public.solves FROM authenticated;

-- 4) ACTIVITY LOG: Revoke execute on log_activity from authenticated users
REVOKE EXECUTE ON FUNCTION public.log_activity(event_type, text, uuid, uuid, uuid, integer) FROM authenticated;

-- 5) Grant execute on get_my_team_join_code to authenticated
GRANT EXECUTE ON FUNCTION public.get_my_team_join_code() TO authenticated;

-- =====================================================
-- NEW RPCs FOR TEAM OPERATIONS (since direct updates blocked)
-- =====================================================

-- Create team RPC (replaces direct insert + profile update)
CREATE OR REPLACE FUNCTION public.create_team(team_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_team_id UUID;
  new_join_code TEXT;
  current_user_id UUID;
  user_profile RECORD;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get user profile to check lock status and current team
  SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;
  
  IF user_profile.is_locked THEN
    RETURN json_build_object('success', false, 'error', 'You cannot create a team after your first solve');
  END IF;
  
  IF user_profile.team_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are already on a team. Leave your current team first.');
  END IF;

  -- Validate team name
  IF team_name IS NULL OR LENGTH(TRIM(team_name)) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Team name must be at least 2 characters');
  END IF;

  -- Create the team
  INSERT INTO public.teams (name)
  VALUES (TRIM(team_name))
  RETURNING id, join_code INTO new_team_id, new_join_code;

  -- Update user's team_id
  UPDATE public.profiles 
  SET team_id = new_team_id 
  WHERE id = current_user_id;

  -- Log activity
  INSERT INTO public.activity_log (event_type, user_id, team_id, message)
  VALUES (
    'team_join', 
    current_user_id, 
    new_team_id, 
    COALESCE(user_profile.username, 'A user') || ' created team ' || TRIM(team_name)
  );

  RETURN json_build_object(
    'success', true, 
    'team_id', new_team_id, 
    'team_name', TRIM(team_name),
    'join_code', new_join_code
  );
END;
$$;

-- Leave team RPC (replaces direct profile update)
CREATE OR REPLACE FUNCTION public.leave_team()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  user_profile RECORD;
  team_record RECORD;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get user profile
  SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;
  
  IF user_profile.is_locked THEN
    RETURN json_build_object('success', false, 'error', 'You cannot leave your team after your first solve');
  END IF;
  
  IF user_profile.team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are not on a team');
  END IF;

  -- Get team info for logging
  SELECT * INTO team_record FROM public.teams WHERE id = user_profile.team_id;

  -- Update user's team_id to null
  UPDATE public.profiles 
  SET team_id = NULL 
  WHERE id = current_user_id;

  -- Log activity
  INSERT INTO public.activity_log (event_type, user_id, team_id, message)
  VALUES (
    'team_leave', 
    current_user_id, 
    user_profile.team_id, 
    COALESCE(user_profile.username, 'A user') || ' left ' || COALESCE(team_record.name, 'their team')
  );

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute on new RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_team() TO authenticated;

-- =====================================================
-- FIX PUBLIC VIEWS - Ensure SECURITY DEFINER (default)
-- =====================================================

-- Recreate challenges_public as SECURITY DEFINER (remove SECURITY INVOKER if set)
DROP VIEW IF EXISTS public.challenges_public;
CREATE VIEW public.challenges_public AS
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

-- Grant SELECT on the view to authenticated (not the base table)
GRANT SELECT ON public.challenges_public TO authenticated;

-- Recreate teams_public as SECURITY DEFINER
DROP VIEW IF EXISTS public.teams_public;
CREATE VIEW public.teams_public AS
SELECT 
  id,
  name,
  score,
  created_at
FROM public.teams;

GRANT SELECT ON public.teams_public TO anon, authenticated;

-- Recreate system_settings_public as SECURITY DEFINER
DROP VIEW IF EXISTS public.system_settings_public;
CREATE VIEW public.system_settings_public AS
SELECT 
  key,
  value,
  description,
  updated_at
FROM public.system_settings
WHERE key NOT IN ('flag_salt', 'honeypot_hash');

GRANT SELECT ON public.system_settings_public TO anon, authenticated;