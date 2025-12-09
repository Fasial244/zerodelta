import { useState } from "react";
import { Ban, Unlock, Search, Shield, ShieldOff, RotateCcw, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DOMPurify from "dompurify";

export function AdminUsers() {
  const { users, banUser, unlockUser, promoteToAdmin, resetUserScore, isLoadingAdmin } = useAdmin();
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user: any) => (user.username || "").toLowerCase().includes(search.toLowerCase()));

  const calculateTotalPoints = (solves: any[]) => {
    return solves?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0;
  };

  // Improved Loading State
  if (isLoadingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-mono animate-pulse">ACCESSING CLASSIFIED RECORDS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground font-mono flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          OPERATIVE DATABASE
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username..."
            className="pl-9 bg-card border-primary/20 focus:border-primary/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground font-mono">{search ? "No operatives match query" : "Database empty"}</p>
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                user.is_banned
                  ? "bg-destructive/5 border-destructive/50"
                  : "bg-card/50 border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-mono">
                    {(user.username || "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground font-mono">
                      {DOMPurify.sanitize(user.username || "Unknown")}
                    </h3>
                    {user.is_banned && (
                      <Badge variant="destructive" className="font-mono text-[10px]">
                        BANNED
                      </Badge>
                    )}
                    {user.is_locked && (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        LOCKED
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1 space-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="text-primary">{calculateTotalPoints(user.solves)} PTS</span>
                      <span>•</span>
                      <span>{user.solves?.length || 0} SOLVES</span>
                      <span>•</span>
                      <span>{user.teams?.name ? `UNIT: ${DOMPurify.sanitize(user.teams.name)}` : "ROGUE AGENT"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground/70">
                      <span>ID: {user.id.slice(0, 8)}...</span>
                      {user.full_name && <span>• {DOMPurify.sanitize(user.full_name)}</span>}
                      {user.university_id && <span>• UID: {DOMPurify.sanitize(user.university_id)}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* ... Keep your existing Alert Dialogs here ... */}

                {/* Only show Promote button if not already admin? (Optional Logic) */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-warning hover:text-warning hover:bg-warning/10">
                      <Crown className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Grant Admin Clearance?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will grant <strong>{user.username}</strong> full control over the ZeroDelta system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abort</AlertDialogCancel>
                      <AlertDialogAction onClick={() => promoteToAdmin(user.id)}>Authorize</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Wipe Agent Record?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Permanently delete all solves for <strong>{user.username}</strong>. Score will reset to 0.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => resetUserScore(user.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Execute Wipe
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {user.is_locked && (
                  <Button variant="ghost" size="sm" onClick={() => unlockUser(user.id)}>
                    <Unlock className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => banUser({ userId: user.id, ban: !user.is_banned })}
                  className={user.is_banned ? "text-muted-foreground" : "text-destructive hover:bg-destructive/10"}
                >
                  {user.is_banned ? <ShieldOff className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
