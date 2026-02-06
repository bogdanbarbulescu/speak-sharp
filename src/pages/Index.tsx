import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from '@/components/Settings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UserSettings, DEFAULT_SETTINGS } from '@/types/session';
import { Play, History, SettingsIcon, Moon, Sun } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useLocalStorage<UserSettings>('table-topics-settings', DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const toggleDarkMode = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {settings.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Table Topics</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {showSettings ? (
          <Settings settings={settings} onSettingsChange={setSettings} />
        ) : (
          <>
            <div className="text-center max-w-md">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Practice Impromptu Speaking
              </h2>
              <p className="text-muted-foreground text-lg">
                Train your ability to think on your feet with random Table Topics prompts.
              </p>
            </div>

            <Button 
              size="lg" 
              className="h-16 px-12 text-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => navigate('/practice')}
            >
              <Play className="mr-3 h-6 w-6" />
              Practice Now
            </Button>

            <Button 
              variant="outline" 
              onClick={() => navigate('/history')}
              className="mt-4"
            >
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>
          {settings.timerDuration === 60 ? '1 min' : '2 min'} speech
          {settings.prepTimeEnabled && ` • ${settings.prepTimeDuration}s prep`}
        </p>
      </footer>
    </div>
  );
};

export default Index;
