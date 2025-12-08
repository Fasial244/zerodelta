import { formatDistanceToNow } from 'date-fns';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import DOMPurify from 'dompurify';

const eventColors: Record<string, string> = {
  solve: 'bg-primary/20 text-primary',
  first_blood: 'bg-destructive/20 text-destructive',
  announcement: 'bg-warning/20 text-warning',
  team_join: 'bg-secondary/20 text-secondary-foreground',
  team_leave: 'bg-muted/50 text-muted-foreground',
  user_banned: 'bg-destructive/20 text-destructive',
};

export function AdminActivity() {
  const { activityLog } = useAdmin();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground font-mono">ACTIVITY LOG</h2>

      <ScrollArea className="h-[600px] rounded-lg border border-border">
        <div className="p-4 space-y-2">
          {activityLog.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 font-mono">
              No activity yet
            </p>
          ) : (
            activityLog.map((entry: any) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-card border border-border"
              >
                <Badge className={eventColors[entry.event_type] || 'bg-muted'}>
                  {entry.event_type.replace('_', ' ').toUpperCase()}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">
                    {DOMPurify.sanitize(entry.message)}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {entry.profiles?.username && (
                      <span>User: {DOMPurify.sanitize(entry.profiles.username)}</span>
                    )}
                    {entry.challenges?.title && (
                      <span>Challenge: {DOMPurify.sanitize(entry.challenges.title)}</span>
                    )}
                    {entry.points && (
                      <span>{entry.points} pts</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
