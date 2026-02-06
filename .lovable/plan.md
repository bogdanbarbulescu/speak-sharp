

# Table Topics Training App — MVP Plan

## Product Vision
A mobile-first web app that gets nervous speakers practicing impromptu speeches in under 10 seconds. No accounts, no gimmicks—just deliberate practice with honest feedback.

---

## Core Training Flow

### 1. Start Screen (< 2 seconds to action)
- Large "Practice Now" button front and center
- Optional quick settings: difficulty tier, prep time toggle
- Dark mode toggle in corner
- No login, no onboarding walls

### 2. Prompt Delivery
- Random Table Topics question from curated bank (~150+ prompts)
- **Difficulty tiers:**
  - 🟢 **Easy** — Personal experience ("Describe your morning routine")
  - 🟡 **Abstract** — Conceptual ("What does success mean to you?")
  - 🔴 **Controversial** — Opinion-based ("Should remote work be permanent?")
- **Prep timer** — Optional 5–10 second countdown (configurable, off by default)
- One-tap "I'm Ready" to begin or auto-start after prep timer

### 3. Speaking Session
- Prominent countdown timer (1 or 2 minutes, user choice)
- **Visual time signals:**
  - 🟢 Green zone — Plenty of time
  - 🟡 Yellow zone — 30 seconds remaining
  - 🔴 Red zone — Final 10 seconds
  - ⚫ Overtime indicator (keeps counting if they run over)
- Large, readable timer with high contrast (accessibility-first)
- Recording indicator (pulsing dot)
- "Stop Early" option for failed attempts (no shame, just data)

### 4. Post-Speech Feedback
**Client-side analysis (no AI, no API):**
- ⏱️ **Duration accuracy** — "You spoke for 1:42. Target was 1:30–2:00 ✅"
- 🔇 **Silence detection** — "3 pauses detected (total 8 seconds)"
- Audio playback — Listen back to your response

**Self-reflection prompts (required for learning):**
- "Did you have a clear opening hook?" (Yes/No/Unsure)
- "Did you arrive at a conclusion?" (Yes/No/Unsure)

### 5. Reflection & Close
- **Self-ratings** (1–5 scale):
  - Confidence
  - Clarity
  - Enjoyment
- **Optional written note** — "What would you do differently?"
- "Practice Again" button → loops back to new prompt
- Session saved to localStorage

---

## Feature Set (MVP Only)

| Feature | Included | Rationale |
|---------|----------|-----------|
| Random prompt from curated bank | ✅ | Core functionality |
| Difficulty tiers | ✅ | Scaffolded learning |
| Configurable timer (1 or 2 min) | ✅ | Toastmasters standard |
| Visual time signals | ✅ | Builds time awareness |
| Browser audio recording | ✅ | Self-review is essential |
| Silence detection | ✅ | Client-side, no API needed |
| Duration accuracy | ✅ | Objective feedback |
| Self-reflection prompts | ✅ | Forces metacognition |
| Self-ratings | ✅ | Tracks subjective progress |
| Session history (localStorage) | ✅ | See patterns over time |
| Daily streak counter | ✅ | Simple accountability, not gamification |
| Dark mode | ✅ | Non-negotiable per brief |
| Filler word detection | ❌ | Requires transcription API (v2) |
| AI qualitative feedback | ❌ | Requires LLM (v2) |
| Account sync | ❌ | Adds friction (v2) |
| Question categories filter | ⚠️ | Stretch goal if time permits |

---

## User Flow Diagram

```
[Launch App]
    ↓
[Start Screen]
    ├── "Practice Now" → [Prompt Screen]
    └── Settings → [Timer length, Prep time toggle, Dark mode]
    
[Prompt Screen]
    ├── Shows random question + difficulty badge
    ├── Optional prep timer (5–10s countdown)
    └── "I'm Ready" → [Speaking Session]
    
[Speaking Session]
    ├── Timer counting down (green → yellow → red)
    ├── Recording active
    └── Timer ends OR "Stop" → [Feedback Screen]
    
[Feedback Screen]
    ├── Duration result
    ├── Silence summary
    ├── Audio playback
    ├── Self-reflection checkboxes
    └── "Continue" → [Reflection Screen]
    
[Reflection Screen]
    ├── Self-ratings (confidence, clarity, enjoyment)
    ├── Optional text reflection
    ├── "Save & Practice Again" → [Prompt Screen]
    └── "Done" → [History/Home]
    
[History Screen]
    ├── List of past sessions
    ├── Date, duration, ratings
    └── Streak counter
```

