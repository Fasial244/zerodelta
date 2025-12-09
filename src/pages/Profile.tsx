import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTeam } from '@/hooks/useTeam';
import { useCompetitions } from '@/hooks/useCompetitions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Droplets,
  Target,
  Medal,
  Lock,
  Users,
  Copy,
  Check,
  Loader2,
  Calendar,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';

export default function Profile() {
  const { user, profile, isLoading: authLoading, updateProfile } = useAuth();
  const { stats, solveHistory, isLoading: profileLoading } = useProfile();
  const { team, isLoading: teamLoading, isLocked } = useTeam();
  const { activeCompetition, userRegistration } = useCompetitions();
  const { individual } = useLeaderboard();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Calculate competition-specific rank
  const competitionRank = individual.findIndex(p => p.id === user?.id) + 1;
  const competitionStats = individual.find(p => p.id === user?.id);

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

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ username: newUsername.trim() });
      toast({ title: 'Username updated!' });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryClass = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === 'web') return 'category-web';
    if (lower === 'pwn') return 'category-pwn';
    if (lower === 'forensics') return 'category-forensics';
    if (lower === 'crypto') return 'category-crypto';
    return 'category-other';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-mono text-glow-cyan mb-2">
            OPERATOR PROFILE
          </h1>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 border-2 border-primary mb-4">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-mono">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {isEditing ? (
                    <div className="w-full space-y-2">
                      <Input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="New username"
                        className="text-center"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveUsername}
                          disabled={isSaving}
                          className="flex-1"
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <h2 className="text-xl font-bold font-mono text-foreground mb-1">
                        {DOMPurify.sanitize(profile?.username || 'Anonymous')}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewUsername(profile?.username || '');
                          setIsEditing(true);
                        }}
                      >
                        Edit Username
                      </Button>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={isLocked ? 'destructive' : 'outline'} className="gap-1">
                        {isLocked ? <Lock className="h-3 w-3" /> : null}
                        {isLocked ? 'Locked' : 'Active'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="font-mono text-foreground">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString()
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Card */}
            {team && (
              <Card className="mt-4 border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    TEAM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-bold text-lg mb-2">{DOMPurify.sanitize(team.name)}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-mono text-accent font-bold">{team.score} PTS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Join Code</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyJoinCode}
                        className="gap-1 font-mono"
                      >
                        {team.join_code}
                        {copied ? (
                          <Check className="h-3 w-3 text-accent" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-muted-foreground">Members ({team.profiles?.length || 0})</div>
                    <div className="flex flex-wrap gap-1">
                      {team.profiles?.map((member: any) => (
                        <Badge key={member.id} variant="outline" className="text-xs">
                          {DOMPurify.sanitize(member.username || 'Anonymous')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Stats & History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            {/* Competition Stats Section */}
            {activeCompetition && (
              <Card className="border-primary/30 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {activeCompetition.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {userRegistration?.status === 'approved' ? (
                      <Badge variant="outline" className="text-accent border-accent">REGISTERED</Badge>
                    ) : userRegistration?.status === 'pending' ? (
                      <Badge variant="outline" className="text-warning border-warning">PENDING APPROVAL</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">NOT REGISTERED</Badge>
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  {userRegistration?.status === 'approved' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={Medal}
                        label="Event Rank"
                        value={competitionRank > 0 ? `#${competitionRank}` : '--'}
                        color="text-warning"
                      />
                      <StatCard
                        icon={Trophy}
                        label="Event Points"
                        value={competitionStats?.total_points || 0}
                        color="text-accent"
                      />
                      <StatCard
                        icon={Target}
                        label="Event Solves"
                        value={competitionStats?.solve_count || 0}
                        color="text-primary"
                      />
                      <StatCard
                        icon={Droplets}
                        label="First Bloods"
                        value={competitionStats?.first_bloods || 0}
                        color="text-destructive"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground font-mono text-sm">
                      {userRegistration ? 'Waiting for admin approval...' : 'Register to participate in this event'}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Overall Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Trophy}
                label="Total Points"
                value={stats?.total_points || 0}
                color="text-accent"
              />
              <StatCard
                icon={Target}
                label="Solves"
                value={stats?.solve_count || 0}
                color="text-primary"
              />
              <StatCard
                icon={Droplets}
                label="First Bloods"
                value={stats?.first_bloods || 0}
                color="text-destructive"
              />
              <StatCard
                icon={Award}
                label="Overall Rank"
                value={stats?.rank ? `#${stats.rank}` : '--'}
                color="text-warning"
              />
            </div>

            {/* Solve History */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-mono flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  SOLVE HISTORY
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : solveHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-mono">
                    No challenges solved yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {solveHistory.map((solve, index) => (
                      <motion.div
                        key={solve.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded border border-border bg-muted/20 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={`${getCategoryClass(solve.challenge_category)} border`}>
                            {solve.challenge_category}
                          </Badge>
                          <div>
                            <span className="font-mono text-sm">
                              {DOMPurify.sanitize(solve.challenge_title)}
                            </span>
                            {solve.is_first_blood && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                🩸 FIRST BLOOD
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-accent font-bold">
                            +{solve.points_awarded} PTS
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(solve.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-muted-foreground uppercase">{label}</span>
        </div>
        <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
