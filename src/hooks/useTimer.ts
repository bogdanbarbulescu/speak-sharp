import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerPhase } from '@/types/session';

interface UseTimerOptions {
  duration: number; // in seconds
  onComplete?: () => void;
  yellowThreshold?: number; // seconds remaining
  redThreshold?: number; // seconds remaining
}

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  phase: TimerPhase;
  overtime: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  formattedTime: string;
}

export function useTimer({
  duration,
  onComplete,
  yellowThreshold = 30,
  redThreshold = 10,
}: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [overtime, setOvertime] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const hasCompleted = useRef(false);

  const getPhase = useCallback(
    (remaining: number, ot: number): TimerPhase => {
      if (ot > 0) return 'overtime';
      if (remaining <= redThreshold) return 'red';
      if (remaining <= yellowThreshold) return 'yellow';
      return 'green';
    },
    [yellowThreshold, redThreshold]
  );

  const phase = getPhase(timeRemaining, overtime);

  const formatTime = useCallback((seconds: number, isOvertime: boolean = false): string => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    return isOvertime ? `+${formatted}` : formatted;
  }, []);

  const formattedTime = overtime > 0 ? formatTime(overtime, true) : formatTime(timeRemaining);

  const start = useCallback(() => {
    setIsRunning(true);
    hasCompleted.current = false;
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeRemaining(duration);
    setOvertime(0);
    hasCompleted.current = false;
  }, [duration, stop]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (!hasCompleted.current) {
            hasCompleted.current = true;
            onComplete?.();
          }
          setOvertime((ot) => ot + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onComplete]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(duration);
    setOvertime(0);
  }, [duration]);

  return {
    timeRemaining,
    isRunning,
    phase,
    overtime,
    start,
    stop,
    reset,
    formattedTime,
  };
}
