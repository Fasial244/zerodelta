-- Fix challenges_public view grants - ensure it works for authenticated users
-- The view was created as SECURITY DEFINER which is correct

-- Grant SELECT on challenges_public to authenticated users
GRANT SELECT ON public.challenges_public TO authenticated;

-- Ensure the base challenges table is still accessible to authenticated for joins via the view
-- The view should handle access, not direct table access

-- Also ensure submission_attempts INSERT is properly restricted
-- (only Edge Function should write, but keep SELECT for users to see their attempts)
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.submission_attempts;
REVOKE INSERT ON public.submission_attempts FROM authenticated;

-- Create RPC for admin to assign users to competitions directly
CREATE OR REPLACE FUNCTION public.admin_assign_user_to_competition(
  p_user_id UUID,
  p_competition_id UUID,
  p_status TEXT DEFAULT 'approved'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_reg UUID;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Check if registration already exists
  SELECT id INTO existing_reg 
  FROM public.competition_registrations 
  WHERE user_id = p_user_id AND competition_id = p_competition_id;

  IF existing_reg IS NOT NULL THEN
    -- Update existing registration
    UPDATE public.competition_registrations 
    SET status = p_status, updated_at = NOW()
    WHERE id = existing_reg;
    
    RETURN json_build_object('success', true, 'action', 'updated');
  ELSE
    -- Create new registration
    INSERT INTO public.competition_registrations (user_id, competition_id, status)
    VALUES (p_user_id, p_competition_id, p_status);
    
    RETURN json_build_object('success', true, 'action', 'created');
  END IF;
END;
$$;

-- Create RPC to bulk assign users to competition
CREATE OR REPLACE FUNCTION public.admin_bulk_assign_to_competition(
  p_user_ids UUID[],
  p_competition_id UUID,
  p_status TEXT DEFAULT 'approved'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  success_count INT := 0;
  user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  FOREACH user_id IN ARRAY p_user_ids
  LOOP
    -- Upsert registration
    INSERT INTO public.competition_registrations (user_id, competition_id, status)
    VALUES (user_id, p_competition_id, p_status)
    ON CONFLICT (user_id, competition_id) 
    DO UPDATE SET status = p_status, updated_at = NOW();
    
    success_count := success_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'assigned_count', success_count);
END;
$$;

-- Grant execute on new admin RPCs
GRANT EXECUTE ON FUNCTION public.admin_assign_user_to_competition(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_assign_to_competition(UUID[], UUID, TEXT) TO authenticated;

-- Add unique constraint on competition_registrations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'competition_registrations_user_competition_unique'
  ) THEN
    ALTER TABLE public.competition_registrations 
    ADD CONSTRAINT competition_registrations_user_competition_unique 
    UNIQUE (user_id, competition_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;