import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, User, Droplet } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

export function LeaderboardTabs() {
  const { individual, teams, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground font-mono">
          LOADING RANKINGS...
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="individual" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
        <TabsTrigger value="individual" className="font-mono">
          <User className="w-4 h-4 mr-2" />
          INDIVIDUAL
        </TabsTrigger>
        <TabsTrigger value="team" className="font-mono">
          <Users className="w-4 h-4 mr-2" />
          TEAMS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="individual">
        <div className="space-y-2">
          {individual.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 font-mono">
              No solves yet. Be the first!
            </p>
          ) : (
            individual.map((entry, index) => (
              <LeaderboardRow
                key={entry.id}
                rank={index + 1}
                name={DOMPurify.sanitize(entry.username)}
                points={entry.total_points}
                subtitle={entry.team_name ? `Team: ${DOMPurify.sanitize(entry.team_name)}` : 'Solo'}
                avatar={entry.avatar_url}
                solves={entry.solve_count}
                firstBloods={entry.first_bloods}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="team">
        <div className="space-y-2">
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 font-mono">
              No team scores yet.
            </p>
          ) : (
            teams.map((team, index) => (
              <LeaderboardRow
                key={team.id}
                rank={index + 1}
                name={DOMPurify.sanitize(team.name)}
                points={team.score}
                subtitle={`${team.member_count} member${team.member_count !== 1 ? 's' : ''}`}
                isTeam
              />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface LeaderboardRowProps {
  rank: number;
  name: string;
  points: number;
  subtitle?: string;
  avatar?: string | null;
  solves?: number;
  firstBloods?: number;
  isTeam?: boolean;
}

function LeaderboardRow({
  rank,
  name,
  points,
  subtitle,
  avatar,
  solves,
  firstBloods,
  isTeam,
}: LeaderboardRowProps) {
  const getRankStyle = () => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';
    if (rank === 2) return 'bg-gray-400/20 border-gray-400/50 text-gray-400';
    if (rank === 3) return 'bg-amber-600/20 border-amber-600/50 text-amber-600';
    return 'bg-card border-border';
  };

  const getRankIcon = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03 }}
      className={`flex items-center gap-4 p-4 rounded-lg border ${getRankStyle()}`}
    >
      {/* Rank */}
      <div className="w-12 text-center font-bold font-mono text-lg">
        {getRankIcon()}
      </div>

      {/* Avatar */}
      {!isTeam && (
        <Avatar className="w-10 h-10 border border-border">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {isTeam && (
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{name}</span>
          {firstBloods && firstBloods > 0 && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <Droplet className="w-3 h-3" />
              {firstBloods}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="font-bold text-primary font-mono">
          {points.toLocaleString()} pts
        </div>
        {solves !== undefined && (
          <p className="text-xs text-muted-foreground">
            {solves} solve{solves !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}
