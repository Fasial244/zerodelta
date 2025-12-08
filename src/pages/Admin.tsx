import { Layout } from '@/components/layout/Layout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { AdminChallenges } from '@/components/admin/AdminChallenges';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminActivity } from '@/components/admin/AdminActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, Activity, Target } from 'lucide-react';

export default function Admin() {
  return (
    <ProtectedAdminRoute>
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-8">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-glow-cyan font-mono">
              ADMIN CONTROL PANEL
            </h1>
          </div>

          <Tabs defaultValue="challenges" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="challenges" className="font-mono">
                <Target className="w-4 h-4 mr-2" />
                Challenges
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
              <AdminChallenges />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="settings">
              <AdminSettings />
            </TabsContent>

            <TabsContent value="activity">
              <AdminActivity />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
}
