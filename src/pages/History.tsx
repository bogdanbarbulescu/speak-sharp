import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStreak } from '@/hooks/useStreak';
import { Session } from '@/types/session';
import { Home, Calendar, Clock, Star, Flame, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const difficultyBadges = {
  easy: { label: '🟢 Easy', variant: 'secondary' as const },
  abstract: { label: '🟡 Abstract', variant: 'default' as const },
  controversial: { label: '🔴 Controversial', variant: 'destructive' as const },
};

export default function History() {
  const navigate = useNavigate();
  const [sessions] = useLocalStorage<Session[]>('table-topics-sessions', []);
  const { currentStreak, longestStreak } = useStreak(sessions);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAverageRating = (session: Session) => {
    const { confidence, clarity, enjoyment } = session.ratings;
    return ((confidence + clarity + enjoyment) / 3).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <Home className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Practice History</h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
            <p className="text-muted-foreground mb-4">
              Complete your first practice to see your history here.
            </p>
            <Button onClick={() => navigate('/practice')}>
              Start Practicing
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground mb-2">
              Playback is kept for the last 3 sessions only; older sessions show metadata only.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-sm text-muted-foreground">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed
              </p>
              {(currentStreak > 0 || longestStreak > 0) && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {currentStreak > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {currentStreak} day{currentStreak !== 1 ? 's' : ''} streak
                    </span>
                  )}
                  {longestStreak > 0 && (
                    <span>Longest: {longestStreak} days</span>
                  )}
                </div>
              )}
            </div>
            
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={difficultyBadges[session.promptDifficulty].variant}>
                          {difficultyBadges[session.promptDifficulty].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(session.timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground line-clamp-2 mb-3">
                        {session.promptText}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(session.actualDuration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" />
                          <span>{getAverageRating(session)}</span>
                        </div>
                        <span>{session.silenceCount} pause{session.silenceCount !== 1 ? 's' : ''}</span>
                        {session.fillerCount != null && (
                          <span>{session.fillerCount} filler{session.fillerCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {session.audioUrl && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Listen back</span>
                      </div>
                      <audio controls src={session.audioUrl} className="w-full max-w-sm" />
                    </div>
                  )}

                  {session.transcript && (
                    <details className="mt-3 pt-3 border-t border-border">
                      <summary className="text-sm font-medium text-muted-foreground cursor-pointer">
                        Transcript
                      </summary>
                      <div className="mt-2 max-h-32 overflow-y-auto rounded bg-muted/50 p-2 text-sm text-foreground">
                        {session.transcript}
                      </div>
                    </details>
                  )}

                  {session.fillerBreakdown && session.fillerBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Filler report
                        {session.fillerCount != null && (
                          <span className="ml-2 font-normal">
                            ({session.fillerCount} total)
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {session.fillerBreakdown.map(({ word, count }) => (
                          <span
                            key={word}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {word}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {session.notes && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground italic">
                        "{session.notes}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
