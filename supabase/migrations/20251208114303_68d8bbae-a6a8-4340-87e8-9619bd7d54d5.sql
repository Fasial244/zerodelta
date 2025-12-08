-- Create secure RPC function for joining teams via code
-- This avoids exposing join_code to client queries
CREATE OR REPLACE FUNCTION public.join_team_via_code(code_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_team_id UUID;
  target_team_name TEXT;
  current_user_id UUID;
  user_profile RECORD;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get user profile to check lock status
  SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;
  
  IF user_profile.is_locked THEN
    RETURN json_build_object('success', false, 'error', 'You cannot change teams after your first solve');
  END IF;

  -- Find team by join code (case-insensitive)
  SELECT id, name INTO target_team_id, target_team_name 
  FROM public.teams 
  WHERE join_code = UPPER(code_input);

  IF target_team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid join code');
  END IF;

  -- Update user's team
  UPDATE public.profiles 
  SET team_id = target_team_id 
  WHERE id = current_user_id;

  -- Log activity
  INSERT INTO public.activity_log (event_type, user_id, team_id, message)
  VALUES (
    'team_join', 
    current_user_id, 
    target_team_id, 
    COALESCE(user_profile.username, 'A user') || ' joined ' || target_team_name
  );

  RETURN json_build_object(
    'success', true, 
    'team_id', target_team_id, 
    'team_name', target_team_name
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.join_team_via_code(TEXT) TO authenticated;