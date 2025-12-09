-- Add first_blood_bonus setting if it doesn't exist
INSERT INTO public.system_settings (key, value, description)
VALUES ('first_blood_bonus', '10', 'Bonus points awarded for achieving first blood on a challenge')
ON CONFLICT (key) DO NOTHING;