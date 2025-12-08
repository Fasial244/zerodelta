import { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAdmin } from '@/hooks/useAdmin';

// Helper to safely convert any value to string
function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function AdminSettings() {
  const { settings, isLoading } = useSystemSettings();
  const { updateSetting, postAnnouncement } = useAdmin();
  const [announcement, setAnnouncement] = useState('');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      // Safely convert all settings to string format
      const converted: Record<string, string> = {};
      Object.entries(settings).forEach(([key, value]) => {
        converted[key] = toStringValue(value);
      });
      setLocalSettings(converted);
    }
  }, [settings]);

  const handleSave = (key: string) => {
    const value = localSettings[key];
    if (value !== undefined) {
      updateSetting({ key, value });
    }
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
            const newValue = checked ? 'true' : 'false';
            setLocalSettings(prev => ({ ...prev, game_paused: newValue }));
            updateSetting({ key: 'game_paused', value: newValue });
          }}
        />
      </div>

      {/* Settings fields */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingFields.map((field) => {
          const rawValue = localSettings[field.key] || '';
          // For datetime-local, extract the first 16 characters if it's an ISO string
          const displayValue = field.type === 'datetime-local' && rawValue
            ? rawValue.slice(0, 16)
            : rawValue;
            
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <div className="flex gap-2">
                <Input
                  id={field.key}
                  type={field.type}
                  step={field.step}
                  value={displayValue}
                  onChange={(e) => {
                    let newValue = e.target.value;
                    // Convert datetime-local back to ISO string
                    if (field.type === 'datetime-local' && newValue) {
                      try {
                        newValue = new Date(newValue).toISOString();
                      } catch {
                        // Keep as-is if conversion fails
                      }
                    }
                    setLocalSettings(prev => ({ ...prev, [field.key]: newValue }));
                  }}
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
          );
        })}
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
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {announcement.length}/500 characters
            </span>
            <Button
              onClick={handlePostAnnouncement}
              disabled={!announcement.trim() || announcement.length > 500}
              className="w-auto"
            >
              <Send className="w-4 h-4 mr-2" />
              Post Announcement
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
