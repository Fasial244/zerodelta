-- Create score_snapshots table for tracking score history over time
CREATE TABLE public.score_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 0,
  snapshot_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_score_snapshots_competition_time ON public.score_snapshots(competition_id, snapshot_at DESC);
CREATE INDEX idx_score_snapshots_user ON public.score_snapshots(user_id);

-- Enable RLS
ALTER TABLE public.score_snapshots ENABLE ROW LEVEL SECURITY;

-- Everyone can view score snapshots (for graphs)
CREATE POLICY "Score snapshots viewable by all"
ON public.score_snapshots FOR SELECT
USING (true);

-- Only admins can manage snapshots (they're created by system)
CREATE POLICY "Admins can manage score snapshots"
ON public.score_snapshots FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert their own snapshots (for when they solve)
CREATE POLICY "Users can insert own snapshots"
ON public.score_snapshots FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Enable realtime for score_snapshots
ALTER PUBLICATION supabase_realtime ADD TABLE public.score_snapshots;