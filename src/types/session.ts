import type { FillerBreakdownItem } from '@/lib/fillerWords';

export type Difficulty = 'easy' | 'abstract' | 'controversial';
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Prompt {
  id: string;
  text: string;
  difficulty: Difficulty;
}

export interface Session {
  id: string;
  timestamp: string;
  promptText: string;
  promptDifficulty: Difficulty;
  targetDuration: 60 | 120;
  actualDuration: number;
  silenceCount: number;
  totalSilenceDuration: number;
  fillerCount?: number;
  transcript?: string;
  fillerBreakdown?: FillerBreakdownItem[];
  audioUrl?: string;
  selfReflection: {
    hadOpeningHook: boolean | null;
    hadConclusion: boolean | null;
  };
  ratings: {
    confidence: Rating;
    clarity: Rating;
    enjoyment: Rating;
  };
  notes?: string;
}

export interface UserSettings {
  timerDuration: 60 | 120;
  prepTimeEnabled: boolean;
  prepTimeDuration: 5 | 10;
  darkMode: boolean;
  difficultyFilter: 'all' | Difficulty;
  transcriptEnabled?: boolean;
}

export interface StreakData {
  currentStreak: number;
  lastPracticeDate: string;
  longestStreak: number;
}

export type TimerPhase = 'green' | 'yellow' | 'red' | 'overtime';

export const DEFAULT_SETTINGS: UserSettings = {
  timerDuration: 120,
  prepTimeEnabled: false,
  prepTimeDuration: 5,
  darkMode: false,
  difficultyFilter: 'all',
  transcriptEnabled: true,
};
