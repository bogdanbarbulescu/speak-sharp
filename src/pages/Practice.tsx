import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PromptCard } from '@/components/PromptCard';
import { useTimer } from '@/hooks/useTimer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getRandomPrompt } from '@/data/prompts';
import { Prompt, UserSettings, DEFAULT_SETTINGS, Session } from '@/types/session';
import { Play, Square, RotateCcw, Home, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type PracticePhase = 'prompt' | 'prep' | 'speaking' | 'feedback' | 'reflection';

export default function Practice() {
  const navigate = useNavigate();
  const [settings] = useLocalStorage<UserSettings>('table-topics-settings', DEFAULT_SETTINGS);
  const [, setSessions] = useLocalStorage<Session[]>('table-topics-sessions', []);
  
  const [phase, setPhase] = useState<PracticePhase>('prompt');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt>(() => 
    getRandomPrompt(settings.difficultyFilter)
  );
  const [prepCountdown, setPrepCountdown] = useState<number>(settings.prepTimeDuration);
  
  // Self-reflection state
  const [hadOpeningHook, setHadOpeningHook] = useState<boolean | null>(null);
  const [hadConclusion, setHadConclusion] = useState<boolean | null>(null);
  const [ratings, setRatings] = useState({ confidence: 3, clarity: 3, enjoyment: 3 });
  const [notes, setNotes] = useState('');

  const handleTimerComplete = useCallback(() => {
    // Timer hit zero, but we keep running for overtime
  }, []);

  const timer = useTimer({
    duration: settings.timerDuration,
    onComplete: handleTimerComplete,
  });

  const recorder = useAudioRecorder();

  // Handle prep countdown
  useEffect(() => {
    if (phase !== 'prep') return;
    
    if (prepCountdown <= 0) {
      setPhase('speaking');
      timer.start();
      recorder.start();
      return;
    }

    const interval = setInterval(() => {
      setPrepCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, prepCountdown, timer, recorder]);

  const handleStart = async () => {
    if (settings.prepTimeEnabled) {
      setPrepCountdown(settings.prepTimeDuration);
      setPhase('prep');
    } else {
      setPhase('speaking');
      timer.start();
      await recorder.start();
    }
  };

  /** Skip prep countdown and go straight to speaking (used in prep phase only). */
  const handleSkipPrep = async () => {
    setPhase('speaking');
    timer.start();
    await recorder.start();
  };

  const handleStop = () => {
    timer.stop();
    recorder.stop();
    setPhase('feedback');
  };

  const handleContinueToReflection = () => {
    setPhase('reflection');
  };

  /** Persist audio for last N sessions only (storage budget). */
  const MAX_SESSIONS_WITH_AUDIO = 3;

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleSaveAndPracticeAgain = async () => {
    const audioUrl =
      recorder.audioBlob != null ? await blobToDataUrl(recorder.audioBlob) : undefined;

    const session: Session = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      promptText: currentPrompt.text,
      promptDifficulty: currentPrompt.difficulty,
      targetDuration: settings.timerDuration,
      actualDuration: recorder.duration,
      silenceCount: recorder.silenceData.count,
      totalSilenceDuration: recorder.silenceData.totalDuration,
      audioUrl,
      selfReflection: {
        hadOpeningHook,
        hadConclusion,
      },
      ratings: {
        confidence: ratings.confidence as 1 | 2 | 3 | 4 | 5,
        clarity: ratings.clarity as 1 | 2 | 3 | 4 | 5,
        enjoyment: ratings.enjoyment as 1 | 2 | 3 | 4 | 5,
      },
      notes: notes || undefined,
    };

    setSessions((prev) => {
      const next = [session, ...prev];
      return next.map((s, i) =>
        i >= MAX_SESSIONS_WITH_AUDIO ? { ...s, audioUrl: undefined } : s
      );
    });

    resetPractice();
  };

  const resetPractice = () => {
    timer.reset();
    recorder.reset();
    setCurrentPrompt(getRandomPrompt(settings.difficultyFilter));
    setPhase('prompt');
    setHadOpeningHook(null);
    setHadConclusion(null);
    setRatings({ confidence: 3, clarity: 3, enjoyment: 3 });
    setNotes('');
  };

  const handleNewPrompt = () => {
    setCurrentPrompt(getRandomPrompt(settings.difficultyFilter));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toastmasters-style duration bands: 1 min = 0:45–1:15, 2 min = 1:00–2:00 (with small overtime tolerance)
  const getTargetRange = () => {
    if (settings.timerDuration === 60) return '0:45–1:15';
    return '1:00–2:00';
  };

  const isDurationGood = () => {
    const target = settings.timerDuration;
    const min = target === 60 ? 45 : 60;
    const maxWithOvertime = target === 60 ? 85 : 130; // allow up to ~10s overtime
    return recorder.duration >= min && recorder.duration <= maxWithOvertime;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <Home className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Table Topics</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Prompt Phase */}
        {phase === 'prompt' && (
          <>
            <PromptCard text={currentPrompt.text} difficulty={currentPrompt.difficulty} />
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button size="lg" onClick={handleStart} className="min-w-40">
                <Play className="mr-2 h-5 w-5" />
                I'm Ready
              </Button>
              <Button variant="outline" onClick={handleNewPrompt}>
                <RotateCcw className="mr-2 h-4 w-4" />
                New Prompt
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              {settings.timerDuration === 60 ? '1 minute' : '2 minutes'} •{' '}
              {settings.prepTimeEnabled ? ` ${settings.prepTimeDuration}s prep` : ' No prep time'}
            </p>
          </>
        )}

        {/* Prep Phase */}
        {phase === 'prep' && (
          <>
            <PromptCard text={currentPrompt.text} difficulty={currentPrompt.difficulty} />
            
            <div className="text-center mt-4">
              <p className="text-muted-foreground mb-2">Prep time remaining</p>
              <span className="text-6xl font-mono font-bold text-primary">{prepCountdown}</span>
            </div>
            
            <Button variant="outline" onClick={handleSkipPrep} className="mt-4">
              <Play className="mr-2 h-4 w-4" />
              Skip & Start Now
            </Button>
          </>
        )}

        {/* Speaking Phase */}
        {phase === 'speaking' && (
          <>
            <PromptCard 
              text={currentPrompt.text} 
              difficulty={currentPrompt.difficulty}
              className="mb-4"
            />
            
            <Timer
              formattedTime={timer.formattedTime}
              phase={timer.phase}
              isRunning={timer.isRunning}
            />
            
            <Button 
              size="lg" 
              variant="destructive" 
              onClick={handleStop}
              className="mt-6"
            >
              <Square className="mr-2 h-5 w-5" />
              Stop
            </Button>
            
            {recorder.error && (
              <p className="text-destructive text-sm mt-2">{recorder.error}</p>
            )}
          </>
        )}

        {/* Feedback Phase */}
        {phase === 'feedback' && (
          <div className="w-full max-w-lg space-y-6">
            <h2 className="text-2xl font-bold text-center">Session Complete</h2>
            
            {/* Duration Result */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{formatDuration(recorder.duration)}</span>
                    <span className={cn(
                      "ml-2 text-sm",
                      isDurationGood() ? "text-timer-green" : "text-timer-red"
                    )}>
                      {isDurationGood() ? '✅' : '⚠️'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Target: {getTargetRange()}
                </p>
              </CardContent>
            </Card>

            {/* Silence Detection */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pauses Detected</span>
                  <span className="text-xl font-semibold">{recorder.silenceData.count}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total silence: {recorder.silenceData.totalDuration}s
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Pauses longer than 0.5 s are counted. Brief pauses are fine; long gaps may suggest structure.
                </p>
              </CardContent>
            </Card>

            {/* Audio Playback — only available this session; not saved to history */}
            {recorder.audioUrl && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Listen Back</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Only available for this session—recording is not saved to history.
                  </p>
                  <audio 
                    controls 
                    src={recorder.audioUrl} 
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Listen above if you want to hear your recording again; it won&apos;t be available after you continue.
            </p>

            {/* Self-Reflection */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Self-Reflection</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Did you have a clear opening hook?</Label>
                    <div className="flex gap-2 mt-2">
                      {['Yes', 'No', 'Unsure'].map((option) => (
                        <Button
                          key={option}
                          variant={hadOpeningHook === (option === 'Yes' ? true : option === 'No' ? false : null) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setHadOpeningHook(option === 'Yes' ? true : option === 'No' ? false : null)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Did you arrive at a conclusion?</Label>
                    <div className="flex gap-2 mt-2">
                      {['Yes', 'No', 'Unsure'].map((option) => (
                        <Button
                          key={option}
                          variant={hadConclusion === (option === 'Yes' ? true : option === 'No' ? false : null) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setHadConclusion(option === 'Yes' ? true : option === 'No' ? false : null)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(hadOpeningHook !== null || hadConclusion !== null) ? (
              <Button size="lg" className="w-full" onClick={handleContinueToReflection}>
                Continue
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Answer at least one reflection question above, or skip.
                </p>
                <div className="flex gap-2">
                  <Button size="lg" className="flex-1" onClick={handleContinueToReflection} variant="outline">
                    Skip reflection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reflection Phase */}
        {phase === 'reflection' && (
          <div className="w-full max-w-lg space-y-6">
            <h2 className="text-2xl font-bold text-center">Rate Your Performance</h2>
            
            {/* Rating Sliders */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                {[
                  { key: 'confidence', label: 'Confidence' },
                  { key: 'clarity', label: 'Clarity' },
                  { key: 'enjoyment', label: 'Enjoyment' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{label}</Label>
                      <span className="text-sm font-medium">{ratings[key as keyof typeof ratings]}/5</span>
                    </div>
                    <Slider
                      value={[ratings[key as keyof typeof ratings]]}
                      onValueChange={([value]) => setRatings((prev) => ({ ...prev, [key]: value }))}
                      min={1}
                      max={5}
                      step={1}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <Label htmlFor="notes" className="mb-2 block">
                  What would you do differently? (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Reflect on your performance..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1" onClick={handleSaveAndPracticeAgain}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Save & Practice Again
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={async () => {
                  await handleSaveAndPracticeAgain();
                  navigate('/');
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
