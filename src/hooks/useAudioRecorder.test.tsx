import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from './useAudioRecorder';

const fakeStream = {
  getTracks: () => [],
  getAudioTracks: () => [],
} as unknown as MediaStream;

function createMockMediaRecorder() {
  let onstop: (() => void) | null = null;
  const mock = {
    state: 'inactive',
    start: vi.fn(function (this: { state: string }) {
      this.state = 'recording';
    }),
    stop: vi.fn(function (this: { state: string }) {
      this.state = 'inactive';
      onstop?.();
    }),
    set onstop(fn: () => void) {
      onstop = fn;
    },
    get onstop() {
      return onstop;
    },
    ondataavailable: null as ((e: { data: { size: number } }) => void) | null,
  };
  return mock;
}

function createSyntheticResult(transcript: string, isFinal = true) {
  return {
    isFinal,
    length: 1,
    0: { transcript },
  };
}

function createSyntheticSpeechEvent(transcripts: string[]) {
  const results = transcripts.map((t) => createSyntheticResult(t));
  return {
    resultIndex: 0,
    results,
    length: results.length,
  } as unknown as SpeechRecognitionEvent;
}

describe('useAudioRecorder', () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;
  let MediaRecorderMock: ReturnType<typeof createMockMediaRecorder>;
  let mockRecognitionInstance: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  };

  beforeEach(() => {
    getUserMediaMock = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      writable: true,
    });

    MediaRecorderMock = createMockMediaRecorder();
    vi.stubGlobal('MediaRecorder', vi.fn(() => MediaRecorderMock));

    const urlMock = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };
    Object.defineProperty(window, 'URL', { configurable: true, writable: true, value: urlMock });
    vi.stubGlobal('URL', urlMock);

    vi.stubGlobal('AudioContext', vi.fn(() => ({
      createAnalyser: () => ({
        fftSize: 256,
        frequencyBinCount: 256,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn(),
      }),
      createMediaStreamSource: () => ({ connect: vi.fn() }),
      close: vi.fn(),
    })));

    mockRecognitionInstance = {
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onend: null,
      onerror: null,
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when SpeechRecognition is missing', () => {
    beforeEach(() => {
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = undefined;
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = undefined;
    });

    it('keeps transcript empty after start then stop', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.transcript).toBe('');
      expect(result.current.isRecording).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.transcript).toBe('');
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('when SpeechRecognition is present', () => {
    beforeEach(() => {
      const MockSR = vi.fn(() => mockRecognitionInstance);
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = MockSR;
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = MockSR;
    });

    it('exposes accumulated transcript after onresult then stop (transcript set in onend)', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.start();
      });

      expect(mockRecognitionInstance.start).toHaveBeenCalled();
      expect(result.current.transcript).toBe('');

      act(() => {
        const event = createSyntheticSpeechEvent(['um so like']);
        mockRecognitionInstance.onresult?.(event);
      });

      act(() => {
        result.current.stop();
      });

      act(() => {
        mockRecognitionInstance.onend?.();
      });

      expect(result.current.transcript).toBe('um so like');
    });

    it('accumulates multiple final results', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        mockRecognitionInstance.onresult?.(createSyntheticSpeechEvent(['first part']));
      });
      act(() => {
        mockRecognitionInstance.onresult?.(createSyntheticSpeechEvent(['second part']));
      });
      act(() => {
        result.current.stop();
      });
      act(() => {
        mockRecognitionInstance.onend?.();
      });

      expect(result.current.transcript).toBe('first part second part');
    });

    it('exposes getTranscript returning ref content', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        mockRecognitionInstance.onresult?.(createSyntheticSpeechEvent(['hello world']));
      });
      expect(result.current.getTranscript()).toBe('hello world');

      act(() => {
        result.current.stop();
      });
      act(() => {
        mockRecognitionInstance.onend?.();
      });
      expect(result.current.getTranscript()).toBe('hello world');
      expect(result.current.transcript).toBe('hello world');
    });

    it('exposes liveTranscript during recording', async () => {
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        mockRecognitionInstance.onresult?.(createSyntheticSpeechEvent(['um so like']));
      });
      expect(result.current.liveTranscript).toBe('um so like');
    });
  });
});
