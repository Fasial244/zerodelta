import { useState, useEffect } from 'react';
import { Save, Send, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

// Helper to safely convert any value to string
function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

// DateTimePicker component for better UX
function DateTimePicker({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  label: string;
}) {
  const date = value ? new Date(value) : undefined;
  const [timeValue, setTimeValue] = useState(date ? format(date, 'HH:mm') : '00:00');

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    const [hours, minutes] = timeValue.split(':').map(Number);
    selectedDate.setHours(hours, minutes, 0, 0);
    onChange(selectedDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate.toISOString());
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="w-28"
        />
      </div>
      {date && (
        <p className="text-xs text-muted-foreground">
          {format(date, "PPpp")}
        </p>
      )}
    </div>
  );
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

  const numberFields = [
    { key: 'decay_rate', label: 'Point Decay Rate', step: '0.1' },
    { key: 'decay_factor', label: 'Decay Factor' },
    { key: 'min_points', label: 'Minimum Points' },
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

      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="event_title">Event Title</Label>
        <div className="flex gap-2">
          <Input
            id="event_title"
            value={localSettings.event_title || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, event_title: e.target.value }))}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={() => handleSave('event_title')}>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Date/Time Pickers */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <DateTimePicker
            label="Game Start Time"
            value={localSettings.game_start_time || ''}
            onChange={(val) => setLocalSettings(prev => ({ ...prev, game_start_time: val }))}
          />
          <Button variant="outline" size="sm" onClick={() => handleSave('game_start_time')}>
            <Save className="w-4 h-4 mr-2" /> Save Start Time
          </Button>
        </div>
        <div className="space-y-2">
          <DateTimePicker
            label="Game End Time"
            value={localSettings.game_end_time || ''}
            onChange={(val) => setLocalSettings(prev => ({ ...prev, game_end_time: val }))}
          />
          <Button variant="outline" size="sm" onClick={() => handleSave('game_end_time')}>
            <Save className="w-4 h-4 mr-2" /> Save End Time
          </Button>
        </div>
      </div>

      {/* Number fields */}
      <div className="grid gap-4 md:grid-cols-3">
        {numberFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="flex gap-2">
              <Input
                id={field.key}
                type="number"
                step={field.step}
                value={localSettings[field.key] || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => handleSave(field.key)}>
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
