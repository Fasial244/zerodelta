import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSound } from './SoundManager';
import { supabase } from '@/integrations/supabase/client';
import { Droplets } from 'lucide-react';
import DOMPurify from 'dompurify';

interface CelebrationEvent {
  type: 'first_blood' | 'rank_up' | 'win';
  message: string;
  subtext?: string;
}

export function CelebrationOverlay() {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const { play } = useSound();

  useEffect(() => {
    const channel = supabase
      .channel('celebration-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          const log = payload.new as { event_type: string; message: string };

          if (log.event_type === 'first_blood') {
            play('firstblood');
            setEvent({
              type: 'first_blood',
              message: 'FIRST BLOOD!',
              subtext: DOMPurify.sanitize(log.message),
            });
            // Clear after 5 seconds
            setTimeout(() => setEvent(null), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [play]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 pointer-events-none"
        >
          {/* Blood drip icon */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <Droplets className="h-24 w-24 text-destructive" />
          </motion.div>

          {/* Glitch Effect Text */}
          <motion.h1
            className="text-6xl md:text-8xl font-black text-destructive font-mono mb-4 text-center glitch"
            style={{ textShadow: '0 0 50px hsl(var(--destructive))' }}
            animate={{ x: [-5, 5, -5, 0] }}
            transition={{ repeat: 3, duration: 0.1 }}
          >
            {event.message}
          </motion.h1>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-foreground font-mono bg-destructive/20 px-8 py-3 rounded border border-destructive"
          >
            {event.subtext}
          </motion.div>

          {/* Particle Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full bg-destructive"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
