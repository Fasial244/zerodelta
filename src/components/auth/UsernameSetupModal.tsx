import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");

interface UsernameSetupModalProps {
  onComplete: () => void;
}

export function UsernameSetupModal({ onComplete }: UsernameSetupModalProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { updateProfile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await updateProfile({ username: username.trim() });
      if (updateError) throw updateError;

      toast({
        title: "Username set!",
        description: "Your profile has been updated.",
      });
      onComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update username";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="border-gradient p-[2px] rounded-lg">
          <div className="bg-card rounded-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <User className="h-12 w-12 text-primary animate-pulse-glow" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2 text-glow-cyan">SET YOUR CALLSIGN</h2>

            <p className="text-muted-foreground text-center mb-6 font-mono text-sm">
              Choose a username for the leaderboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-username" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Username
                </Label>
                <Input
                  id="new-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="ghost_hacker"
                  className={`bg-input border-border focus:border-primary focus:ring-primary font-mono ${
                    error ? "border-destructive" : ""
                  }`}
                  autoFocus
                  maxLength={32}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
                disabled={isLoading}
              >
                {isLoading ? <span className="animate-pulse">SAVING...</span> : "CONFIRM USERNAME"}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
