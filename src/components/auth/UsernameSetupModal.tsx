import React, { useState } from "react";
import { motion } from "framer-motion";
import { User } from "react-feather"; // Assuming you're using react-feather for the icon
import { useAuth } from "../hooks/useAuth"; // Assuming this hook exists
import { useToast } from "../hooks/useToast"; // Assuming this hook exists
import { usernameSchema } from "../validationSchemas"; // Assuming you have a validation schema for username

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

    // Validate username input
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await updateProfile({ username: username.trim() });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Username set!",
        description: "Your profile has been updated.",
      });

      onComplete(); // Call the onComplete prop after successful update
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update username";
      setError(errorMessage);

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

            {/* Add form elements here if required */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 p-2 w-full border border-gray-300 rounded-md"
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" className="w-full py-2 mt-4 bg-blue-600 text-white rounded-md" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Username"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
