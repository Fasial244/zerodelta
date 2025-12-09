import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useCompetitions } from '@/hooks/useCompetitions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface ScoreSnapshot {
  user_id: string;
  points: number;
  snapshot_at: string;
}

interface ChartDataPoint {
  time: string;
  [key: string]: string | number;
}

// Colors for top players
const PLAYER_COLORS = [
  'hsl(38, 92%, 50%)',   // Gold/Primary
  'hsl(0, 0%, 63%)',     // Silver
  'hsl(30, 80%, 50%)',   // Bronze
  'hsl(200, 80%, 50%)',  // Blue
  'hsl(280, 80%, 50%)',  // Purple
  'hsl(160, 80%, 50%)',  // Teal
  'hsl(340, 80%, 50%)',  // Pink
  'hsl(60, 80%, 50%)',   // Yellow
];

export function ScoreGraph() {
  const { activeCompetition } = useCompetitions();
  const { individual } = useLeaderboard();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get top 5 players for the graph
  const topPlayers = individual.slice(0, 5);

  useEffect(() => {
    const fetchSnapshots = async () => {
      if (!activeCompetition?.id || topPlayers.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: snapshots, error } = await supabase
        .from('score_snapshots')
        .select('user_id, points, snapshot_at')
        .eq('competition_id', activeCompetition.id)
        .in('user_id', topPlayers.map(p => p.id))
        .order('snapshot_at', { ascending: true });

      if (error) {
        console.error('Error fetching snapshots:', error);
        setIsLoading(false);
        return;
      }

      // If no snapshots exist, create initial data points from current scores
      if (!snapshots || snapshots.length === 0) {
        // Create a simple chart with just the current state
        const now = new Date().toISOString();
        const dataPoint: ChartDataPoint = {
          time: formatTime(now),
        };
        
        topPlayers.forEach(player => {
          dataPoint[player.username] = player.total_points;
        });

        setChartData([dataPoint]);
        setIsLoading(false);
        return;
      }

      // Group snapshots by time intervals (every 5 minutes)
      const timeGroups = new Map<string, Map<string, number>>();
      
      snapshots.forEach((snap: ScoreSnapshot) => {
        const timeKey = roundToInterval(snap.snapshot_at, 5);
        if (!timeGroups.has(timeKey)) {
          timeGroups.set(timeKey, new Map());
        }
        const group = timeGroups.get(timeKey)!;
        // Keep the latest snapshot for each user in the interval
        group.set(snap.user_id, snap.points);
      });

      // Convert to chart data format
      const userIdToName = new Map(topPlayers.map(p => [p.id, p.username]));
      const data: ChartDataPoint[] = [];
      
      // Sort time keys chronologically
      const sortedTimes = Array.from(timeGroups.keys()).sort();
      
      // Track cumulative scores
      const cumulativeScores = new Map<string, number>();
      
      sortedTimes.forEach(timeKey => {
        const group = timeGroups.get(timeKey)!;
        const dataPoint: ChartDataPoint = {
          time: formatTime(timeKey),
        };
        
        // Update cumulative scores with new data
        group.forEach((points, userId) => {
          cumulativeScores.set(userId, points);
        });
        
        // Add all tracked players to this data point
        topPlayers.forEach(player => {
          const score = cumulativeScores.get(player.id) || 0;
          dataPoint[player.username] = score;
        });
        
        data.push(dataPoint);
      });

      // Add current state as final point
      const now = new Date().toISOString();
      const finalPoint: ChartDataPoint = {
        time: formatTime(now),
      };
      topPlayers.forEach(player => {
        finalPoint[player.username] = player.total_points;
      });
      data.push(finalPoint);

      setChartData(data);
      setIsLoading(false);
    };

    fetchSnapshots();
  }, [activeCompetition?.id, individual]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!activeCompetition?.id) return;

    const channel = supabase
      .channel('score-graph-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'score_snapshots' },
        () => {
          // Refetch when new snapshots are added
          // The useEffect above will handle it when individual changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCompetition?.id]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <motion.div
          className="text-muted-foreground font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          LOADING SCORE HISTORY...
        </motion.div>
      </div>
    );
  }

  if (topPlayers.length === 0 || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
        <span className="font-mono text-sm">NO SCORE DATA YET</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-mono text-sm text-primary tracking-wider">SCORE PROGRESSION</h3>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend 
              wrapperStyle={{ 
                fontFamily: 'monospace', 
                fontSize: '11px',
                paddingTop: '10px',
              }} 
            />
            {topPlayers.map((player, index) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={player.username}
                stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                strokeWidth={index === 0 ? 3 : 2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// Helper functions
function roundToInterval(dateStr: string, minutes: number): string {
  const date = new Date(dateStr);
  const ms = minutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms).toISOString();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}