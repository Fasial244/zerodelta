import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';

const categories = ['Web', 'Pwn', 'Forensics', 'Crypto', 'Other'];
const flagTypes = ['static', 'regex'];

export function AdminChallenges() {
  const { challenges, createChallenge, updateChallenge, deleteChallenge } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    points: 100,
    category: 'Web',
    flag_type: 'static',
    flag_value: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      points: 100,
      category: 'Web',
      flag_type: 'static',
      flag_value: '',
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChallenge(form);
    setIsOpen(false);
    resetForm();
  };

  const handleToggleActive = (id: string, currentState: boolean) => {
    updateChallenge({ id, is_active: !currentState });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      deleteChallenge(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground font-mono">CHALLENGES</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono">
                {editingId ? 'EDIT CHALLENGE' : 'CREATE CHALLENGE'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="SQL Injection 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 100 })}
                    min={10}
                    max={1000}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Flag Type</Label>
                  <Select
                    value={form.flag_type}
                    onValueChange={(value) => setForm({ ...form, flag_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {flagTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'static' ? 'Static (exact match)' : 'Regex (pattern)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{form.flag_type === 'static' ? 'Flag (will be hashed)' : 'Flag Pattern (regex)'}</Label>
                <Input
                  value={form.flag_value}
                  onChange={(e) => setForm({ ...form, flag_value: e.target.value })}
                  placeholder={form.flag_type === 'static' ? 'DELTA{flag_here}' : '^DELTA\\{[a-zA-Z0-9_]+\\}$'}
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Markdown)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the challenge..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Challenge list */}
      <div className="space-y-2">
        {challenges.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-mono">
            No challenges yet. Create one to get started!
          </p>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                challenge.is_active ? 'bg-card border-border' : 'bg-muted/50 border-muted'
              }`}
            >
              <div className="flex items-center gap-4">
                <Badge variant={challenge.is_active ? 'default' : 'secondary'}>
                  {challenge.category}
                </Badge>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {DOMPurify.sanitize(challenge.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {challenge.points} pts • {challenge.solve_count} solves • {challenge.flag_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(challenge.id, challenge.is_active)}
                >
                  {challenge.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(challenge.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
