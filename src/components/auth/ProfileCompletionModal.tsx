import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, BadgeCheck, Phone } from 'lucide-react';
import { z } from 'zod';

// Enhanced validation schemas
const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes');

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

const universityIdSchema = z
  .string()
  .trim()
  .length(10, 'Must be exactly 10 digits')
  .regex(
    /^(22\d{8}|05\d{8})$/,
    'Must be a 10-digit ID starting with 22, or a 10-digit phone number starting with 05'
  );

interface ProfileCompletionModalProps {
  onComplete: () => void;
}

export function ProfileCompletionModal({ onComplete }: ProfileCompletionModalProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    username?: string;
    universityId?: string;
  }>({});
  
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  // Pre-fill existing data
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.username && !profile.username.startsWith('user_')) {
        setUsername(profile.username);
      }
      if (profile.university_id) setUniversityId(profile.university_id);
    }
  }, [profile]);

  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    if (!username || username === profile?.username) return true;
    
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    
    return !data;
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: typeof errors = {};

    // Validate full name
    const fullNameResult = fullNameSchema.safeParse(fullName);
    if (!fullNameResult.success) {
      newErrors.fullName = fullNameResult.error.errors[0].message;
    }

    // Validate username
    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.errors[0].message;
    } else {
      const isUnique = await checkUsernameUnique(username);
      if (!isUnique) {
        newErrors.username = 'Username is already taken';
      }
    }

    // Validate university ID
    const universityIdResult = universityIdSchema.safeParse(universityId);
    if (!universityIdResult.success) {
      newErrors.universityId = universityIdResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const { error: updateError } = await updateProfile({ 
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        university_id: universityId.trim()
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Profile Complete!',
        description: 'You can now access the platform.',
      });
      onComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="border-gradient p-[2px] rounded-lg">
          <div className="bg-card rounded-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <BadgeCheck className="h-12 w-12 text-primary animate-pulse-glow" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2 text-glow-cyan">
              COMPLETE YOUR PROFILE
            </h2>

            <p className="text-muted-foreground text-center mb-6 font-mono text-sm">
              Required information to access the platform
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full-name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Full Name *
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="John Doe"
                  className={`bg-input border-border focus:border-primary focus:ring-primary ${
                    errors.fullName ? 'border-destructive' : ''
                  }`}
                  autoFocus
                  maxLength={100}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors(prev => ({ ...prev, username: undefined }));
                  }}
                  placeholder="ghost_hacker"
                  className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${
                    errors.username ? 'border-destructive' : ''
                  }`}
                  maxLength={32}
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              </div>

              {/* University ID / Phone */}
              <div className="space-y-2">
                <Label htmlFor="university-id" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  University ID / Phone *
                </Label>
                <Input
                  id="university-id"
                  type="text"
                  value={universityId}
                  onChange={(e) => {
                    setUniversityId(e.target.value);
                    setErrors(prev => ({ ...prev, universityId: undefined }));
                  }}
                  placeholder="2123456789 or phone number"
                  className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${
                    errors.universityId ? 'border-destructive' : ''
                  }`}
                  maxLength={10}
                />
                {errors.universityId && <p className="text-sm text-destructive">{errors.universityId}</p>}
                <p className="text-xs text-muted-foreground">
                  10-digit ID starting with 22, or phone starting with 05
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">SAVING...</span>
                ) : (
                  'COMPLETE PROFILE'
                )}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}