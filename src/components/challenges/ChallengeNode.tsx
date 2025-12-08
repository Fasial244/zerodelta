import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Lock, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Challenge } from '@/hooks/useChallenges';

interface ChallengeNodeProps {
  data: {
    challenge: Challenge;
    isUnlocked: boolean;
    isSolved: boolean;
    color: string;
    onSelect: () => void;
  };
}

export const ChallengeNode = memo(({ data }: ChallengeNodeProps) => {
  const { challenge, isUnlocked, isSolved, color, onSelect } = data;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={isUnlocked ? { scale: 1.05 } : {}}
        onClick={onSelect}
        className={`
          relative w-56 p-4 rounded-lg border-2 transition-all duration-300
          ${isUnlocked 
            ? 'cursor-pointer hover:shadow-lg' 
            : 'cursor-not-allowed opacity-50'
          }
          ${isSolved 
            ? 'bg-primary/10 border-primary' 
            : 'bg-card border-border'
          }
        `}
        style={{
          borderColor: isSolved ? undefined : (isUnlocked ? color : undefined),
          boxShadow: isUnlocked && !isSolved ? `0 0 20px ${color}40` : undefined,
        }}
      >
        {/* Status indicator */}
        <div className="absolute -top-2 -right-2">
          {isSolved ? (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-primary-foreground" />
            </div>
          ) : !isUnlocked ? (
            <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
              <Lock className="w-4 h-4 text-destructive-foreground" />
            </div>
          ) : null}
        </div>

        {/* First blood indicator */}
        {challenge.first_blood_user_id && (
          <div className="absolute -top-2 -left-2 text-lg">🩸</div>
        )}

        {/* Category badge */}
        <div 
          className="inline-block px-2 py-0.5 rounded text-xs font-mono mb-2"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {challenge.category}
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground truncate mb-1">
          {challenge.title}
        </h3>

        {/* Points */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Zap className="w-3 h-3" style={{ color }} />
          <span>{challenge.points} pts</span>
          {challenge.solve_count > 0 && (
            <span className="ml-2 text-xs">
              ({challenge.solve_count} solve{challenge.solve_count !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </>
  );
});

ChallengeNode.displayName = 'ChallengeNode';