---

## Component Architecture

```
src/
├── pages/
│   ├── Index.tsx           # Home/Start screen
│   ├── Practice.tsx        # Prompt + Speaking + Feedback flow
│   └── History.tsx         # Session history view
├── components/
│   ├── Timer.tsx           # Countdown with color phases
│   ├── AudioRecorder.tsx   # Web Audio API recording
│   ├── PromptCard.tsx      # Displays the question
│   ├── FeedbackPanel.tsx   # Duration, silence, playback
│   ├── ReflectionForm.tsx  # Self-ratings and notes
│   ├── StreakCounter.tsx   # Daily streak display
│   └── Settings.tsx        # Timer length, prep toggle, theme
├── hooks/
│   ├── useTimer.ts         # Timer logic with phases
│   ├── useAudioRecorder.ts # MediaRecorder wrapper
│   ├── useSilenceDetection.ts # Analyser node for pauses
│   ├── useLocalStorage.ts  # Persistence helper
│   └── useStreak.ts        # Daily streak calculation
├── data/
│   └── prompts.ts          # Curated question bank
├── lib/
│   └── audioAnalysis.ts    # Client-side audio metrics
└── types/
    └── session.ts          # TypeScript interfaces
```

---

## Data Model (localStorage)

```typescript
interface Session {
  id: string;
  timestamp: Date;
  promptText: string;
  promptDifficulty: 'easy' | 'abstract' | 'controversial';
  targetDuration: 60 | 120; // seconds
  actualDuration: number; // seconds
  silenceCount: number;
  totalSilenceDuration: number; // seconds
  audioBlob?: Blob; // optional, may not persist all
  selfReflection: {
    hadOpeningHook: boolean | null;
    hadConclusion: boolean | null;
  };
  ratings: {
    confidence: 1 | 2 | 3 | 4 | 5;
    clarity: 1 | 2 | 3 | 4 | 5;
    enjoyment: 1 | 2 | 3 | 4 | 5;
  };
  notes?: string;
}

interface UserSettings {
  timerDuration: 60 | 120;
  prepTimeEnabled: boolean;
  prepTimeDuration: 5 | 10;
  darkMode: boolean;
  difficultyFilter: 'all' | 'easy' | 'abstract' | 'controversial';
}

interface StreakData {
  currentStreak: number;
  lastPracticeDate: string; // ISO date
  longestStreak: number;
}
```

---

## Design Principles

1. **Mobile-first responsive** — Touch-friendly buttons, readable timers at arm's length
2. **High contrast** — Green/yellow/red signals visible in any lighting
3. **Minimal cognitive load** — One clear action per screen
4. **Honest feedback** — No fake praise, no "Great job!" unless earned
5. **Respect nervousness** — Calm colors, no pressure UI, easy exit paths
6. **Dark mode default option** — Easy on eyes for evening practice

---

## Implementation Phases

### Phase 1: Core Loop (Days 1–2)
- Start screen with "Practice Now"
- Prompt display from curated bank (50 prompts minimum)
- Countdown timer with color phases
- Audio recording via MediaRecorder API

### Phase 2: Feedback & Reflection (Days 3–4)
- Duration accuracy display
- Basic silence detection (Web Audio AnalyserNode)
- Audio playback
- Self-reflection checkboxes
- Self-rating sliders

### Phase 3: Persistence & Polish (Days 5–6)
- localStorage session saving
- History view with session list
- Daily streak tracking
- Settings panel (timer length, prep toggle)
- Dark mode implementation

### Phase 4: Content & QA (Day 7)
- Full 150+ prompt bank across difficulty tiers
- Mobile responsiveness testing
- Accessibility review (contrast, focus states)
- Edge case handling (permission denied, no audio)

---

## Success Criteria

A nervous speaker can:
- ✅ Start practicing in under 10 seconds
- ✅ Complete a full training cycle in under 4 minutes
- ✅ Know exactly where they stand on time management
- ✅ Track their consistency over days/weeks
- ✅ Feel supported, not judged

A VP Education would:
- ✅ Recommend this to new members
- ✅ Trust the feedback is honest
- ✅ See it as a complement to club practice, not a replacement

