import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Crown, GripVertical } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  role: string;
  social_link: string | null;
  image_url: string | null;
  display_order: number;
}

export function AdminAuthors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    social_link: '',
    image_url: '',
    display_order: 0,
  });

  const { data: authors, isLoading } = useQuery({
    queryKey: ['admin-authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Author[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (author: Omit<Author, 'id'>) => {
      const { error } = await supabase.from('authors').insert(author);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author added successfully' });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error adding author', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Author) => {
      const { error } = await supabase.from('authors').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author updated successfully' });
      setEditingId(null);
    },
    onError: (error) => {
      toast({ title: 'Error updating author', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('authors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting author', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', role: '', social_link: '', image_url: '', display_order: 0 });
  };

  const startEdit = (author: Author) => {
    setEditingId(author.id);
    setFormData({
      name: author.name,
      role: author.role,
      social_link: author.social_link || '',
      image_url: author.image_url || '',
      display_order: author.display_order,
    });
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        social_link: formData.social_link || null,
        image_url: formData.image_url || null,
      });
    } else {
      addMutation.mutate({
        ...formData,
        social_link: formData.social_link || null,
        image_url: formData.image_url || null,
      });
    }
  };

  const isLeader = (role: string) => {
    const lowerRole = role.toLowerCase();
    return lowerRole.includes('leader') || lowerRole.includes('lead');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono text-primary">AUTHORS / CREDITS</h2>
        <Button
          onClick={() => {
            setShowAddForm(true);
            resetForm();
            setEditingId(null);
          }}
          className="font-mono"
        >
          <Plus className="w-4 h-4 mr-2" />
          ADD AUTHOR
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="font-mono">
              {editingId ? 'EDIT AUTHOR' : 'ADD NEW AUTHOR'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="0xfsl (Faisal AL-Jaber)"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Team Leader, Developer, etc."
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social_link">Social Link</Label>
                <Input
                  id="social_link"
                  value={formData.social_link}
                  onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                  placeholder="https://github.com/username"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="font-mono w-32"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!formData.name || !formData.role}>
                <Save className="w-4 h-4 mr-2" />
                SAVE
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                CANCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authors List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground font-mono">Loading authors...</div>
      ) : authors && authors.length > 0 ? (
        <div className="space-y-3">
          {authors.map((author) => (
            <Card
              key={author.id}
              className={`${isLeader(author.role) ? 'border-yellow-500/50' : 'border-border'}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-sm w-8">
                    #{author.display_order}
                  </span>
                  {isLeader(author.role) && <Crown className="w-5 h-5 text-yellow-500" />}
                  <div>
                    <p className="font-mono font-bold">{author.name}</p>
                    <p className="text-sm text-muted-foreground">{author.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(author)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${author.name}?`)) {
                        deleteMutation.mutate(author.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground font-mono">
          No authors added yet. Click "ADD AUTHOR" to get started.
        </div>
      )}
    </div>
  );
}
