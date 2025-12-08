import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Droplets, Trophy, Megaphone, Users, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';

interface ActivityEvent {
  id: string;
  event_type: string;
  message: string;
  points: number | null;
  created_at: string;
  user_id: string | null;
  team_id: string | null;
  challenge_id: string | null;
}

type EventFilter = 'all' | 'solve' | 'first_blood' | 'announcement' | 'team';

export default function Activity() {
  const { user, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activity-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          const newEvent = payload.new as ActivityEvent;
          setEvents(prev => [newEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchEvents(offset = 0) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, event_type, message, points, created_at, user_id, team_id, challenge_id')
      .order('created_at', { ascending: false })
      .range(offset, offset + 49);

    if (error) {
      console.error('Error fetching activity:', error);
    } else if (data) {
      if (offset === 0) {
        setEvents(data);
      } else {
        setEvents(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 50);
    }
    setIsLoading(false);
  }

  const loadMore = () => {
    fetchEvents(events.length);
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'team') return ['team_join', 'team_leave'].includes(event.event_type);
    return event.event_type === filter;
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-primary font-mono animate-pulse">LOADING...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono text-glow-cyan mb-2">
            ACTIVITY LOG
          </h1>
          <p className="text-muted-foreground">
            Real-time competition events and announcements
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            All
          </Button>
          <Button
            variant={filter === 'solve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('solve')}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Solves
          </Button>
          <Button
            variant={filter === 'first_blood' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('first_blood')}
            className="gap-2 text-destructive border-destructive"
          >
            <Droplets className="h-4 w-4" />
            First Blood
          </Button>
          <Button
            variant={filter === 'announcement' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('announcement')}
            className="gap-2 text-warning border-warning"
          >
            <Megaphone className="h-4 w-4" />
            Announcements
          </Button>
          <Button
            variant={filter === 'team' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('team')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Teams
          </Button>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
              >
                <ActivityCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && filteredEvents.length === 0 && (
            <Card className="p-8 text-center border-border bg-card">
              <p className="text-muted-foreground font-mono">No activity found</p>
            </Card>
          )}

          {hasMore && !isLoading && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMore}
            >
              Load More
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}

function ActivityCard({ event }: { event: ActivityEvent }) {
  const Icon = getEventIcon(event.event_type);
  const colorClass = getEventColorClass(event.event_type);
  const bgClass = getEventBgClass(event.event_type);

  return (
    <Card className={`p-4 border-border bg-card hover:border-primary/50 transition-colors ${bgClass}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded ${bgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`${colorClass} border-current`}>
              {formatEventType(event.event_type)}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {formatTimestamp(event.created_at)}
            </span>
          </div>

          <p className={`font-mono text-sm ${colorClass}`}>
            {DOMPurify.sanitize(event.message)}
          </p>

          {event.points && (
            <span className="inline-block mt-2 text-accent font-bold font-mono text-sm">
              +{event.points} PTS
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'first_blood':
      return Droplets;
    case 'solve':
      return Trophy;
    case 'announcement':
      return Megaphone;
    case 'team_join':
    case 'team_leave':
      return Users;
    default:
      return Trophy;
  }
}

function getEventColorClass(eventType: string): string {
  switch (eventType) {
    case 'first_blood':
      return 'text-destructive';
    case 'solve':
      return 'text-accent';
    case 'announcement':
      return 'text-warning';
    case 'team_join':
    case 'team_leave':
      return 'text-primary';
    case 'user_banned':
      return 'text-destructive';
    default:
      return 'text-foreground';
  }
}

function getEventBgClass(eventType: string): string {
  switch (eventType) {
    case 'first_blood':
      return 'bg-destructive/5';
    case 'solve':
      return 'bg-accent/5';
    case 'announcement':
      return 'bg-warning/5';
    default:
      return '';
  }
}

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').toUpperCase();
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
