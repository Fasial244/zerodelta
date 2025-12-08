-- Create competitions table for multi-event support
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competition registrations table
CREATE TABLE public.competition_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;

-- Competitions policies
CREATE POLICY "Competitions viewable by authenticated" 
  ON public.competitions FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage competitions" 
  ON public.competitions FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Registration policies
CREATE POLICY "Users can view their own registrations" 
  ON public.competition_registrations FOR SELECT 
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can register for competitions" 
  ON public.competition_registrations FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage registrations" 
  ON public.competition_registrations FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competition_registrations_updated_at
  BEFORE UPDATE ON public.competition_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ZeroDelta competition
INSERT INTO public.competitions (name, description, start_time, end_time, is_active, require_approval)
VALUES (
  'ZeroDelta Competition',
  'The main ZeroDelta CTF competition. Prove your detective skills and solve the cases.',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '8 days',
  true,
  true
);