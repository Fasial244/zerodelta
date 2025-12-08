import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Plus, Trash2, Check, X, Calendar, Users, Trophy, 
  Edit, Eye, EyeOff, Clock, UserCheck, UserX 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCompetitions, Competition } from '@/hooks/useCompetitions';
import DOMPurify from 'dompurify';

export function AdminCompetitions() {
  const {
    competitions,
    allRegistrations,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    updateRegistration,
  } = useCompetitions();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    is_active: false,
    require_approval: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      is_active: false,
      require_approval: true,
    });
    setEditingCompetition(null);
  };

  const handleCreate = () => {
    createCompetition({
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingCompetition) return;
    updateCompetition({
      id: editingCompetition.id,
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
    });
    setEditingCompetition(null);
    resetForm();
  };

  const openEdit = (comp: Competition) => {
    setEditingCompetition(comp);
    setFormData({
      name: comp.name,
      description: comp.description,
      start_time: format(new Date(comp.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(comp.end_time), "yyyy-MM-dd'T'HH:mm"),
      is_active: comp.is_active,
      require_approval: comp.require_approval,
    });
  };

  const pendingRegistrations = allRegistrations.filter(r => r.status === 'pending');
  const approvedRegistrations = allRegistrations.filter(r => r.status === 'approved');

  const CompetitionForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Competition Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="ZeroDelta Competition 2025"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Competition description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="datetime-local"
            value={formData.start_time}
            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="datetime-local"
            value={formData.end_time}
            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div>
          <p className="font-medium">Active Competition</p>
          <p className="text-sm text-muted-foreground">Make this the current active competition</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div>
          <p className="font-medium">Require Approval</p>
          <p className="text-sm text-muted-foreground">Users must be approved before accessing challenges</p>
        </div>
        <Switch
          checked={formData.require_approval}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_approval: checked }))}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={isEdit ? handleUpdate : handleCreate} className="flex-1">
          {isEdit ? 'Update Competition' : 'Create Competition'}
        </Button>
        <Button variant="outline" onClick={() => {
          setIsCreateOpen(false);
          setEditingCompetition(null);
          resetForm();
        }}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="competitions" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="competitions" className="font-mono">
              <Trophy className="w-4 h-4 mr-2" />
              Competitions
            </TabsTrigger>
            <TabsTrigger value="registrations" className="font-mono">
              <Users className="w-4 h-4 mr-2" />
              Registrations
              {pendingRegistrations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRegistrations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Competition</DialogTitle>
              </DialogHeader>
              <CompetitionForm />
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="competitions" className="space-y-4">
          {competitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No competitions yet. Create one to get started.
            </div>
          ) : (
            competitions.map((comp) => (
              <Card key={comp.id} className={comp.is_active ? 'border-primary' : ''}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <Trophy className={`w-5 h-5 ${comp.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <CardTitle className="text-lg font-mono">
                      {DOMPurify.sanitize(comp.name)}
                    </CardTitle>
                    {comp.is_active && <Badge>ACTIVE</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(comp)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Competition?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this competition and all registrations.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteCompetition(comp.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {DOMPurify.sanitize(comp.description)}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(comp.start_time), 'PPp')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(comp.end_time), 'PPp')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {comp.require_approval ? (
                        <>
                          <EyeOff className="w-4 h-4 text-warning" />
                          <span className="text-warning">Approval Required</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 text-accent" />
                          <span className="text-accent">Open Access</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingCompetition} onOpenChange={(open) => !open && setEditingCompetition(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Competition</DialogTitle>
              </DialogHeader>
              <CompetitionForm isEdit />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-6">
          {/* Pending Approvals */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-mono flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-warning" />
              PENDING APPROVALS ({pendingRegistrations.length})
            </h3>
            {pendingRegistrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No pending registrations
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRegistrations.map((reg) => (
                  <div 
                    key={reg.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-warning/50 bg-warning/10"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={reg.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20">
                          {(reg.profiles?.username || '??').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {DOMPurify.sanitize(reg.profiles?.username || 'Unknown User')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reg.competitions?.name} • {format(new Date(reg.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateRegistration(reg.id, 'approved')}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateRegistration(reg.id, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Users */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-mono flex items-center gap-2">
              <UserX className="w-5 h-5 text-accent" />
              APPROVED PARTICIPANTS ({approvedRegistrations.length})
            </h3>
            {approvedRegistrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No approved participants yet
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {approvedRegistrations.map((reg) => (
                  <div 
                    key={reg.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={reg.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-xs">
                        {(reg.profiles?.username || '??').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {DOMPurify.sanitize(reg.profiles?.username || 'Unknown')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {reg.competitions?.name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-accent border-accent">
                      <Check className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
