-- Fix authors table to be publicly readable (including anonymous users)
DROP POLICY IF EXISTS "Authors are publicly readable" ON public.authors;

CREATE POLICY "Authors are publicly readable"
  ON public.authors FOR SELECT
  TO authenticated, anon
  USING (true);