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
        onClick={isUnlocked ? onSelect : undefined}
        className={`
          relative w-56 rounded-lg border-2 transition-all duration-300
          ${isUnlocked 
            ? 'cursor-pointer hover:shadow-lg' 
            : 'cursor-not-allowed'
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
        {/* Locked overlay with blur */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-10 rounded-lg bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-10 h-10 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <span className="text-xs font-mono uppercase">Locked</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`p-4 ${!isUnlocked ? 'blur-[2px]' : ''}`}>
          {/* Status indicator */}
          <div className="absolute -top-2 -right-2 z-20">
            {isSolved ? (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 text-primary-foreground" />
              </div>
            ) : !isUnlocked ? (
              <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center shadow-lg">
                <Lock className="w-4 h-4 text-destructive-foreground" />
              </div>
            ) : null}
          </div>

          {/* First blood indicator */}
          {challenge.first_blood_user_id && (
            <div className="absolute -top-2 -left-2 text-lg z-20">🩸</div>
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
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </>
  );
});

ChallengeNode.displayName = 'ChallengeNode';
