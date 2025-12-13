import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicLeaderboard } from '@/hooks/usePublicLeaderboard';
import { Badge, UserCheck, TrendingUp, Crown, Award, Medal, Trophy } from 'lucide-react';
import DOMPurify from 'dompurify';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

export default function Scoreboard() {
  const { individual, isLoading, stats } = usePublicLeaderboard();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [rankUpPlayer, setRankUpPlayer] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRankingsRef = useRef<Map<string, number>>(new Map());
  const prevLeaderRef = useRef<string | null>(null);

  // Check if anyone has points (competition has actual solves)
  const hasAnyPoints = individual.some(p => p.total_points > 0);

  // Track rank changes and trigger animations
  useEffect(() => {
    if (individual.length === 0) return;

    const newRankings = new Map<string, number>();
    individual.forEach((player, index) => {
      newRankings.set(player.id, index + 1);
    });

    // Check for rank-up animations
    const movedUpPlayers: string[] = [];
    individual.forEach((player, index) => {
      const currentRank = index + 1;
      const prevRank = prevRankingsRef.current.get(player.id);
      if (prevRank && prevRank > currentRank) {
        movedUpPlayers.push(player.id);
      }
    });

    if (movedUpPlayers.length > 0) {
      setRankUpPlayer(movedUpPlayers[0]);
      setTimeout(() => setRankUpPlayer(null), 2000);
    }

    // Check for new #1 - trigger confetti
    const currentLeader = individual[0]?.id;
    if (prevLeaderRef.current && prevLeaderRef.current !== currentLeader && currentLeader) {
      triggerConfetti();
    }

    prevRankingsRef.current = newRankings;
    prevLeaderRef.current = currentLeader || null;
  }, [individual]);

  // Confetti effect
  const triggerConfetti = () => {
    const particles: ConfettiParticle[] = [];
    const colors = ['#F59E0B', '#DC2626', '#F5F5DC', '#FCD34D', '#EF4444'];
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
      });
    }
    
    setConfettiParticles(particles);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Auto-scroll logic - slower speed for noir aesthetic
  useEffect(() => {
    if (isPaused || !containerRef.current) return;

    let animationId: number;
    const scroll = () => {
      setScrollPosition(prev => {
        const maxScroll = containerRef.current 
          ? containerRef.current.scrollHeight - containerRef.current.clientHeight 
          : 0;
        if (prev >= maxScroll) return 0;
        return prev + 0.2; // Slower scroll for dramatic effect
      });
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Sync scroll position
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const getRankIcon = (rank: number, hasPoints: boolean) => {
    // Only show special icons if there are actual points
    if (!hasPoints || !hasAnyPoints) {
      return <span className="w-6 h-6 flex items-center justify-center text-sm font-mono text-muted-foreground">#{rank}</span>;
    }
    switch (rank) {
      case 1:
        return <Crown className="w-12 h-12 text-primary animate-pulse" />;
      case 2:
        return <Award className="w-10 h-10 text-muted-foreground" />;
      case 3:
        return <Medal className="w-10 h-10 text-secondary" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-mono text-muted-foreground">#{rank}</span>;
    }
  };

  const getRowStyle = (rank: number, hasPoints: boolean) => {
    if (!hasPoints || !hasAnyPoints) {
      return 'bg-card/50 border-border/30';
    }
    switch (rank) {
      case 1:
        return 'bg-primary/20 border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.3)]';
      case 2:
        return 'bg-muted/30 border-muted/50';
      case 3:
        return 'bg-secondary/20 border-secondary/50';
      default:
        return 'bg-card/50 border-border/30';
    }
  };

  const getPlaceLabel = (rank: number) => {
    switch (rank) {
      case 1:
        return '1ST PLACE';
      case 2:
        return '2ND PLACE';
      case 3:
        return '3RD PLACE';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          className="text-primary font-mono text-xl tracking-wider"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          LOADING CASE FILES...
        </motion.div>
      </div>
    );
  }

  // Separate top 3 from rest
  const top3 = individual.slice(0, 3);
  const rest = individual.slice(3);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Noir rain overlay effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            hsl(38 100% 50% / 0.03) 2px,
            hsl(38 100% 50% / 0.03) 4px
          )`,
          animation: 'rain 0.5s linear infinite',
        }} />
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {confettiParticles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-3 h-3 rounded-sm"
                style={{ 
                  left: `${particle.x}%`, 
                  backgroundColor: particle.color,
                }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ 
                  y: '100vh', 
                  opacity: 0, 
                  rotate: 360,
                  x: [0, 20, -20, 10, 0],
                }}
                transition={{ 
                  duration: 3, 
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/30">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Badge className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary tracking-wider font-mono">
                {stats.competition_name || 'INCIDENT BOARD'}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                CASE #2025 // LIVE DETECTIVE RANKINGS
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Live user counter */}
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded border border-primary/30">
              <UserCheck className="w-5 h-5 text-primary" />
              <span className="text-primary font-mono font-bold">{stats.user_count}</span>
              <span className="text-muted-foreground text-sm font-mono">AGENTS</span>
            </div>
            
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 border border-primary/50 text-primary font-mono text-sm hover:bg-primary/10 transition-colors"
            >
              {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrolling Content */}
      <div 
        ref={containerRef}
        className="pt-24 pb-32 px-8 overflow-hidden"
        style={{ 
          height: '100vh',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* TOP 3 - Horizontal Layout */}
        {top3.length > 0 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-mono text-primary tracking-widest">
                {hasAnyPoints ? 'TOP DETECTIVES' : 'REGISTERED AGENTS'}
              </h2>
              <div className="w-32 h-0.5 bg-primary/50 mx-auto mt-2" />
            </div>
            
            <div className="flex justify-center items-end gap-6 md:gap-12">
              {/* Reorder: 2nd, 1st, 3rd for podium effect */}
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((player, idx) => {
                if (!player) return null;
                const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const sanitizedName = DOMPurify.sanitize(player.username || 'Anonymous');
                const isRankingUp = rankUpPlayer === player.id;
                const playerHasPoints = player.total_points > 0;
                
                // Size variations
                const containerHeight = actualRank === 1 ? 'h-72' : 'h-56';
                const avatarSize = actualRank === 1 ? 'w-24 h-24' : 'w-20 h-20';
                
                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: isRankingUp ? 1.05 : 1,
                    }}
                    className={`
                      flex flex-col items-center justify-end ${containerHeight}
                      px-6 py-4 rounded-lg border
                      ${getRowStyle(actualRank, playerHasPoints)}
                      ${isRankingUp ? 'ring-2 ring-primary/50' : ''}
                    `}
                  >
                    {/* Place label above icon - only show if has points */}
                    {playerHasPoints && hasAnyPoints && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                          mb-2 px-3 py-1 rounded text-xs font-mono font-bold
                          ${actualRank === 1 ? 'bg-primary text-background' : 
                            actualRank === 2 ? 'bg-muted text-foreground' : 
                            'bg-secondary text-background'}
                        `}
                      >
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {getPlaceLabel(actualRank)}
                        </div>
                      </motion.div>
                    )}

                    {/* Icon */}
                    <div className="mb-3">
                      {getRankIcon(actualRank, playerHasPoints)}
                    </div>
                    
                    {/* Avatar */}
                    <div className={`
                      ${avatarSize} rounded-full overflow-hidden border-2 mb-3
                      ${playerHasPoints && hasAnyPoints ? (
                        actualRank === 1 ? 'border-primary shadow-[0_0_25px_hsl(var(--primary)/0.6)]' : 
                        actualRank === 2 ? 'border-muted shadow-[0_0_15px_hsl(var(--muted)/0.4)]' : 
                        'border-secondary shadow-[0_0_15px_hsl(var(--secondary)/0.4)]'
                      ) : 'border-border'}
                    `}>
                      {player.avatar_url ? (
                        <img 
                          src={player.avatar_url} 
                          alt={sanitizedName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="font-bold text-muted-foreground text-2xl">
                            {sanitizedName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Name */}
                    <span 
                      className={`font-mono font-bold text-center ${
                        playerHasPoints && hasAnyPoints && actualRank === 1 ? 'text-xl text-primary' : 'text-lg text-foreground'
                      }`}
                      dangerouslySetInnerHTML={{ __html: sanitizedName }}
                    />
                    
                    {/* Points */}
                    <div className={`font-bold font-mono ${
                      playerHasPoints && hasAnyPoints && actualRank === 1 ? 'text-2xl text-primary' : 'text-xl text-foreground'
                    } mt-1`}>
                      {player.total_points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">POINTS</div>
                    
                    {/* First bloods */}
                    {player.first_bloods > 0 && (
                      <span className="text-secondary text-sm mt-1">
                        🩸 ×{player.first_bloods}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Divider */}
        {rest.length > 0 && (
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground font-mono">OTHER AGENTS</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
        )}

        {/* REST - Vertical List */}
        <AnimatePresence mode="popLayout">
          {rest.map((player, index) => {
            const rank = index + 4; // Start from rank 4
            const isRankingUp = rankUpPlayer === player.id;
            const sanitizedName = DOMPurify.sanitize(player.username || 'Anonymous');
            
            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: isRankingUp ? 1.02 : 1,
                }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className={`
                  relative flex items-center gap-6 p-4 mb-3 border rounded
                  ${getRowStyle(rank, player.total_points > 0)}
                  ${isRankingUp ? 'ring-2 ring-primary/50' : ''}
                  transition-all duration-300
                `}
              >
                {/* Rank-up indicator */}
                {isRankingUp && (
                  <motion.div
                    className="absolute -left-8 text-primary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <TrendingUp className="w-6 h-6" />
                  </motion.div>
                )}

                {/* Rank */}
                <div className="w-16 flex justify-center">
                  <span className="text-sm font-mono text-muted-foreground">#{rank}</span>
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                  {player.avatar_url ? (
                    <img 
                      src={player.avatar_url} 
                      alt={sanitizedName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="font-bold text-muted-foreground text-lg">
                        {sanitizedName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name & Stats */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span 
                      className="font-mono font-bold text-lg text-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizedName }}
                    />
                    {player.first_bloods > 0 && (
                      <span className="text-secondary text-sm">
                        🩸 ×{player.first_bloods}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {player.solve_count} CASES SOLVED
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="font-bold font-mono text-2xl text-foreground">
                    {player.total_points.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground font-mono text-xs">POINTS</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {individual.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-mono text-lg">NO AGENTS REGISTERED</p>
          </div>
        )}
      </div>

      {/* Footer signature */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground/50 font-mono">
          CASE #2025 // LEAD INVESTIGATOR: 0xfsl (Faisal AL-Jaber)
        </p>
      </div>

      {/* Rain animation keyframes */}
      <style>{`
        @keyframes rain {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
      `}</style>
    </div>
  );
}