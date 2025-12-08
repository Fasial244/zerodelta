import { motion } from 'framer-motion';
import { Shield, Lock, Clock } from 'lucide-react';

export function MaintenanceLockScreen() {
  return (
    <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines opacity-50" />
      
      {/* Animated glow effects */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-secondary/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '60%', left: '30%' }}
      />

      {/* Content */}
      <motion.div 
        className="relative z-10 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated lock icon */}
        <motion.div
          className="mb-8 flex justify-center"
          animate={{ 
            rotateY: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <Shield className="w-24 h-24 text-primary relative z-10" />
            <Lock className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </motion.div>

        {/* Title with glitch effect */}
        <motion.h1 
          className="text-4xl md:text-6xl font-bold font-mono text-glow-cyan mb-4"
          animate={{
            textShadow: [
              '0 0 10px hsl(var(--neon-cyan) / 0.8)',
              '0 0 20px hsl(var(--neon-cyan) / 1)',
              '0 0 10px hsl(var(--neon-cyan) / 0.8)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          SYSTEM OFFLINE
        </motion.h1>

        <motion.p 
          className="text-xl text-muted-foreground font-mono mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {"// MAINTENANCE MODE ACTIVE"}
        </motion.p>

        {/* Status indicator */}
        <motion.div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-lg border border-primary/50 bg-primary/10"
          animate={{
            borderColor: ['hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 1)', 'hsl(var(--primary) / 0.5)'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-warning"
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
          <span className="font-mono text-foreground">Platform temporarily unavailable</span>
        </motion.div>

        {/* Additional info */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">Please check back later</span>
        </motion.div>

        {/* Terminal-style message */}
        <motion.div
          className="mt-12 max-w-md mx-auto text-left bg-card/50 border border-border rounded-lg p-4 font-mono text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-muted-foreground">
            <span className="text-accent">$</span> status --check
          </div>
          <motion.div
            className="mt-2 text-primary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {">"} Awaiting system restoration...
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}