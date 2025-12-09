import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Terminal, Clock, Zap } from 'lucide-react';

interface PublicEventCountdownProps {
  competitionName: string;
  startTime: string;
  endTime: string;
}

export function PublicEventCountdown({ competitionName, startTime, endTime }: PublicEventCountdownProps) {
  const [countdown, setCountdown] = useState('');
  const [status, setStatus] = useState<'before' | 'active' | 'ended'>('before');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        // Before event starts
        setStatus('before');
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdown(`${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      } else if (now >= start && now < end) {
        // Event is active
        setStatus('active');
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        // Event ended
        setStatus('ended');
        setCountdown('00:00:00');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl border border-primary/30 bg-card/80 backdrop-blur-sm p-8"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        {status === 'active' && (
          <motion.div
            className="absolute inset-0 bg-accent/10"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      <div className="relative z-10 text-center">
        {/* Competition Name */}
        <h3 className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-widest">
          {status === 'before' ? 'UPCOMING EVENT' : status === 'active' ? 'LIVE NOW' : 'EVENT ENDED'}
        </h3>
        <h2 className="text-2xl md:text-3xl font-bold font-mono text-primary mb-6">
          {competitionName}
        </h2>

        {/* Status Badge */}
        {status === 'active' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/50 mb-4"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-accent"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-accent font-mono font-bold text-sm">EVENT IS LIVE</span>
            <Zap className="w-4 h-4 text-accent" />
          </motion.div>
        )}

        {/* Countdown Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
              {status === 'before' ? 'STARTS IN' : status === 'active' ? 'TIME REMAINING' : 'COMPETITION ENDED'}
            </span>
          </div>
          <motion.div
            key={countdown}
            initial={{ scale: 1.05, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-4xl md:text-5xl font-mono font-bold tracking-wider ${
              status === 'active' ? 'text-accent' : status === 'ended' ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {countdown}
          </motion.div>
        </div>

        {/* CTA Button */}
        {status !== 'ended' ? (
          <Button asChild size="lg" className="font-mono">
            <Link to="/auth">
              <Terminal className="w-5 h-5 mr-2" />
              {status === 'before' ? 'SIGN IN TO REGISTER' : 'SIGN IN TO PARTICIPATE'}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="lg" className="font-mono">
            <Link to="/leaderboard">
              VIEW FINAL RESULTS
            </Link>
          </Button>
        )}
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(var(--foreground))_2px,hsl(var(--foreground))_4px)]" />
      </div>
    </motion.div>
  );
}
