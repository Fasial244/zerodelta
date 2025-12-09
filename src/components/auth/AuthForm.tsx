import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Mail, Lock, Eye, EyeOff, Phone, BadgeCheck } from 'lucide-react';
import { z } from 'zod';

// Enhanced input validation schemas
const emailSchema = z.string().trim().email('Invalid email address').max(255, 'Email too long');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long');

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes');

const universityIdSchema = z
  .string()
  .trim()
  .min(10, 'Must be at least 10 digits')
  .max(15, 'Maximum 15 digits')
  .regex(
    /^(2\d{9}|\d{10,15})$/,
    'Must be a 10-digit ID starting with 2, or a phone number (10-15 digits)'
  );

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    username?: string;
    fullName?: string;
    universityId?: string;
  }>({});
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  // Check username uniqueness before signup
  const checkUsernameUnique = async (usernameToCheck: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameToCheck.toLowerCase())
      .maybeSingle();
    return !data;
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        newErrors.username = usernameResult.error.errors[0].message;
      } else {
        // Check username uniqueness
        const isUnique = await checkUsernameUnique(username);
        if (!isUnique) {
          newErrors.username = 'Username is already taken';
        }
      }

      const fullNameResult = fullNameSchema.safeParse(fullName);
      if (!fullNameResult.success) {
        newErrors.fullName = fullNameResult.error.errors[0].message;
      }

      const universityIdResult = universityIdSchema.safeParse(universityId);
      if (!universityIdResult.success) {
        newErrors.universityId = universityIdResult.error.errors[0].message;
      }
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
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        toast({ title: 'Welcome back!', description: 'Successfully logged in.' });
      } else {
        const { error } = await signUp(
          email.trim(), 
          password, 
          username.trim(),
          fullName.trim(),
          universityId.trim()
        );
        if (error) throw error;
        toast({ title: 'Account created!', description: 'You can now log in.' });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="border-gradient p-[2px] rounded-lg">
        <div className="bg-card rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-primary animate-pulse-glow" />
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2 text-glow-cyan">
            {isLogin ? 'ACCESS TERMINAL' : 'REGISTER NODE'}
          </h2>
          
          <p className="text-muted-foreground text-center mb-6 font-mono text-sm">
            {isLogin ? 'Enter credentials to proceed' : 'Create your operator profile'}
          </p>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-border hover:bg-accent font-mono flex items-center justify-center gap-3"
            onClick={async () => {
              const { error } = await signInWithGoogle();
              if (error) {
                toast({
                  title: 'Error',
                  description: error.message,
                  variant: 'destructive',
                });
              }
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-mono">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrors(prev => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="Faisal AL-Jaber"
                    className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${errors.fullName ? 'border-destructive' : ''}`}
                    required={!isLogin}
                    maxLength={100}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="universityId" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    University ID / Phone *
                  </Label>
                  <Input
                    id="universityId"
                    type="text"
                    value={universityId}
                    onChange={(e) => {
                      setUniversityId(e.target.value);
                      setErrors(prev => ({ ...prev, universityId: undefined }));
                    }}
                    placeholder="2123456789 or phone number"
                    className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${errors.universityId ? 'border-destructive' : ''}`}
                    required={!isLogin}
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground">
                    10-digit ID starting with 2, or phone number (10-15 digits)
                  </p>
                  {errors.universityId && (
                    <p className="text-sm text-destructive">{errors.universityId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Username
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
                    className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${errors.username ? 'border-destructive' : ''}`}
                    required={!isLogin}
                    maxLength={32}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="operator@zerodelta.ctf"
                className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${errors.email ? 'border-destructive' : ''}`}
                required
                maxLength={255}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`bg-input border-border focus:border-primary focus:ring-primary font-mono pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  required
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">PROCESSING...</span>
              ) : isLogin ? (
                'LOGIN'
              ) : (
                'REGISTER'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              {isLogin ? "Don't have an account? " : 'Already registered? '}
              <span className="text-primary underline">
                {isLogin ? 'Register' : 'Login'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
