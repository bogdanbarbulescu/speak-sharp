import { useMemo } from 'react';
import { Session } from '@/types/session';

/** Format a date or ISO string to local YYYY-MM-DD for calendar-day comparison. */
function toLocalDateKey(t: string | Date): string {
  const d = typeof t === 'string' ? new Date(t) : t;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Previous calendar day in local time. */
function prevDay(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return toLocalDateKey(d);
}

/** Next calendar day in local time. */
function nextDay(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return toLocalDateKey(d);
}

export interface UseStreakReturn {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
}

/**
 * Compute daily practice streak from session timestamps (local calendar days).
 * Current streak = consecutive days including the most recent practice day (0 if last practice was not today or yesterday).
 */
export function useStreak(sessions: Session[]): UseStreakReturn {
  return useMemo(() => {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
    }

    const dateSet = new Set(sessions.map((s) => toLocalDateKey(s.timestamp)));
    const sortedDates = [...dateSet].sort();

    const today = toLocalDateKey(new Date());
    const yesterday = prevDay(today);
    const mostRecent = sortedDates[sortedDates.length - 1];

    // Current streak: only counts if most recent practice is today or yesterday
    let currentStreak = 0;
    if (mostRecent === today || mostRecent === yesterday) {
      let check = mostRecent;
      while (dateSet.has(check)) {
        currentStreak++;
        check = prevDay(check);
      }
    }

    // Longest streak: longest run of consecutive calendar days (ascending order)
    let longestStreak = 0;
    let run = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      if (sortedDates[i] === nextDay(sortedDates[i - 1])) {
        run++;
      } else {
        longestStreak = Math.max(longestStreak, run);
        run = 1;
      }
    }
    longestStreak = Math.max(longestStreak, run);

    return {
      currentStreak,
      longestStreak,
      lastPracticeDate: mostRecent,
    };
  }, [sessions]);
}
