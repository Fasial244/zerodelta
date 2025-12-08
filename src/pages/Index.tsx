import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Link } from 'react-router-dom';
import { Shield, Target, Trophy, Users, Zap, Terminal } from 'lucide-react';

export default function Index() {
  const { user } = useAuth();
  const { settings, gameState, countdown } = useSystemSettings();

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
            <span className="text-glow-cyan">{settings.event_title || 'ZERO'}</span>
            <span className="text-glow-magenta">DELTA</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-mono">
            Capture The Flag • Hack The Planet • Prove Your Skills
          </p>

          {/* Game Status */}
          <div className="inline-block px-6 py-3 rounded-lg bg-card border border-primary/50 mb-8">
            {gameState === 'before_start' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">CTF BEGINS IN</p>
                <p className="text-3xl font-mono text-primary animate-pulse">
                  {countdown}
                </p>
              </div>
            )}
            {gameState === 'active' && (
              <div className="text-center">
                <p className="text-sm text-primary mb-1">⚡ GAME ACTIVE</p>
                <p className="text-3xl font-mono text-foreground">
                  {countdown}
                </p>
              </div>
            )}
            {gameState === 'ended' && (
              <div className="text-center">
                <p className="text-xl font-mono text-muted-foreground">
                  CTF HAS ENDED
                </p>
              </div>
            )}
            {gameState === 'paused' && (
              <div className="text-center">
                <p className="text-xl font-mono text-warning animate-pulse">
                  ⏸ GAME PAUSED
                </p>
              </div>
            )}
          </div>

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
