import { motion } from 'framer-motion';
import { Lock, CheckCircle, Droplets } from 'lucide-react';
import { Challenge } from '@/hooks/useChallenges';
import DOMPurify from 'dompurify';

interface MobileChallengeListProps {
  challenges: Challenge[];
  onSelectChallenge: (challenge: Challenge) => void;
  isChallengeUnlocked: (challenge: Challenge) => boolean;
  isChallengeSolved: (challengeId: string) => boolean;
}

const categoryStyles: Record<string, string> = {
  Web: 'border-primary/50 bg-primary/10',
  Pwn: 'border-secondary/50 bg-secondary/10',
  Crypto: 'border-accent/50 bg-accent/10',
  Forensics: 'border-warning/50 bg-warning/10',
  Other: 'border-muted-foreground/50 bg-muted/20',
};

const categoryTextStyles: Record<string, string> = {
  Web: 'text-primary',
  Pwn: 'text-secondary',
  Crypto: 'text-accent',
  Forensics: 'text-warning',
  Other: 'text-muted-foreground',
};

export function MobileChallengeList({
  challenges,
  onSelectChallenge,
  isChallengeUnlocked,
  isChallengeSolved,
}: MobileChallengeListProps) {
  return (
    <div className="space-y-3">
      {challenges.map((challenge, index) => {
        const isUnlocked = isChallengeUnlocked(challenge);
        const isSolved = isChallengeSolved(challenge.id);
        const hasFirstBlood = !!challenge.first_blood_user_id;

        return (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => isUnlocked && onSelectChallenge(challenge)}
            className={`
              relative p-4 rounded-lg border transition-all duration-200 overflow-hidden
              ${isUnlocked ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}
              ${isSolved ? 'border-accent bg-accent/10' : categoryStyles[challenge.category] || categoryStyles.Other}
            `}
          >
            {/* Locked overlay with blur */}
            {!isUnlocked && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                    <Lock className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-sm font-mono uppercase">Solve dependencies first</span>
                </div>
              </div>
            )}

            <div className={`flex items-start justify-between gap-3 ${!isUnlocked ? 'blur-[2px]' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isSolved && <CheckCircle className="w-4 h-4 text-accent" />}
                  {hasFirstBlood && <Droplets className="w-4 h-4 text-destructive" />}
                  <h3 className="font-bold text-foreground truncate">
                    {DOMPurify.sanitize(challenge.title)}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`font-mono ${categoryTextStyles[challenge.category] || 'text-muted-foreground'}`}>
                    {challenge.category}
                  </span>
                  <span className="text-muted-foreground">
                    {challenge.solve_count} solve{challenge.solve_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono font-bold text-lg ${isSolved ? 'text-accent' : 'text-foreground'}`}>
                  {challenge.points}
                </span>
                <span className="text-muted-foreground text-sm block">pts</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
