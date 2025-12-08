import { Layout } from '@/components/layout/Layout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { AdminChallenges } from '@/components/admin/AdminChallenges';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminActivity } from '@/components/admin/AdminActivity';
import { AdminCompetitions } from '@/components/admin/AdminCompetitions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, Activity, Target, Tv, Trophy } from 'lucide-react';

export default function Admin() {
  return (
    <ProtectedAdminRoute>
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary font-mono">
                ADMIN CONTROL PANEL
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent/10 gap-2"
              onClick={() => window.open('/scoreboard', '_blank', 'noopener,noreferrer')}
            >
              <Tv className="w-4 h-4" />
              LAUNCH BIG SCREEN
            </Button>
          </div>

          <Tabs defaultValue="challenges" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="challenges" className="font-mono">
                <Target className="w-4 h-4 mr-2" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="competitions" className="font-mono">
                <Trophy className="w-4 h-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="users" className="font-mono">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="settings" className="font-mono">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="activity" className="font-mono">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="challenges">
              <ErrorBoundary>
                <AdminChallenges />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="competitions">
              <ErrorBoundary>
                <AdminCompetitions />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="users">
              <ErrorBoundary>
                <AdminUsers />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="settings">
              <ErrorBoundary>
                <AdminSettings />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="activity">
              <ErrorBoundary>
                <AdminActivity />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
}
