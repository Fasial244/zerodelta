-- Phase 1: Create a secure view that excludes sensitive flag columns
-- This prevents users from directly querying flag_hash and flag_pattern

CREATE OR REPLACE VIEW public.challenges_public AS
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
FROM public.challenges;

-- Grant access to the view
GRANT SELECT ON public.challenges_public TO authenticated;

-- Phase 3: Create honeypot auto-ban trigger
-- When a user submits the honeypot flag, they get automatically banned

CREATE OR REPLACE FUNCTION public.check_honeypot_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  honeypot_flag_hash TEXT;
BEGIN
  -- Get the honeypot hash from system_settings
  SELECT value INTO honeypot_flag_hash 
  FROM public.system_settings 
  WHERE key = 'honeypot_hash';
  
  -- Check if this is a honeypot submission (we detect via activity_log for honeypot events)
  -- The actual check happens in the Edge Function, but this trigger catches any honeypot logs
  IF NEW.event_type = 'honeypot_triggered' THEN
    -- Ban the user immediately
    UPDATE public.profiles 
    SET is_banned = TRUE 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on activity_log for honeypot detection
DROP TRIGGER IF EXISTS trigger_honeypot_ban ON public.activity_log;
CREATE TRIGGER trigger_honeypot_ban
  AFTER INSERT ON public.activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.check_honeypot_submission();

-- Add RLS policy for admins to promote users to admin role
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete solves (for reset score)
CREATE POLICY "Admins can delete solves" 
ON public.solves 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime on system_settings for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;