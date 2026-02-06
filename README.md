# Speak Sharp

A mobile-friendly web app for practicing impromptu speaking with Table Topics–style prompts. No account required—just open the app, get a random question, and speak against a timer while being recorded.

**Live app:** [https://bogdanbarbulescu.github.io/speak-sharp/](https://bogdanbarbulescu.github.io/speak-sharp/)

## Features

- **Random prompts** by difficulty (easy, abstract, controversial)
- **Configurable timer** (1 or 2 minutes) with green / yellow / red phases and overtime
- **Optional prep countdown** (5 or 10 seconds) with “Skip & Start Now”
- **Browser recording** with listen-back during the session
- **Feedback:** duration vs target, pause count, total silence (pauses &gt; 0.5 s), and **filler word count** (um, uh, like, etc.) from live transcript
- **Self-reflection:** opening hook and conclusion (answer or skip), then ratings (confidence, clarity, enjoyment) and optional notes
- **History** with metadata and **audio playback for the last 3 sessions**
- **Daily streak** from practice days (shown on home and history)
- **Dark mode** toggle
- All data in **localStorage** (no backend)

## Run locally

```bash
# Install dependencies
npm install

# Start dev server (default: http://localhost:8080)
npm run dev
```

Open **http://localhost:8080/speak-sharp/** so the app’s base path matches the built version.

## Browser support

Filler word detection uses the **Web Speech API** (SpeechRecognition). It works best in **Chrome and Edge**; Safari and Firefox have limited or no support. When unsupported, the app still works but the filler count is omitted or zero.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start Vite dev server    |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint               |
| `npm run test` | Run Vitest               |

## Tech stack

- **React 18** + **TypeScript**
- **Vite** — build and dev server
- **React Router** — client-side routes
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **localStorage** — settings and session history (no backend)

## License

Private / unlicensed.
