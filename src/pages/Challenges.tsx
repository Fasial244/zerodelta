import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';

export default function Challenges() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        <h1 className="text-4xl font-bold text-glow-cyan mb-8 font-mono">
          CHALLENGE MAP
        </h1>
        <div className="border border-border rounded-lg bg-card/50 p-8 min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground font-mono">
            Challenge dependency graph loading...
          </p>
        </div>
      </div>
    </Layout>
  );
}
