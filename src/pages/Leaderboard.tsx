import { Layout } from '@/components/layout/Layout';

export default function Leaderboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        <h1 className="text-4xl font-bold text-glow-cyan mb-8 font-mono">
          LEADERBOARD
        </h1>
        <div className="border border-border rounded-lg bg-card/50 p-8">
          <p className="text-muted-foreground font-mono text-center">
            Leaderboard loading...
          </p>
        </div>
      </div>
    </Layout>
  );
}
