import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { User, Building, BadgeCheck } from "lucide-react";
import { z } from "zod";

// --- Validation Schemas ---
const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email too long");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long");
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");
const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name too long");

// REPLACED universityIdSchema with this:
const idOrPhoneSchema = z
  .string()
  .trim()
  .refine((value) => /^2\d{9}$/.test(value) || /^\+?\d{7,15}$/.test(value), {
    message: "Enter a 10-digit ID starting with 2 or a valid phone number",
  });

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
    fullName?: string;
    universityId?: string;
  }>({});

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const validateForm = (): boolean => {
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
      }

      const fullNameResult = fullNameSchema.safeParse(fullName);
      if (!fullNameResult.success) {
        newErrors.fullName = fullNameResult.error.errors[0].message;
      }

      // UPDATED VALIDATION LOGIC
      const universityIdResult = idOrPhoneSchema.safeParse(universityId);
      if (!universityIdResult.success) {
        newErrors.universityId = universityIdResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        const { error } = await signUp(email.trim(), password, username.trim(), fullName.trim(), universityId.trim());
        if (error) throw error;
        toast({ title: "Account created!", description: "You can now log in." });
        setIsLogin(true);
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{isLogin ? "Login" : "Create Account"}</h1>
        <p className="text-gray-500">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        {!isLogin && (
          <>
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ghost_hacker"
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" /> Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              {/* UPDATED LABEL */}
              <Label htmlFor="universityId" className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> University ID or Phone
              </Label>
              {/* UPDATED PLACEHOLDER */}
              <Input
                id="universityId"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                placeholder="2001234567 or +1234567890"
                className={errors.universityId ? "border-destructive" : ""}
              />
              {errors.universityId && <p className="text-sm text-destructive">{errors.universityId}</p>}
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setErrors({});
          }}
          className="underline hover:text-primary"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
