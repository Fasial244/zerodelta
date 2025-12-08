import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitions, Competition } from '@/hooks/useCompetitions';
import { useAuth } from '@/hooks/useAuth';

interface CompetitionWaitingRoomProps {
  competition: Competition;
  onAccessGranted: () => void;
}

export function CompetitionWaitingRoom({ competition, onAccessGranted }: CompetitionWaitingRoomProps) {
  const { user } = useAuth();
  const { userRegistration, register, isLoading } = useCompetitions();
  const [countdown, setCountdown] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // Calculate countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(competition.start_time).getTime();
      const diff = start - now;

      if (diff <= 0) {
        setHasStarted(true);
        setCountdown('COMPETITION STARTED');
        // Check if user has access
        if (userRegistration?.status === 'approved' || !competition.require_approval) {
          onAccessGranted();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}D ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [competition, userRegistration, onAccessGranted]);

  const handleRegister = () => {
    register(competition.id);
  };

  const renderStatus = () => {
    if (!competition.require_approval) {
      return (
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle className="w-5 h-5" />
          <span>Open Registration - You have access</span>
        </div>
      );
    }

    if (!userRegistration) {
      return (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This competition requires admin approval. Register now to request access.
          </p>
          <Button onClick={handleRegister} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Register for Competition
              </>
            )}
          </Button>
        </div>
      );
    }

    switch (userRegistration.status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-warning">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Registration pending approval...</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 text-accent">
            <CheckCircle className="w-5 h-5" />
            <span>You are approved! Waiting for competition to start.</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            <span>Your registration was not approved.</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              hsl(var(--primary) / 0.03) 2px,
              hsl(var(--primary) / 0.03) 4px
            )`,
          }}
          animate={{ y: [0, 4] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full mx-4 text-center"
      >
        {/* Competition name */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold font-mono text-primary mb-8"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {competition.name}
        </motion.h1>

        {/* Countdown */}
        <div className="mb-8 p-8 rounded-lg border border-primary/50 bg-card/80 backdrop-blur">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-primary" />
            <span className="text-lg text-muted-foreground font-mono">
              {hasStarted ? 'COMPETITION STARTED' : 'STARTS IN'}
            </span>
          </div>

          <motion.div
            className="text-5xl md:text-6xl font-bold font-mono text-primary tracking-wider"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {countdown}
          </motion.div>
        </div>

        {/* Registration status */}
        <div className="p-6 rounded-lg border border-border bg-card/80 backdrop-blur">
          {renderStatus()}
        </div>

        {/* Competition description */}
        <p className="mt-8 text-sm text-muted-foreground max-w-md mx-auto">
          {competition.description}
        </p>

        {/* Footer */}
        <div className="mt-12 text-xs text-muted-foreground/50 font-mono">
          CASE #2025 // LEAD INVESTIGATOR: 0xfsl (Faisal AL-Jaber)
        </div>
      </motion.div>
    </div>
  );
}
