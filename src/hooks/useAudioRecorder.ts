import { useState, useRef, useCallback, useEffect } from 'react';

interface SilenceData {
  count: number;
  totalDuration: number;
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
  silenceData: SilenceData;
  transcript: string;
  /** Live transcript including interim results during recording */
  liveTranscript: string;
  transcriptError: string | null;
  error: string | null;
  /** True if Web Speech API (SpeechRecognition) is available in this browser (Chrome/Edge). */
  speechRecognitionSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  /** Read current transcript from ref (stable for session save) */
  getTranscript: () => string;
}

const SILENCE_THRESHOLD = 0.01;
const SILENCE_MIN_DURATION = 500; // ms
const RECOGNITION_RESTART_DELAY_MS = 300;

export interface UseAudioRecorderOptions {
  /** When false, speech recognition is not started (no transcript/fillers, no start/stop sounds). Default true. */
  transcriptEnabled?: boolean;
}

export function useAudioRecorder(options?: UseAudioRecorderOptions): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [silenceData, setSilenceData] = useState<SilenceData>({ count: 0, totalDuration: 0 });
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcriptEnabledRef = useRef(options?.transcriptEnabled !== false);
  transcriptEnabledRef.current = options?.transcriptEnabled !== false;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const transcriptFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const silenceStartRef = useRef<number | null>(null);
  const silenceCountRef = useRef(0);
  const silenceDurationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

    const now = Date.now();

    if (average < SILENCE_THRESHOLD) {
      // Silence detected
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now;
      }
    } else {
      // Sound detected
      if (silenceStartRef.current !== null) {
        const silenceDuration = now - silenceStartRef.current;
        if (silenceDuration >= SILENCE_MIN_DURATION) {
          silenceCountRef.current += 1;
          silenceDurationRef.current += silenceDuration;
        }
        silenceStartRef.current = null;
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isRecording]);

  const isRecordingRef = useRef(false);

  const start = useCallback(async () => {
    try {
      setError(null);
      setTranscriptError(null);
      transcriptRef.current = [];
      interimRef.current = '';
      setLiveTranscript('');
      chunksRef.current = [];
      silenceCountRef.current = 0;
      silenceDurationRef.current = 0;
      silenceStartRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
        setSilenceData({
          count: silenceCountRef.current,
          totalDuration: Math.round(silenceDurationRef.current / 1000),
        });
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      isRecordingRef.current = true;
      setIsRecording(true);

      // Start speech recognition (Web Speech API) in parallel for transcript, only when enabled
      const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI && transcriptEnabledRef.current) {
        const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0]?.transcript?.trim() ?? '';
            if (result.isFinal && text) {
              transcriptRef.current.push(text);
            } else if (text) {
              interim = text;
            }
          }
          interimRef.current = interim;
          const live = [...transcriptRef.current, interim].filter(Boolean).join(' ');
          setLiveTranscript(live);
        };
        recognition.onend = () => {
          if (isRecordingRef.current && speechRecognitionRef.current) {
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              recognitionRestartTimeoutRef.current = null;
              try {
                speechRecognitionRef.current?.start();
              } catch {
                // already started or stopped
              }
            }, RECOGNITION_RESTART_DELAY_MS);
          } else {
            // Stopping: commit final transcript (onresult may have fired one more time after stop())
            setTranscript(transcriptRef.current.filter(Boolean).join(' '));
          }
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            setTranscriptError('Speech recognition failed.');
          }
        };
        speechRecognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          setTranscriptError('Speech recognition could not start.');
          speechRecognitionRef.current = null;
        }
      }

      // Start audio analysis
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access to record.');
      console.error('Error accessing microphone:', err);
    }
  }, [analyzeAudio]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;

    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }

    if (transcriptFallbackTimeoutRef.current) {
      clearTimeout(transcriptFallbackTimeoutRef.current);
      transcriptFallbackTimeoutRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      // Transcript is set in recognition.onend (after final onresult). Fallback if onend never fires.
      transcriptFallbackTimeoutRef.current = setTimeout(() => {
        transcriptFallbackTimeoutRef.current = null;
        setTranscript(transcriptRef.current.filter(Boolean).join(' '));
        speechRecognitionRef.current = null;
      }, 150);
    } else {
      speechRecognitionRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }
    if (transcriptFallbackTimeoutRef.current) {
      clearTimeout(transcriptFallbackTimeoutRef.current);
      transcriptFallbackTimeoutRef.current = null;
    }
    stop();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setSilenceData({ count: 0, totalDuration: 0 });
    setTranscript('');
    setLiveTranscript('');
    setTranscriptError(null);
    transcriptRef.current = [];
    interimRef.current = '';
    setError(null);
  }, [audioUrl, stop]);

  const getTranscript = useCallback(() => {
    return transcriptRef.current.filter(Boolean).join(' ');
  }, []);

  const speechRecognitionSupported =
    typeof (window.SpeechRecognition ?? window.webkitSpeechRecognition) === 'function';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current);
      }
      if (transcriptFallbackTimeoutRef.current) {
        clearTimeout(transcriptFallbackTimeoutRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  return {
    isRecording,
    isPaused,
    audioUrl,
    audioBlob,
    duration,
    silenceData,
    transcript,
    liveTranscript,
    transcriptError,
    error,
    speechRecognitionSupported,
    start,
    stop,
    reset,
    getTranscript,
  };
}
