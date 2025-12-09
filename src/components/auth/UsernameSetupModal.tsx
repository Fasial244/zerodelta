import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTeam } from "@/hooks/useTeam";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");

export default function Profile() {
  const { user, profile, isLoading: authLoading, updateProfile } = useAuth();
  const { stats, solveHistory, isLoading: profileLoading } = useProfile();
  const { team, isLoading: teamLoading, isLocked } = useTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { toast } = useToast();

  if (authLoading || profileLoading || teamLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-primary font-mono animate-pulse">LOADING...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveUsername = async () => {
    const validationResult = usernameSchema.safeParse(newUsername);
    if (!validationResult.success) {
      setUsernameError(validationResult.error.errors[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({ username: validationResult.data });
      if (result.error) {
        throw result.error;
      }
      toast({ title: "Username updated!" });
      setIsEditing(false);
      setUsernameError(null);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update username";
      setUsernameError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryClass = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === "web") return "category-web";
    if (lower === "pwn") return "category-pwn";
    if (lower === "forensics") return "category-forensics";
    if (lower === "crypto") return "category-crypto";
    return "category-other";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-2xl font-semibold text-center text-primary">Profile</h1>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 border-2 border-primary mb-4">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-mono">
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {isEditing ? (
                    <div className="w-full space-y-2">
                      <Input
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value);
                          setUsernameError(null);
                        }}
                        placeholder="New username"
                        className="text-center"
                      />
                      {usernameError && <p className="text-sm text-destructive text-center">{usernameError}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveUsername} disabled={isSaving} className="flex-1">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <h2 className="text-xl font-bold font-mono text-foreground mb-1">
                        {DOMPurify.sanitize(profile?.username || "Anonymous")}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewUsername(profile?.username || "");
                          setUsernameError(null);
                          setIsEditing(true);
                        }}
                      >
                        Edit Username
                      </Button>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={isLocked ? "destructive" : "outline"} className="gap-1">
                        {isLocked ? <Lock className="h-3 w-3" /> : null}
                        {isLocked ? "Locked" : "Active"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="font-mono text-foreground">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
