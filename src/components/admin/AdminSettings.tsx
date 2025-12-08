import { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAdmin } from '@/hooks/useAdmin';

export function AdminSettings() {
  const { settings, isLoading } = useSystemSettings();
  const { updateSetting, postAnnouncement } = useAdmin();
  const [announcement, setAnnouncement] = useState('');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings as unknown as Record<string, string>);
    }
  }, [settings]);

  const handleSave = (key: string) => {
    updateSetting({ key, value: localSettings[key] });
  };

  const handlePostAnnouncement = () => {
    if (announcement.trim()) {
      postAnnouncement(announcement.trim());
      setAnnouncement('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground font-mono">
          Loading settings...
        </div>
      </div>
    );
  }

  const settingFields = [
    { key: 'event_title', label: 'Event Title', type: 'text' },
    { key: 'game_start_time', label: 'Game Start Time (ISO)', type: 'datetime-local' },
    { key: 'game_end_time', label: 'Game End Time (ISO)', type: 'datetime-local' },
    { key: 'decay_rate', label: 'Point Decay Rate', type: 'number', step: '0.1' },
    { key: 'decay_factor', label: 'Decay Factor', type: 'number' },
    { key: 'min_points', label: 'Minimum Points', type: 'number' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-foreground font-mono">SYSTEM SETTINGS</h2>

      {/* Game pause toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div>
          <h3 className="font-semibold text-foreground">Game Paused</h3>
          <p className="text-sm text-muted-foreground">
            Pause all challenge submissions
          </p>
        </div>
        <Switch
          checked={localSettings.game_paused === 'true'}
          onCheckedChange={(checked) => {
            setLocalSettings({ ...localSettings, game_paused: checked ? 'true' : 'false' });
            updateSetting({ key: 'game_paused', value: checked ? 'true' : 'false' });
          }}
        />
      </div>

      {/* Settings fields */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="flex gap-2">
              <Input
                id={field.key}
                type={field.type}
                step={field.step}
                value={
                  field.type === 'datetime-local' && localSettings[field.key]
                    ? localSettings[field.key].slice(0, 16)
                    : localSettings[field.key] || ''
                }
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    [field.key]:
                      field.type === 'datetime-local'
                        ? new Date(e.target.value).toISOString()
                        : e.target.value,
                  })
                }
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSave(field.key)}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Announcement section */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="font-bold text-foreground font-mono">POST ANNOUNCEMENT</h3>
        <div className="space-y-2">
          <Textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="📢 Important announcement..."
            rows={3}
          />
          <Button
            onClick={handlePostAnnouncement}
            disabled={!announcement.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Post Announcement
          </Button>
        </div>
      </div>
    </div>
  );
}
