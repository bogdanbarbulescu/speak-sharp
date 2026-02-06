import { UserSettings, Difficulty } from '@/types/session';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Clock, Timer, Mic } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Duration */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="timer-duration">Speech Duration</Label>
          </div>
          <Select
            value={settings.timerDuration.toString()}
            onValueChange={(value) => updateSetting('timerDuration', parseInt(value) as 60 | 120)}
          >
            <SelectTrigger id="timer-duration" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="120">2 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prep Time Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="prep-time">Prep Time</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="prep-time"
              checked={settings.prepTimeEnabled}
              onCheckedChange={(checked) => updateSetting('prepTimeEnabled', checked)}
            />
            {settings.prepTimeEnabled && (
              <Select
                value={settings.prepTimeDuration.toString()}
                onValueChange={(value) => updateSetting('prepTimeDuration', parseInt(value) as 5 | 10)}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Transcript and filler words */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="transcript-enabled">Transcript and filler words</Label>
            </div>
            <Switch
              id="transcript-enabled"
              checked={settings.transcriptEnabled !== false}
              onCheckedChange={(checked) => updateSetting('transcriptEnabled', checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Turn off to avoid repeated browser sounds during recording. Recording and timer still work.
          </p>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={settings.difficultyFilter}
            onValueChange={(value) => updateSetting('difficultyFilter', value as 'all' | Difficulty)}
          >
            <SelectTrigger id="difficulty" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="easy">🟢 Easy</SelectItem>
              <SelectItem value="abstract">🟡 Abstract</SelectItem>
              <SelectItem value="controversial">🔴 Controversial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {settings.darkMode ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="dark-mode">Dark Mode</Label>
          </div>
          <Switch
            id="dark-mode"
            checked={settings.darkMode}
            onCheckedChange={(checked) => updateSetting('darkMode', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
