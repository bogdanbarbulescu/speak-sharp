import { cn } from '@/lib/utils';
import { TimerPhase } from '@/types/session';

interface TimerProps {
  formattedTime: string;
  phase: TimerPhase;
  isRunning: boolean;
  className?: string;
}

const phaseStyles: Record<TimerPhase, string> = {
  green: 'text-timer-green border-timer-green',
  yellow: 'text-timer-yellow border-timer-yellow',
  red: 'text-timer-red border-timer-red animate-pulse',
  overtime: 'text-timer-overtime border-timer-overtime',
};

const phaseBackgrounds: Record<TimerPhase, string> = {
  green: 'bg-timer-green/10',
  yellow: 'bg-timer-yellow/10',
  red: 'bg-timer-red/10',
  overtime: 'bg-timer-overtime/10',
};

export function Timer({ formattedTime, phase, isRunning, className }: TimerProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full border-4 transition-colors duration-300',
        'w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72',
        phaseStyles[phase],
        phaseBackgrounds[phase],
        className
      )}
    >
      <span
        className={cn(
          'font-mono text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight',
          phaseStyles[phase].split(' ')[0] // Only text color
        )}
      >
        {formattedTime}
      </span>
      
      {isRunning && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-background px-2 py-1 rounded-full shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">REC</span>
        </div>
      )}
    </div>
  );
}
