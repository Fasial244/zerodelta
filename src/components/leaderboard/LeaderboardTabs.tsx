import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Cpu, Laptop, Users, User, Droplet, Shield } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

export function LeaderboardTabs() {
  const { individual, teams, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-primary font-mono text-xl">
          [ SYNCHRONIZING NEURAL NET... ]
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="individual" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-background/40 border border-primary/20">
        <TabsTrigger value="individual" className="font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          <User className="w-4 h-4 mr-2" />
          OPERATIVES
        </TabsTrigger>
        <TabsTrigger value="team" className="font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          <Users className="w-4 h-4 mr-2" />
          FACTIONS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="individual" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {individual.length === 0 ? (
            <p className="text-center text-muted-foreground font-mono py-8">No data yet...</p>
          ) : (
            individual.map((entry, index) => (
              <LeaderboardRow
                key={entry.id}
                rank={index + 1}
                name={DOMPurify.sanitize(entry.username)}
                points={entry.total_points}
                subtitle={entry.team_name || 'Rogue Agent'}
                avatar={entry.avatar_url}
                solves={entry.solve_count}
                firstBloods={entry.first_bloods}
              />
            ))
          )}
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="team" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground font-mono py-8">No team scores yet...</p>
          ) : (
            teams.map((team, index) => (
              <LeaderboardRow
                key={team.id}
                rank={index + 1}
                name={DOMPurify.sanitize(team.name)}
                points={team.score}
                subtitle={`${team.member_count} operator${team.member_count !== 1 ? 's' : ''}`}
                isTeam
              />
            ))
          )}
        </AnimatePresence>
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
  // Computer icons for top 3
  const getRankIcon = () => {
    if (rank === 1) return <Monitor className="w-7 h-7 text-yellow-500 animate-pulse" />;
    if (rank === 2) return <Cpu className="w-7 h-7 text-slate-400" />;
    if (rank === 3) return <Laptop className="w-7 h-7 text-amber-700" />;
    return <span className="font-mono text-lg text-muted-foreground">#{rank}</span>;
  };

  // Special styling for top 3
  const getRowStyle = () => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)]';
    if (rank === 2) return 'bg-slate-400/10 border-slate-400/50';
    if (rank === 3) return 'bg-amber-700/10 border-amber-700/50';
    return 'bg-card/50 border-border hover:border-primary/50';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${getRowStyle()}`}
    >
      {/* Rank Column */}
      <div className="w-14 flex justify-center font-bold">
        {getRankIcon()}
      </div>

      {/* Avatar */}
      {!isTeam ? (
        <Avatar className={`w-11 h-11 border-2 ${rank <= 3 ? 'border-primary' : 'border-transparent'}`}>
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-mono font-bold">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${rank <= 3 ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
          <Users className="w-5 h-5 text-primary" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg truncate ${rank === 1 ? 'text-yellow-500' : 'text-foreground'}`}>
            {name}
          </span>
          {firstBloods !== undefined && firstBloods > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-destructive/20 rounded text-destructive text-xs font-bold border border-destructive/50">
              <Droplet className="w-3 h-3 fill-current" />
              {firstBloods}
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground font-mono flex items-center gap-2">
          <Shield className="w-3 h-3" />
          {subtitle}
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <motion.div 
          key={points}
          initial={{ scale: 1.4, color: 'hsl(var(--accent))' }}
          animate={{ scale: 1, color: rank === 1 ? '#eab308' : 'hsl(var(--foreground))' }}
          className="text-2xl font-black font-mono"
        >
          {points.toLocaleString()}
        </motion.div>
        <div className="text-xs text-muted-foreground font-mono">
          {solves !== undefined ? `${solves} solve${solves !== 1 ? 's' : ''}` : 'PTS'}
        </div>
      </div>
    </motion.div>
  );
}
