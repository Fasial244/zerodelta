import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, LogIn, LogOut, Copy, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

export function TeamPanel() {
  const { user, profile } = useAuth();
  const { team, isLoading, isLocked, createTeam, joinTeam, leaveTeam, isCreating, isJoining, isLeaving } = useTeam();
  const { toast } = useToast();
  const [mode, setMode] = useState<'view' | 'create' | 'join'>('view');
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  if (!user) {
    return (
      <div className="border border-border rounded-lg bg-card/50 p-6 text-center">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-mono">Login to manage your team</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg bg-card/50 p-6">
        <div className="animate-pulse text-muted-foreground font-mono text-center">
          Loading team...
        </div>
      </div>
    );
  }

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      toast({ title: 'Join code copied!' });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      createTeam(teamName.trim());
      setTeamName('');
      setMode('view');
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      joinTeam(joinCode.trim());
      setJoinCode('');
      setMode('view');
    }
  };

  // User has a team
  if (team) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border rounded-lg bg-card/50 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {DOMPurify.sanitize(team.name)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Score: {team.score.toLocaleString()} pts
              </p>
            </div>
          </div>
          {isLocked && (
            <div className="flex items-center gap-1 text-sm text-warning">
              <Lock className="w-4 h-4" />
              Locked
            </div>
          )}
        </div>

        {/* Join code */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Join Code:</span>
          <code className="font-mono text-primary">{team.join_code}</code>
          <Button variant="ghost" size="icon" onClick={copyJoinCode}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        {/* Team members */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">MEMBERS</h4>
          <div className="space-y-2">
            {(team as any).profiles?.map((member: any) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(member.username || '??').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">
                  {DOMPurify.sanitize(member.username || 'Anonymous')}
                </span>
                {member.id === user.id && (
                  <span className="text-xs text-primary">(you)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isLocked && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => leaveTeam()}
            disabled={isLeaving}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Team
          </Button>
        )}

        {isLocked && (
          <p className="text-xs text-muted-foreground text-center">
            Team membership is locked after your first solve
          </p>
        )}
      </motion.div>
    );
  }

  // No team - show create/join options
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg bg-card/50 p-6"
    >
      {mode === 'view' && (
        <>
          <div className="text-center mb-6">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-foreground mb-1">Solo Mode</h3>
            <p className="text-sm text-muted-foreground">
              Create or join a team to compete together
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setMode('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
            <Button variant="outline" onClick={() => setMode('join')}>
              <LogIn className="w-4 h-4 mr-2" />
              Join
            </Button>
          </div>
        </>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <h3 className="font-bold text-foreground">Create Team</h3>
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Elite Hackers"
              className="bg-input border-border"
              maxLength={50}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setMode('view')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !teamName.trim()} className="flex-1">
              Create
            </Button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <h3 className="font-bold text-foreground">Join Team</h3>
          <div className="space-y-2">
            <Label htmlFor="joinCode">Join Code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="bg-input border-border font-mono uppercase"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setMode('view')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isJoining || !joinCode.trim()} className="flex-1">
              Join
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
