import { Layout } from '@/components/layout/Layout';
import { LeaderboardTabs } from '@/components/leaderboard/LeaderboardTabs';
import { ScoreGraph } from '@/components/leaderboard/ScoreGraph';
import { Trophy, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-glow-cyan mb-8 font-mono flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            LEADERBOARD
          </h1>

          {/* Score Progression Graph */}
          <div className="mb-8">
            <h2 className="text-lg font-mono text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              SCORE PROGRESSION
            </h2>
            <ScoreGraph />
          </div>

          {/* Rankings */}
          <LeaderboardTabs />
        </div>
      </div>
    </Layout>
  );
}
