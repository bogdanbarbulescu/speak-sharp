import { useState, useRef, useCallback, useEffect } from 'react';

interface SilenceData {
  count: number;
  totalDuration: number;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
  silenceData: SilenceData;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

const SILENCE_THRESHOLD = 0.01;
const SILENCE_MIN_DURATION = 500; // ms

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [silenceData, setSilenceData] = useState<SilenceData>({ count: 0, totalDuration: 0 });
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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

  const start = useCallback(async () => {
    try {
      setError(null);
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
      setIsRecording(true);

      // Start audio analysis
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access to record.');
      console.error('Error accessing microphone:', err);
    }
  }, [analyzeAudio]);

  const stop = useCallback(() => {
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
    stop();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setSilenceData({ count: 0, totalDuration: 0 });
    setError(null);
  }, [audioUrl, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    error,
    start,
    stop,
    reset,
  };
}
