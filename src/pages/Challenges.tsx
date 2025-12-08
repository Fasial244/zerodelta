import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ChallengeGraph } from '@/components/challenges/ChallengeGraph';
import { ChallengeModal } from '@/components/challenges/ChallengeModal';
import { MobileChallengeList } from '@/components/challenges/MobileChallengeList';
import { CountdownOverlay } from '@/components/challenges/CountdownOverlay';
import { TeamPanel } from '@/components/team/TeamPanel';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges, Challenge } from '@/hooks/useChallenges';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Terminal, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Challenges() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { challenges, isLoading: challengesLoading, isChallengeUnlocked, isChallengeSolved } = useChallenges();
  const { gameState, countdown } = useSystemSettings();
  const isMobile = useIsMobile();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Admins can always interact with challenges
  const canViewGraph = gameState === 'active' || isAdmin;
  const showCountdownOverlay = gameState === 'before_start' && !isAdmin;

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary font-mono">AUTHENTICATING...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-8">
          <div className="text-center py-16">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4 font-mono">
              ACCESS DENIED
            </h2>
            <p className="text-muted-foreground mb-6">
              You must be logged in to view challenges
            </p>
            <Button asChild>
              <Link to="/auth">
                <Terminal className="w-4 h-4 mr-2" />
                LOGIN
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'paused') {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-8">
          <div className="text-center py-16">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              ⏸
            </motion.div>
            <h2 className="text-3xl font-bold text-warning mb-4 font-mono">
              GAME PAUSED
            </h2>
            <p className="text-muted-foreground">
              The CTF has been temporarily paused. Please stand by.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Graph Area */}
          <div className="lg:col-span-3">
            <h1 className="text-3xl font-bold text-glow-cyan mb-6 font-mono flex items-center gap-3">
              <Terminal className="w-8 h-8" />
              CHALLENGE MAP
            </h1>

            {challengesLoading ? (
              <div className="border border-border rounded-lg bg-card/50 p-8 min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground font-mono">
                  LOADING CHALLENGES...
                </div>
              </div>
            ) : (
              <div className="relative min-h-[60vh]">
                {/* Mobile: Card List View */}
                {isMobile ? (
                  <MobileChallengeList
                    challenges={challenges}
                    onSelectChallenge={setSelectedChallenge}
                    isChallengeUnlocked={isChallengeUnlocked}
                    isChallengeSolved={isChallengeSolved}
                  />
                ) : (
                  /* Desktop: Graph View */
                  <div className={showCountdownOverlay ? 'blur-sm pointer-events-none' : ''}>
                    <ChallengeGraph onSelectChallenge={setSelectedChallenge} />
                  </div>
                )}

                {/* Countdown Overlay for Pre-Game */}
                {showCountdownOverlay && <CountdownOverlay countdown={countdown} />}
              </div>
            )}

            {gameState === 'before_start' && (
              <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/50 text-center">
                <p className="text-warning font-mono">
                  ⚠ CTF has not started yet. Challenges are in preview mode.
                </p>
              </div>
            )}

            {gameState === 'ended' && (
              <div className="mt-4 p-4 rounded-lg bg-muted border border-border text-center">
                <p className="text-muted-foreground font-mono">
                  CTF has ended. Submissions are closed.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TeamPanel />
          </div>
        </div>

        {/* Challenge Modal - show for active game OR for admins OR for ended game (view only) */}
        {selectedChallenge && (gameState === 'active' || isAdmin || gameState === 'ended') && (
          <ChallengeModal
            challenge={selectedChallenge}
            onClose={() => setSelectedChallenge(null)}
            isGameEnded={gameState === 'ended' && !isAdmin}
          />
        )}
      </div>
    </Layout>
  );
}
