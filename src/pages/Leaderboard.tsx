import { Layout } from '@/components/layout/Layout';
import { LeaderboardTabs } from '@/components/leaderboard/LeaderboardTabs';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-glow-cyan mb-8 font-mono flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            LEADERBOARD
          </h1>

          <LeaderboardTabs />
        </div>
      </div>
    </Layout>
  );
}
