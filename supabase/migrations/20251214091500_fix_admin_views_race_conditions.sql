-- Restore SELECT on teams while hiding join_code and enforce RLS for authenticated users
GRANT SELECT ON public.teams TO authenticated;
REVOKE SELECT (join_code) ON public.teams FROM authenticated;

DROP POLICY IF EXISTS "Teams viewable by authenticated users" ON public.teams;
CREATE POLICY "Teams viewable by authenticated users"
ON public.teams FOR SELECT TO authenticated
USING (true);

-- Force team creation through RPC only
REVOKE INSERT ON public.teams FROM authenticated;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

-- Competition registration must stay pending and user-bound
DROP POLICY IF EXISTS "Users can register for competitions" ON public.competition_registrations;
CREATE POLICY "Users can register for competitions"
ON public.competition_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Helper to enforce admin role in RPCs
CREATE OR REPLACE FUNCTION public.ensure_is_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_is_admin() TO authenticated;

-- Admin announcement RPC (logs via activity_log)
CREATE OR REPLACE FUNCTION public.admin_post_announcement(p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_is_admin();
  INSERT INTO public.activity_log(event_type, message, user_id)
  VALUES ('announcement', p_message, auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.admin_post_announcement(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_post_announcement(text) TO authenticated;

-- Admin challenge creation RPC (hashes flags server-side)
CREATE OR REPLACE FUNCTION public.admin_create_challenge(
  p_title text,
  p_description text,
  p_points integer,
  p_category text,
  p_flag_type text,
  p_flag_value text,
  p_connection_info jsonb DEFAULT '{}'::jsonb,
  p_dependencies text[] DEFAULT ARRAY[]::text[]
)
RETURNS public.challenges
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_flag_salt text;
  v_flag_hash text;
  v_flag_pattern text;
  v_row public.challenges;
BEGIN
  PERFORM public.ensure_is_admin();

  SELECT COALESCE((SELECT value FROM public.system_settings WHERE key = 'flag_salt'), 'zd_s3cr3t_s4lt_2024')
    INTO v_flag_salt;

  IF p_flag_type = 'static' THEN
    v_flag_hash := encode(digest(p_flag_value || v_flag_salt, 'sha256'), 'hex');
    v_flag_pattern := NULL;
  ELSE
    v_flag_hash := NULL;
    v_flag_pattern := p_flag_value;
  END IF;

  INSERT INTO public.challenges(
    title, description, points, category, flag_type, flag_hash, flag_pattern, connection_info, dependencies
  )
  VALUES (
    p_title, p_description, p_points, p_category, p_flag_type, v_flag_hash, v_flag_pattern, p_connection_info, p_dependencies
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_challenge(text, text, integer, text, text, text, jsonb, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_challenge(text, text, integer, text, text, text, jsonb, text[]) TO authenticated;

-- Admin challenge update RPC
CREATE OR REPLACE FUNCTION public.admin_update_challenge(
  p_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_points integer DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_flag_type text DEFAULT NULL,
  p_flag_value text DEFAULT NULL,
  p_connection_info jsonb DEFAULT NULL,
  p_dependencies text[] DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_flag_salt text;
  v_flag_hash text;
  v_flag_pattern text;
BEGIN
  PERFORM public.ensure_is_admin();

  IF p_flag_value IS NOT NULL AND p_flag_type IS NOT NULL THEN
    SELECT COALESCE((SELECT value FROM public.system_settings WHERE key = 'flag_salt'), 'zd_s3cr3t_s4lt_2024')
      INTO v_flag_salt;

    IF p_flag_type = 'static' THEN
      v_flag_hash := encode(digest(p_flag_value || v_flag_salt, 'sha256'), 'hex');
      v_flag_pattern := NULL;
    ELSE
      v_flag_pattern := p_flag_value;
      v_flag_hash := NULL;
    END IF;
  END IF;

  UPDATE public.challenges
  SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    points = COALESCE(p_points, points),
    category = COALESCE(p_category, category),
    flag_type = COALESCE(p_flag_type, flag_type),
    flag_hash = COALESCE(v_flag_hash, flag_hash),
    flag_pattern = COALESCE(v_flag_pattern, flag_pattern),
    connection_info = COALESCE(p_connection_info, connection_info),
    dependencies = COALESCE(p_dependencies, dependencies),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_challenge(uuid, text, text, integer, text, text, text, jsonb, text[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_challenge(uuid, text, text, integer, text, text, text, jsonb, text[], boolean) TO authenticated;

-- Admin challenge delete RPC
CREATE OR REPLACE FUNCTION public.admin_delete_challenge(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_is_admin();
  DELETE FROM public.challenges WHERE id = p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_challenge(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_challenge(uuid) TO authenticated;

-- Admin user ban/unban RPC
CREATE OR REPLACE FUNCTION public.admin_set_user_ban(p_user_id uuid, p_ban boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_is_admin();
  UPDATE public.profiles SET is_banned = p_ban WHERE id = p_user_id;
  INSERT INTO public.activity_log(event_type, user_id, message)
  VALUES ('user_banned', p_user_id, CASE WHEN p_ban THEN 'User banned' ELSE 'User unbanned' END);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_ban(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_ban(uuid, boolean) TO authenticated;

-- Admin lock/unlock RPC
CREATE OR REPLACE FUNCTION public.admin_set_user_lock(p_user_id uuid, p_locked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_is_admin();
  UPDATE public.profiles SET is_locked = p_locked WHERE id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_lock(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_lock(uuid, boolean) TO authenticated;

-- Admin promotion RPC
CREATE OR REPLACE FUNCTION public.admin_promote_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_is_admin();
  INSERT INTO public.user_roles(user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.activity_log(event_type, user_id, message)
  VALUES ('announcement', p_user_id, 'User promoted to admin');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_promote_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_promote_user(uuid) TO authenticated;

-- Admin reset user score RPC (recomputes team scores)
CREATE OR REPLACE FUNCTION public.admin_reset_user_score(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id uuid;
BEGIN
  PERFORM public.ensure_is_admin();

  SELECT team_id INTO v_team_id FROM public.profiles WHERE id = p_user_id;
  DELETE FROM public.solves WHERE user_id = p_user_id;

  -- Recompute team score if applicable
  IF v_team_id IS NOT NULL THEN
    UPDATE public.teams t
    SET score = COALESCE((SELECT SUM(points_awarded) FROM public.solves s WHERE s.team_id = t.id), 0)
    WHERE t.id = v_team_id;
  END IF;

  INSERT INTO public.activity_log(event_type, user_id, message)
  VALUES ('announcement', p_user_id, 'User score reset');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_user_score(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_score(uuid) TO authenticated;

-- Admin update setting RPC
CREATE OR REPLACE FUNCTION public.admin_update_setting(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_is_admin();
  INSERT INTO public.system_settings(key, value, updated_at)
  VALUES (p_key, p_value, NOW())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_setting(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_setting(text, text) TO authenticated;

-- Atomic solve awarding RPC for service role
CREATE OR REPLACE FUNCTION public.award_solve_atomic(
  p_user_id uuid,
  p_challenge_id uuid,
  p_team_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_challenge public.challenges%ROWTYPE;
  v_decay_rate float;
  v_decay_factor float;
  v_min_points integer;
  v_first_blood_bonus integer;
  v_awarded_points integer;
  v_is_first_blood boolean;
  v_username text;
BEGIN
  -- Only service role should call this
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  SELECT COALESCE((SELECT value::float FROM public.system_settings WHERE key = 'decay_rate'), 0.5),
         COALESCE((SELECT value::float FROM public.system_settings WHERE key = 'decay_factor'), 10),
         COALESCE((SELECT value::integer FROM public.system_settings WHERE key = 'min_points'), 50),
         COALESCE((SELECT value::integer FROM public.system_settings WHERE key = 'first_blood_bonus'), 10)
    INTO v_decay_rate, v_decay_factor, v_min_points, v_first_blood_bonus;

  v_is_first_blood := v_challenge.first_blood_user_id IS NULL;

  v_awarded_points := GREATEST(
    v_min_points,
    FLOOR(v_challenge.points * POWER(v_decay_rate, v_challenge.solve_count / v_decay_factor))::integer
  );

  IF v_is_first_blood THEN
    v_awarded_points := v_awarded_points + v_first_blood_bonus;
  END IF;

  INSERT INTO public.solves(user_id, challenge_id, team_id, points_awarded, is_first_blood)
  VALUES (p_user_id, p_challenge_id, p_team_id, v_awarded_points, v_is_first_blood);

  UPDATE public.challenges
  SET solve_count = v_challenge.solve_count + 1,
      first_blood_user_id = COALESCE(v_challenge.first_blood_user_id, p_user_id),
      first_blood_at = CASE WHEN v_is_first_blood THEN NOW() ELSE v_challenge.first_blood_at END,
      updated_at = NOW()
  WHERE id = p_challenge_id;

  IF p_team_id IS NOT NULL THEN
    UPDATE public.teams SET score = score + v_awarded_points WHERE id = p_team_id;
  END IF;

  SELECT username INTO v_username FROM public.profiles WHERE id = p_user_id;
  INSERT INTO public.activity_log(event_type, user_id, challenge_id, team_id, points, message)
  VALUES (
    CASE WHEN v_is_first_blood THEN 'first_blood' ELSE 'solve' END,
    p_user_id,
    p_challenge_id,
    p_team_id,
    v_awarded_points,
    CASE WHEN v_is_first_blood
      THEN '🩸 ' || COALESCE(v_username, 'Unknown') || ' drew FIRST BLOOD on ' || v_challenge.title || '!'
      ELSE COALESCE(v_username, 'Unknown') || ' cracked ' || v_challenge.title
    END
  );

  RETURN json_build_object(
    'success', true,
    'awarded_points', v_awarded_points,
    'is_first_blood', v_is_first_blood
  );
END;
$$;
REVOKE ALL ON FUNCTION public.award_solve_atomic(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_solve_atomic(uuid, uuid, uuid) TO service_role;
