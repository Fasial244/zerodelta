import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ChallengeGraph } from '@/components/challenges/ChallengeGraph';
import { ChallengeModal } from '@/components/challenges/ChallengeModal';
import { TeamPanel } from '@/components/team/TeamPanel';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges, Challenge } from '@/hooks/useChallenges';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Terminal, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Challenges() {
  const { user } = useAuth();
  const { isLoading } = useChallenges();
  const { gameState } = useSystemSettings();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

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

            {isLoading ? (
              <div className="border border-border rounded-lg bg-card/50 p-8 min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground font-mono">
                  LOADING CHALLENGES...
                </div>
              </div>
            ) : (
              <ChallengeGraph onSelectChallenge={setSelectedChallenge} />
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

        {/* Challenge Modal */}
        {selectedChallenge && gameState === 'active' && (
          <ChallengeModal
            challenge={selectedChallenge}
            onClose={() => setSelectedChallenge(null)}
          />
        )}
      </div>
    </Layout>
  );
}
