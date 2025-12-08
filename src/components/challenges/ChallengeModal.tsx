import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, ExternalLink, Copy, Download, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useChallenges, Challenge } from '@/hooks/useChallenges';
import { useRateLimit } from '@/hooks/useRateLimit';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';

// Flag validation - max 256 chars, basic sanitization
const MAX_FLAG_LENGTH = 256;
const FLAG_PATTERN = /^[a-zA-Z0-9_{}\-!@#$%^&*()+=\[\]:;"'<>,.?/\\|`~\s]+$/;

interface ChallengeModalProps {
  challenge: Challenge;
  onClose: () => void;
}

export function ChallengeModal({ challenge, onClose }: ChallengeModalProps) {
  const [flagInput, setFlagInput] = useState('');
  const [flagError, setFlagError] = useState<string | null>(null);
  const { submitFlag, isSubmitting, isChallengeSolved } = useChallenges();
  const { canSubmit, countdown, recordSubmission, isLocked } = useRateLimit();
  const { toast } = useToast();
  const isSolved = isChallengeSolved(challenge.id);

  const connectionInfo = challenge.connection_info as Record<string, unknown> | null;

  const validateFlag = (flag: string): boolean => {
    if (!flag.trim()) {
      setFlagError('Flag cannot be empty');
      return false;
    }
    if (flag.length > MAX_FLAG_LENGTH) {
      setFlagError(`Flag must be less than ${MAX_FLAG_LENGTH} characters`);
      return false;
    }
    if (!FLAG_PATTERN.test(flag)) {
      setFlagError('Flag contains invalid characters');
      return false;
    }
    setFlagError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFlag = flagInput.trim();
    
    if (!validateFlag(trimmedFlag) || !canSubmit() || isSolved) return;

    recordSubmission(false);
    submitFlag({ challengeId: challenge.id, flagInput: trimmedFlag });
    setFlagInput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-lg border border-primary/50 bg-card shadow-2xl"
          style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.2)' }}
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-border">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm text-primary">
                root@zerodelta:~/challenges/{challenge.title.toLowerCase().replace(/\s+/g, '_')}
              </span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            {/* Category & Points */}
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 rounded bg-primary/20 text-primary font-mono text-sm">
                {challenge.category}
              </span>
              <span className="text-muted-foreground font-mono">
                {challenge.points} points
              </span>
              {challenge.solve_count > 0 && (
                <span className="text-muted-foreground text-sm">
                  {challenge.solve_count} solve{challenge.solve_count !== 1 ? 's' : ''}
                </span>
              )}
              {challenge.first_blood_user_id && (
                <span className="text-sm">🩸 First blood claimed!</span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {challenge.title}
              {isSolved && <span className="ml-2 text-primary">✓ Solved</span>}
            </h2>

            {/* Description */}
            <div className="prose prose-invert prose-sm max-w-none mb-6">
              <ReactMarkdown>
                {DOMPurify.sanitize(challenge.description)}
              </ReactMarkdown>
            </div>

            {/* Connection info */}
            {connectionInfo && Object.keys(connectionInfo).length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-mono text-sm text-primary mb-3">CONNECTION INFO</h3>
                
                {connectionInfo.type === 'web' && connectionInfo.url && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(connectionInfo.url as string, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      LAUNCH TARGET
                    </Button>
                  </div>
                )}

                {connectionInfo.type === 'netcat' && (
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-background rounded font-mono text-sm flex-1">
                      nc {String(connectionInfo.host)} {String(connectionInfo.port)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`nc ${connectionInfo.host} ${connectionInfo.port}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {connectionInfo.type === 'download' && connectionInfo.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(connectionInfo.file_url as string, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    DOWNLOAD FILE
                  </Button>
                )}
              </div>
            )}

            {/* Flag submission */}
            {!isSolved && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={flagInput}
                    onChange={(e) => {
                      setFlagInput(e.target.value);
                      setFlagError(null);
                    }}
                    placeholder="DELTA{...}"
                    className={`font-mono bg-input border-border ${flagError ? 'border-destructive' : ''}`}
                    disabled={!canSubmit() || isSubmitting || isLocked}
                    maxLength={MAX_FLAG_LENGTH}
                  />
                  <Button
                    type="submit"
                    disabled={!canSubmit() || isSubmitting || !flagInput.trim() || isLocked}
                    className="bg-primary text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {flagError && (
                  <p className="text-sm text-destructive font-mono">{flagError}</p>
                )}
                {!canSubmit() && countdown > 0 && (
                  <p className="text-sm text-destructive font-mono">
                    {isLocked ? `Locked for ${countdown}s` : `Wait ${countdown}s`}
                  </p>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
