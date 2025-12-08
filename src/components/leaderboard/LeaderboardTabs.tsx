import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Crown, Award, Medal, Droplet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

export function LeaderboardTabs() {
  const { individual, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground font-mono animate-pulse">
        LOADING CASE FILES...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground font-mono mb-4 px-2">
        {individual.length} REGISTERED AGENTS
      </div>
      
      <AnimatePresence mode="popLayout">
        {individual.map((entry, index) => (
          <LeaderboardRow
            key={entry.id}
            rank={index + 1}
            name={DOMPurify.sanitize(entry.username)}
            points={entry.total_points}
            avatar={entry.avatar_url}
            solves={entry.solve_count}
            firstBloods={entry.first_bloods}
          />
        ))}
      </AnimatePresence>

      {individual.length === 0 && (
        <div className="text-center py-8 text-muted-foreground font-mono">
          NO AGENTS REGISTERED YET
        </div>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  rank: number;
  name: string;
  points: number;
  avatar: string | null;
  solves: number;
  firstBloods: number;
}

function LeaderboardRow({ rank, name, points, avatar, solves, firstBloods }: LeaderboardRowProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-primary" />;
      case 2:
        return <Award className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Medal className="w-5 h-5 text-secondary" />;
      default:
        return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
    }
  };

  const getRowStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-primary/10 border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.15)]';
      case 2:
        return 'bg-muted/20 border-muted/40';
      case 3:
        return 'bg-secondary/10 border-secondary/40';
      default:
        return 'bg-card/30 border-border/30 hover:bg-card/50';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`
        flex items-center gap-4 p-3 rounded border transition-all
        ${getRowStyle()}
      `}
    >
      {/* Rank */}
      <div className="w-10 flex justify-center">
        {getRankIcon()}
      </div>

      {/* Avatar */}
      <Avatar className={`
        w-10 h-10 border-2
        ${rank === 1 ? 'border-primary' : 
          rank === 2 ? 'border-muted' : 
          rank === 3 ? 'border-secondary' : 'border-border'}
      `}>
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className="bg-muted text-muted-foreground font-mono">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name & Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className={`font-mono font-medium truncate ${rank <= 3 ? 'text-primary' : 'text-foreground'}`}
            dangerouslySetInnerHTML={{ __html: name }}
          />
          {firstBloods > 0 && (
            <span className="flex items-center gap-0.5 text-secondary text-xs">
              <Droplet className="w-3 h-3 fill-current" />
              {firstBloods}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {solves} case{solves !== 1 ? 's' : ''} solved
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <div className={`font-mono font-bold ${rank === 1 ? 'text-primary text-lg' : 'text-foreground'}`}>
          {points.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground font-mono">pts</div>
      </div>
    </motion.div>
  );
}
