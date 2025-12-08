import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Lock, CheckCircle, Zap, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [justUnlocked, setJustUnlocked] = useState(false);
  const prevUnlockedRef = useRef(isUnlocked);

  // Detect when challenge transitions from locked to unlocked
  useEffect(() => {
    if (isUnlocked && !prevUnlockedRef.current) {
      setJustUnlocked(true);
      // Reset animation after it completes
      const timer = setTimeout(() => setJustUnlocked(false), 2000);
      return () => clearTimeout(timer);
    }
    prevUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: justUnlocked ? [1, 1.1, 1] : 1, 
          opacity: 1,
        }}
        transition={{
          scale: justUnlocked ? { duration: 0.5, times: [0, 0.5, 1] } : { duration: 0.3 },
        }}
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
          boxShadow: justUnlocked 
            ? `0 0 40px ${color}, 0 0 60px ${color}80, 0 0 80px ${color}40` 
            : (isUnlocked && !isSolved ? `0 0 20px ${color}40` : undefined),
        }}
      >
        {/* Unlock animation overlay */}
        <AnimatePresence>
          {justUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-30 rounded-lg flex items-center justify-center pointer-events-none"
            >
              {/* Radial burst effect */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute w-20 h-20 rounded-full"
                style={{ backgroundColor: `${color}40` }}
              />
              
              {/* Unlock icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Unlock className="w-8 h-8 text-background" />
              </motion.div>

              {/* Particle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 60,
                    y: Math.sin((i * Math.PI * 2) / 8) * 60,
                  }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locked overlay with blur */}
        <AnimatePresence>
          {!isUnlocked && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-10 rounded-lg bg-background/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <motion.div 
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  className="w-10 h-10 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center"
                >
                  <Lock className="w-5 h-5 text-destructive" />
                </motion.div>
                <span className="text-xs font-mono uppercase">Locked</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <motion.div 
          className="p-4"
          animate={{ filter: !isUnlocked ? 'blur(2px)' : 'blur(0px)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Status indicator */}
          <div className="absolute -top-2 -right-2 z-20">
            <AnimatePresence mode="wait">
              {isSolved ? (
                <motion.div
                  key="solved"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              ) : !isUnlocked ? (
                <motion.div
                  key="locked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                >
                  <Lock className="w-4 h-4 text-destructive-foreground" />
                </motion.div>
              ) : justUnlocked ? (
                <motion.div
                  key="unlocking"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: [1, 1.3, 1], rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  <Unlock className="w-4 h-4 text-background" />
                </motion.div>
              ) : null}
            </AnimatePresence>
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
        </motion.div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </>
  );
});

ChallengeNode.displayName = 'ChallengeNode';
