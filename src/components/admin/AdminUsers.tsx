import { useState } from 'react';
import { Ban, Unlock, Search, Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';

export function AdminUsers() {
  const { users, banUser, unlockUser } = useAdmin();
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter((user: any) =>
    (user.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const calculateTotalPoints = (solves: any[]) => {
    return solves?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground font-mono">USERS</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-mono">
            No users found
          </p>
        ) : (
          filteredUsers.map((user: any) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                user.is_banned ? 'bg-destructive/10 border-destructive/50' : 'bg-card border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {(user.username || '??').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {DOMPurify.sanitize(user.username || 'Anonymous')}
                    </h3>
                    {user.is_banned && (
                      <Badge variant="destructive">BANNED</Badge>
                    )}
                    {user.is_locked && (
                      <Badge variant="secondary">LOCKED</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {calculateTotalPoints(user.solves).toLocaleString()} pts • 
                    {user.solves?.length || 0} solves • 
                    Team: {user.teams?.name ? DOMPurify.sanitize(user.teams.name) : 'Solo'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.is_locked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlockUser(user.id)}
                  >
                    <Unlock className="w-4 h-4 mr-1" />
                    Unlock
                  </Button>
                )}
                <Button
                  variant={user.is_banned ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => banUser({ userId: user.id, ban: !user.is_banned })}
                  className={user.is_banned ? '' : 'text-destructive hover:text-destructive'}
                >
                  {user.is_banned ? (
                    <>
                      <ShieldOff className="w-4 h-4 mr-1" />
                      Unban
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-1" />
                      Ban
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
