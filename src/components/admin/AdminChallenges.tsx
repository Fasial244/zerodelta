import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Globe, Terminal, FileDown, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

const categories = ['Web', 'Pwn', 'Forensics', 'Crypto', 'Other'];
const flagTypes = ['static', 'regex'];

interface ChallengeFile {
  name: string;
  url: string;
  size?: number;
}

interface ConnectionInfo {
  type?: 'web' | 'netcat' | 'file';
  url?: string;
  host?: string;
  port?: number;
  files?: ChallengeFile[];
  [key: string]: unknown;
}

interface ChallengeForm {
  title: string;
  description: string;
  points: number;
  category: string;
  flag_type: string;
  flag_value: string;
  dependencies: string[];
  connection_type: 'none' | 'web' | 'netcat' | 'file';
  connection_url: string;
  connection_host: string;
  connection_port: string;
  files: ChallengeFile[];
}

const initialForm: ChallengeForm = {
  title: '',
  description: '',
  points: 100,
  category: 'Web',
  flag_type: 'static',
  flag_value: '',
  dependencies: [],
  connection_type: 'none',
  connection_url: '',
  connection_host: '',
  connection_port: '',
  files: [],
};

export function AdminChallenges() {
  const { challenges, createChallenge, updateChallenge, deleteChallenge } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChallengeForm>(initialForm);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleEdit = (challenge: any) => {
    const connInfo = challenge.connection_info as ConnectionInfo || {};
    setEditingId(challenge.id);
    setForm({
      title: challenge.title,
      description: challenge.description,
      points: challenge.points,
      category: challenge.category,
      flag_type: challenge.flag_type,
      flag_value: '', // Don't populate flag for security
      dependencies: challenge.dependencies || [],
      connection_type: connInfo.type || 'none',
      connection_url: connInfo.url || '',
      connection_host: connInfo.host || '',
      connection_port: connInfo.port?.toString() || '',
      files: connInfo.files || [],
    });
    setIsOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: ChallengeFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${timestamp}_${safeName}`;

        const { data, error } = await supabase.storage
          .from('challenge-files')
          .upload(filePath, file);

        if (error) {
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}: ${error.message}`,
            variant: 'destructive',
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('challenge-files')
          .getPublicUrl(data.path);

        newFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
        });
      }

      setForm(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles],
      }));

      if (newFiles.length > 0) {
        toast({
          title: 'Files uploaded',
          description: `Successfully uploaded ${newFiles.length} file(s)`,
        });
      }
    } catch (error) {
      toast({
        title: 'Upload error',
        description: 'An unexpected error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate port if netcat connection type
    if (form.connection_type === 'netcat') {
      const portNum = parseInt(form.connection_port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        alert('Port must be a valid number between 1 and 65535');
        return;
      }
    }
    
    // Build connection_info based on type
    let connection_info: ConnectionInfo = {};
    if (form.connection_type === 'web') {
      connection_info = { type: 'web', url: form.connection_url };
    } else if (form.connection_type === 'netcat') {
      connection_info = { 
        type: 'netcat', 
        host: form.connection_host, 
        port: parseInt(form.connection_port)
      };
    } else if (form.connection_type === 'file') {
      connection_info = { 
        type: 'file', 
        files: form.files,
      };
    }

    if (editingId) {
      // Update existing challenge
      updateChallenge({
        id: editingId,
        title: form.title,
        description: form.description,
        points: form.points,
        category: form.category,
        dependencies: form.dependencies,
        connection_info,
        // Only update flag if a new value was provided
        ...(form.flag_value ? { 
          flag_type: form.flag_type,
          flag_value: form.flag_value,
        } : {}),
      });
    } else {
      // Create new challenge
      createChallenge({
        title: form.title,
        description: form.description,
        points: form.points,
        category: form.category,
        flag_type: form.flag_type,
        flag_value: form.flag_value,
        dependencies: form.dependencies,
        connection_info,
      });
    }
    
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

  const toggleDependency = (challengeId: string) => {
    setForm(prev => ({
      ...prev,
      dependencies: prev.dependencies.includes(challengeId)
        ? prev.dependencies.filter(id => id !== challengeId)
        : [...prev.dependencies, challengeId]
    }));
  };

  // Get challenges available as dependencies (all except the one being edited)
  const availableDependencies = challenges.filter(c => c.id !== editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground font-mono">CHALLENGES</h2>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
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
                <Label>
                  {form.flag_type === 'static' ? 'Flag (will be hashed)' : 'Flag Pattern (regex)'}
                  {editingId && <span className="text-muted-foreground text-xs ml-2">(leave empty to keep current)</span>}
                </Label>
                <Input
                  value={form.flag_value}
                  onChange={(e) => setForm({ ...form, flag_value: e.target.value })}
                  placeholder={form.flag_type === 'static' ? 'DELTA{flag_here}' : '^DELTA\\{[a-zA-Z0-9_]+\\}$'}
                  required={!editingId}
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

              {/* Dependency Selector */}
              <div className="space-y-2">
                <Label>Dependencies (prerequisites)</Label>
                <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {availableDependencies.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No other challenges available</p>
                  ) : (
                    availableDependencies.map((challenge) => (
                      <div key={challenge.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dep-${challenge.id}`}
                          checked={form.dependencies.includes(challenge.id)}
                          onCheckedChange={() => toggleDependency(challenge.id)}
                        />
                        <label 
                          htmlFor={`dep-${challenge.id}`}
                          className="text-sm cursor-pointer flex items-center gap-2"
                        >
                          <Badge variant="outline" className="text-xs">
                            {challenge.category}
                          </Badge>
                          {DOMPurify.sanitize(challenge.title)}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {form.dependencies.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {form.dependencies.length} prerequisite(s) selected
                  </p>
                )}
              </div>

              {/* Connection Info Editor */}
              <div className="space-y-2">
                <Label>Connection Type</Label>
                <Select
                  value={form.connection_type}
                  onValueChange={(value: 'none' | 'web' | 'netcat' | 'file') => 
                    setForm({ ...form, connection_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="web">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Web URL
                      </div>
                    </SelectItem>
                    <SelectItem value="netcat">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Netcat (nc)
                      </div>
                    </SelectItem>
                    <SelectItem value="file">
                      <div className="flex items-center gap-2">
                        <FileDown className="w-4 h-4" />
                        File Download
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.connection_type === 'web' && (
                <div className="space-y-2">
                  <Label>Challenge URL</Label>
                  <Input
                    value={form.connection_url}
                    onChange={(e) => setForm({ ...form, connection_url: e.target.value })}
                    placeholder="https://challenge.zerodelta.ctf/web1"
                  />
                </div>
              )}

              {form.connection_type === 'netcat' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input
                      value={form.connection_host}
                      onChange={(e) => setForm({ ...form, connection_host: e.target.value })}
                      placeholder="pwn.zerodelta.ctf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port (1-65535)</Label>
                    <Input
                      type="number"
                      value={form.connection_port}
                      onChange={(e) => setForm({ ...form, connection_port: e.target.value })}
                      placeholder="1337"
                      min={1}
                      max={65535}
                    />
                  </div>
                </div>
              )}

              {form.connection_type === 'file' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Challenge Files</Label>
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Files
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload challenge files (ZIP, binary, images, etc.)
                    </p>
                  </div>

                  {/* Uploaded files list */}
                  {form.files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      <div className="border border-border rounded-lg divide-y divide-border">
                        {form.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                              {file.size && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  ({formatFileSize(file.size)})
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index)}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
          challenges.map((challenge) => {
            const connInfo = challenge.connection_info as ConnectionInfo;
            const fileCount = connInfo?.files?.length || 0;
            
            return (
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
                      {challenge.dependencies?.length > 0 && (
                        <span className="ml-2">• {challenge.dependencies.length} deps</span>
                      )}
                      {fileCount > 0 && (
                        <span className="ml-2">• {fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(challenge)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
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
            );
          })
        )}
      </div>
    </div>
  );
}