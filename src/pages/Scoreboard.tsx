import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Users, Star, Monitor, Cpu, Laptop } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function Scoreboard() {
  const { teams, isLoading } = useLeaderboard();
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-Scroll Logic with requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const speed = 0.5; // Pixels per frame

    const animate = (time: number) => {
      if (!isPaused && containerRef.current) {
        if (time - lastTime > 16) { // Cap at ~60fps
          setScrollPosition((prev) => {
            const maxScroll = containerRef.current!.scrollHeight - containerRef.current!.clientHeight;
            if (maxScroll <= 0) return 0;
            if (prev >= maxScroll) return 0; // Loop back to top
            return prev + speed;
          });
          lastTime = time;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, teams.length]);

  // Sync scroll position to DOM
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Get rank icon for top 3
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Monitor className="w-10 h-10 text-yellow-500 animate-pulse" />;
    if (rank === 2) return <Cpu className="w-10 h-10 text-slate-400" />;
    if (rank === 3) return <Laptop className="w-10 h-10 text-amber-700" />;
    return <span className="font-mono text-3xl text-muted-foreground">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-4xl font-mono text-primary animate-pulse">
          INITIALIZING FEED...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="p-8 border-b border-primary/20 bg-background/95 backdrop-blur z-10 flex justify-between items-center shadow-2xl">
        <h1 className="text-5xl font-black font-mono text-primary tracking-tighter">
          LIVE RANKINGS
        </h1>
        <div className="flex gap-6 text-2xl font-mono text-muted-foreground items-center">
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            <span>{teams.length} TEAMS</span>
          </div>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="text-lg border border-border px-6 py-2 rounded-lg hover:bg-accent/10 transition-colors font-mono"
          >
            {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>

      {/* Scrolling List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-8 space-y-4"
        style={{ scrollBehavior: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {teams.length === 0 ? (
            <div className="text-center text-3xl text-muted-foreground font-mono py-20">
              NO TEAMS YET
            </div>
          ) : (
            teams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className={`
                  flex items-center gap-6 p-6 rounded-xl border-2 transition-all
                  ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50 scale-[1.02] shadow-[0_0_50px_rgba(234,179,8,0.2)] my-4' : 
                    index === 1 ? 'bg-slate-400/10 border-slate-400/50' :
                    index === 2 ? 'bg-amber-700/10 border-amber-700/50' : 
                    'bg-card/50 border-border'}
                `}
              >
                {/* Rank */}
                <div className="w-24 flex justify-center">
                  {getRankIcon(index + 1)}
                </div>

                {/* Team Info */}
                <div className="flex-1">
                  <h2 className={`text-4xl font-bold tracking-tight mb-2 ${index === 0 ? 'text-yellow-500' : 'text-foreground'}`}>
                    {DOMPurify.sanitize(team.name)}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-xl">
                    {index === 0 && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                    <span>{team.member_count} OPERATORS</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <motion.div 
                    key={team.score}
                    initial={{ scale: 1.3, color: 'hsl(var(--accent))' }}
                    animate={{ scale: 1, color: index === 0 ? '#eab308' : 'hsl(var(--primary))' }}
                    className="text-5xl font-black font-mono"
                  >
                    {team.score.toLocaleString()}
                  </motion.div>
                  <div className="text-sm font-mono text-muted-foreground mt-1">POINTS</div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {/* Buffer at bottom for smooth looping */}
        <div className="h-32" />
      </div>

      {/* Gradient overlay at bottom */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
      
      {/* Border frame */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-primary/5 z-50" />
    </div>
  );
}