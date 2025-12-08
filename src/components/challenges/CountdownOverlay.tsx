import { motion } from 'framer-motion';
import { Clock, Shield } from 'lucide-react';

interface CountdownOverlayProps {
  countdown: string;
}

export function CountdownOverlay({ countdown }: CountdownOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-md rounded-lg"
    >
      <div className="text-center space-y-6 p-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block"
        >
          <Shield className="w-20 h-20 text-primary mx-auto" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-foreground font-mono">
          CTF BEGINS IN
        </h2>
        
        <motion.div
          key={countdown}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <Clock className="w-8 h-8 text-primary" />
          <span className="text-5xl font-mono font-bold text-primary text-glow-cyan">
            {countdown}
          </span>
        </motion.div>
        
        <p className="text-muted-foreground font-mono text-sm">
          Challenges will be revealed when the timer reaches zero
        </p>
        
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-32 h-1 bg-primary/50 rounded-full mx-auto"
        />
      </div>
    </motion.div>
  );
}
