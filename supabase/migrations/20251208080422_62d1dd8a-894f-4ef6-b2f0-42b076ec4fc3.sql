-- ZeroDelta CTF Platform Database Schema - Part 1: Core Tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create challenge_category enum
CREATE TYPE public.challenge_category AS ENUM ('Web', 'Pwn', 'Forensics', 'Crypto', 'Other');

-- Create flag_type enum
CREATE TYPE public.flag_type AS ENUM ('static', 'regex');

-- Create instance_status enum
CREATE TYPE public.instance_status AS ENUM ('online', 'resetting', 'offline');

-- Create event_type enum for activity log
CREATE TYPE public.event_type AS ENUM ('solve', 'first_blood', 'announcement', 'team_join', 'team_leave', 'user_banned');

-- =====================
-- TEAMS TABLE
-- =====================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  join_code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 6)),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- =====================
-- PROFILES TABLE (extends auth.users)
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- NOW add teams policies (after profiles exists)
CREATE POLICY "Teams are viewable by authenticated users"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team members can update their team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.team_id = teams.id
    )
  );

-- =====================
-- USER_ROLES TABLE (separate for security)
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- CHALLENGES TABLE
-- =====================
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 100,
  category challenge_category NOT NULL DEFAULT 'Other',
  flag_type flag_type NOT NULL DEFAULT 'static',
  flag_hash TEXT,
  flag_pattern TEXT,
  connection_info JSONB DEFAULT '{}',
  dependencies UUID[] DEFAULT '{}',
  solve_count INTEGER NOT NULL DEFAULT 0,
  first_blood_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_blood_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Challenges viewable by authenticated"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- CHALLENGE_INSTANCES TABLE
-- =====================
CREATE TABLE public.challenge_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status instance_status NOT NULL DEFAULT 'online',
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '15 minutes',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on challenge_instances
ALTER TABLE public.challenge_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge instances viewable by authenticated"
  ON public.challenge_instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage instances"
  ON public.challenge_instances FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- SOLVES TABLE
-- =====================
CREATE TABLE public.solves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  is_first_blood BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS on solves
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solves viewable by authenticated"
  ON public.solves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own solves"
  ON public.solves FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage solves"
  ON public.solves FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- ACTIVITY_LOG TABLE (Live Feed)
-- =====================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type event_type NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  points INTEGER,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log viewable by authenticated"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert activity logs"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage activity logs"
  ON public.activity_log FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- SUBMISSION_ATTEMPTS TABLE (Rate Limiting)
-- =====================
CREATE TABLE public.submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  ip_address TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on submission_attempts
ALTER TABLE public.submission_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
  ON public.submission_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own attempts"
  ON public.submission_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage attempts"
  ON public.submission_attempts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- SYSTEM_SETTINGS TABLE
-- =====================
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by authenticated"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- FUNCTIONS AND TRIGGERS
-- =====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to lock user after first solve
CREATE OR REPLACE FUNCTION public.lock_user_on_first_solve()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET is_locked = TRUE
  WHERE id = NEW.user_id AND is_locked = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to lock user on first solve
CREATE TRIGGER on_first_solve
  AFTER INSERT ON public.solves
  FOR EACH ROW EXECUTE FUNCTION public.lock_user_on_first_solve();

-- Function to update challenge solve count
CREATE OR REPLACE FUNCTION public.update_challenge_solve_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.challenges
  SET solve_count = solve_count + 1
  WHERE id = NEW.challenge_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update solve count
CREATE TRIGGER on_new_solve
  AFTER INSERT ON public.solves
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_solve_count();

-- Enable realtime for activity_log and solves
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solves;

-- =====================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =====================
INSERT INTO public.system_settings (key, value, description) VALUES
  ('game_paused', 'false', 'Whether the game is paused'),
  ('game_start_time', '2024-01-01T00:00:00Z', 'Game start time (ISO 8601)'),
  ('game_end_time', '2024-12-31T23:59:59Z', 'Game end time (ISO 8601)'),
  ('decay_rate', '0.5', 'Dynamic scoring decay rate'),
  ('decay_factor', '10', 'Number of solves before decay kicks in'),
  ('min_points', '50', 'Minimum points a challenge can award'),
  ('event_title', 'ZeroDelta', 'CTF event title'),
  ('flag_salt', 'zd_s3cr3t_s4lt_2024_x7k9', 'Salt for flag hashing'),
  ('honeypot_hash', '', 'Hash of the honeypot flag'),
  ('instance_reset_interval', '15', 'Minutes between instance resets');
