-- Fix: Restore table permissions so RLS can actually work for Admins
GRANT ALL ON public.challenges TO authenticated;
GRANT ALL ON public.challenge_instances TO authenticated;
GRANT ALL ON public.submission_attempts TO authenticated;

-- Ensure the RLS policy is strict for challenges
DROP POLICY IF EXISTS "Admin Full Access" ON public.challenges;
CREATE POLICY "Admin Full Access" 
ON public.challenges 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));