import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useCompetitions } from '@/hooks/useCompetitions';
import { Link } from 'react-router-dom';
import { Shield, Target, Trophy, Users, Zap, Terminal, Calendar, AlertTriangle } from 'lucide-react';
import { PublicEventCountdown } from '@/components/events/PublicEventCountdown';

export default function Index() {
  const { user } = useAuth();
  const { settings, gameState, countdown } = useSystemSettings();
  const { activeCompetition, userRegistration } = useCompetitions();

  // Determine status display based on game state
  const getStatusDisplay = () => {
    if (gameState === 'paused') {
      return {
        label: 'STATUS: SYSTEM HALTED',
        color: 'text-destructive',
        bgColor: 'border-destructive/50',
        icon: '⛔',
      };
    }
    if (gameState === 'before_start') {
      return {
        label: 'STATUS: PREPARING TO LAUNCH',
        color: 'text-warning',
        bgColor: 'border-warning/50',
        icon: '⏳',
      };
    }
    if (gameState === 'active') {
      return {
        label: 'STATUS: SYSTEM ACTIVE',
        color: 'text-accent',
        bgColor: 'border-accent/50',
        icon: '⚡',
      };
    }
    // ended
    return {
      label: 'STATUS: MISSION COMPLETE',
      color: 'text-muted-foreground',
      bgColor: 'border-border',
      icon: '✓',
    };
  };

  const status = getStatusDisplay();

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Shield className="w-24 h-24 mx-auto text-primary animate-pulse-glow" />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4 font-mono">
            <span className="text-glow-cyan">{settings?.event_title || 'ZERO'}</span>
            <span className="text-glow-magenta">DELTA</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-mono">
            Capture The Flag • Hack The Planet • Prove Your Skills
          </p>

          {/* Public Event Countdown for non-authenticated users */}
          {activeCompetition && !user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-lg mx-auto mb-8"
            >
              <PublicEventCountdown
                competitionName={activeCompetition.name}
                startTime={activeCompetition.start_time}
                endTime={activeCompetition.end_time}
              />
            </motion.div>
          )}

          {/* Game Status for authenticated users */}
          {user && (
            <div className={`inline-block px-6 py-3 rounded-lg bg-card border ${status.bgColor} mb-8`}>
              <p className={`text-sm font-mono mb-1 ${status.color}`}>
                {status.icon} {status.label}
              </p>
              {(gameState === 'before_start' || gameState === 'active') && (
                <p className="text-3xl font-mono text-foreground">
                  {countdown}
                </p>
              )}
              {gameState === 'ended' && (
                <Button asChild size="sm" variant="outline" className="font-mono mt-2">
                  <Link to="/leaderboard">
                    <Trophy className="w-4 h-4 mr-2" />
                    View Final Scoreboard
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Event Alert for logged in but not registered users */}
          {activeCompetition && user && !userRegistration && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="font-mono font-bold text-primary">{activeCompetition.name}</p>
                    <p className="text-sm text-muted-foreground">
                      You are not registered for this event yet
                    </p>
                  </div>
                </div>
                <Button asChild className="font-mono">
                  <Link to="/challenges">
                    <Target className="w-4 h-4 mr-2" />
                    REGISTER NOW
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Pending approval alert */}
          {activeCompetition && userRegistration?.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-lg bg-warning/10 border border-warning/30"
            >
              <div className="flex items-center gap-3 justify-center">
                <Calendar className="w-5 h-5 text-warning" />
                <p className="font-mono text-warning">
                  Registration pending approval for {activeCompetition.name}
                </p>
              </div>
            </motion.div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <>
                <Button asChild size="lg" className="font-mono">
                  <Link to="/challenges">
                    <Target className="w-5 h-5 mr-2" />
                    ENTER THE MATRIX
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-mono">
                  <Link to="/leaderboard">
                    <Trophy className="w-5 h-5 mr-2" />
                    LEADERBOARD
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg" className="font-mono">
                <Link to="/auth">
                  <Terminal className="w-5 h-5 mr-2" />
                  ACCESS TERMINAL
                </Link>
              </Button>
            )}
          </div>

          {/* Credits Button */}
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm" className="font-mono text-muted-foreground hover:text-primary">
              <Link to="/authors">
                <Users className="w-4 h-4 mr-2" />
                CREDITS / OPERATIVES
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="CHALLENGES"
            description="Web, Pwn, Crypto, Forensics - unlock challenges by solving dependencies"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="DYNAMIC SCORING"
            description="Points decay as more hackers solve - first blood earns max points"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="TEAM MODE"
            description="Go solo or join forces with your crew to dominate the leaderboard"
          />
        </motion.div>

        {/* Terminal ASCII Art */}
        <motion.pre
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.6 }}
          className="hidden md:block text-center text-xs text-primary/50 mt-16 font-mono select-none"
        >
{`
    ███████╗███████╗██████╗  ██████╗ ██████╗ ███████╗██╗  ████████╗ █████╗ 
    ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔════╝██║  ╚══██╔══╝██╔══██╗
      ███╔╝ █████╗  ██████╔╝██║   ██║██║  ██║█████╗  ██║     ██║   ███████║
     ███╔╝  ██╔══╝  ██╔══██╗██║   ██║██║  ██║██╔══╝  ██║     ██║   ██╔══██║
    ███████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗███████╗██║   ██║  ██║
    ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝   ╚═╝  ╚═╝
`}
        </motion.pre>

        {/* Author Credit Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 pt-8 border-t border-border/30"
        >
          <p className="text-sm text-muted-foreground/70 font-mono tracking-wider">
            CASE #2025 // LEAD INVESTIGATOR: <span className="text-primary">0xfsl</span> (Faisal AL-Jaber)
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="p-6 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition-colors"
    >
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-bold text-foreground mb-2 font-mono">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
