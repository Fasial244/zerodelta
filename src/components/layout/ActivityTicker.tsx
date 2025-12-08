import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Droplets, Trophy, Megaphone, Users } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface ActivityEvent {
  id: string;
  event_type: string;
  message: string;
  points: number | null;
  created_at: string;
}

export function ActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch initial events
    fetchRecentEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activity-ticker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          const newEvent = payload.new as ActivityEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 19)]);

          // Trigger global toast for important events
          if (newEvent.event_type === 'announcement') {
            toast.warning(DOMPurify.sanitize(newEvent.message), {
              duration: 10000,
              icon: '📢',
              className: 'border-warning bg-background',
              description: 'SYSTEM ANNOUNCEMENT',
            });
          }

          if (newEvent.event_type === 'first_blood') {
            toast.error(DOMPurify.sanitize(newEvent.message), {
              duration: 8000,
              icon: '🩸',
              className: 'border-destructive bg-background',
              description: 'FIRST BLOOD',
            });
          }

          if (newEvent.event_type === 'solve') {
            toast.success(DOMPurify.sanitize(newEvent.message), {
              duration: 5000,
              icon: '🏆',
              className: 'border-accent bg-background',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  async function fetchRecentEvents() {
    const { data } = await supabase
      .from('activity_log')
      .select('id, event_type, message, points, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setEvents(data);
    }
  }

  if (events.length === 0) {
    return (
      <div className="h-8 bg-muted/80 backdrop-blur-sm border-b border-border flex items-center justify-center">
        <span className="text-muted-foreground font-mono text-sm">
          Awaiting activity...
        </span>
      </div>
    );
  }

  const currentEvent = events[currentIndex];
  const Icon = getEventIcon(currentEvent?.event_type);

  return (
    <div className="h-8 bg-muted/80 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEvent?.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 font-mono text-sm"
          >
            <Icon className={`h-4 w-4 ${getEventColor(currentEvent?.event_type)}`} />
            <span className="text-muted-foreground">[{formatTime(currentEvent?.created_at)}]</span>
            <span className={getEventColor(currentEvent?.event_type)}>
              {DOMPurify.sanitize(currentEvent?.message || '')}
            </span>
            {currentEvent?.points && (
              <span className="text-accent font-bold">+{currentEvent.points} PTS</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
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

function getEventColor(eventType: string): string {
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
    default:
      return 'text-foreground';
  }
}

function formatTime(timestamp: string): string {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}
