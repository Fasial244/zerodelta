import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, ExternalLink, Crown, Code, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Author {
  id: string;
  name: string;
  role: string;
  social_link: string | null;
  image_url: string | null;
  display_order: number;
}

export default function Authors() {
  const { data: authors, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name, role, social_link, image_url, display_order')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Author[];
    },
  });

  const getRoleIcon = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('leader') || lowerRole.includes('lead')) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    }
    if (lowerRole.includes('dev')) {
      return <Code className="w-5 h-5 text-primary" />;
    }
    return <Shield className="w-5 h-5 text-muted-foreground" />;
  };

  const isLeader = (role: string) => {
    const lowerRole = role.toLowerCase();
    return lowerRole.includes('leader') || lowerRole.includes('lead');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-mono">
              <span className="text-glow-cyan">THE</span>{' '}
              <span className="text-glow-magenta">OPERATIVES</span>
            </h1>
          </div>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
            Meet the team behind ZeroDelta. The architects of chaos, the engineers of security.
          </p>
        </motion.div>

        {/* Authors Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : authors && authors.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {authors.map((author, index) => (
              <motion.div
                key={author.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`
                  relative p-6 rounded-lg border bg-card/50 
                  transition-all duration-300
                  ${isLeader(author.role) 
                    ? 'border-yellow-500/50 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                {/* Leader Badge */}
                {isLeader(author.role) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-xs font-mono text-yellow-500">
                      ★ LEAD ★
                    </span>
                  </div>
                )}

                {/* Avatar/Image */}
                <div className="flex justify-center mb-4">
                  {author.image_url ? (
                    <img
                      src={author.image_url}
                      alt={author.name}
                      className={`
                        w-24 h-24 rounded-lg object-cover border-2
                        ${isLeader(author.role) ? 'border-yellow-500' : 'border-primary/50'}
                      `}
                    />
                  ) : (
                    <div className={`
                      w-24 h-24 rounded-lg flex items-center justify-center
                      ${isLeader(author.role) 
                        ? 'bg-yellow-500/20 border-2 border-yellow-500' 
                        : 'bg-primary/20 border-2 border-primary/50'
                      }
                    `}>
                      {getRoleIcon(author.role)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="text-center">
                  <h3 className={`
                    text-xl font-bold font-mono mb-1
                    ${isLeader(author.role) ? 'text-yellow-500' : 'text-foreground'}
                  `}>
                    {author.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono mb-4 flex items-center justify-center gap-2">
                    {getRoleIcon(author.role)}
                    {author.role}
                  </p>

                  {author.social_link && (
                    <a
                      href={author.social_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-mono"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Profile
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-mono">No operatives found.</p>
          </div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 pt-8 border-t border-border/30"
        >
          <p className="text-sm text-muted-foreground/70 font-mono tracking-wider">
            ZERODELTA // BUILT WITH 💀 AND ☕
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
