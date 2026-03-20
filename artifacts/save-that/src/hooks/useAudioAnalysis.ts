import { useRef, useState, useEffect, useCallback } from "react";

const NUM_BARS = 480;
const UPDATE_INTERVAL_MS = 125;

export function useAudioAnalysis(stream: MediaStream | null, enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioData, setAudioData] = useState<number[]>(new Array(NUM_BARS).fill(0));

  const setup = useCallback(() => {
    if (!stream || !enabled) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const freqData = new Uint8Array(analyser.frequencyBinCount);

      intervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(freqData);
        const sampleRate = ctx.sampleRate;
        const binHz = sampleRate / analyser.fftSize;
        const minBin = Math.floor(200 / binHz);
        const maxBin = Math.min(Math.floor(8000 / binHz), freqData.length - 1);
        const rangeSize = maxBin - minBin;

        const value =
          rangeSize > 0
            ? freqData.slice(minBin, maxBin + 1).reduce((a, b) => a + b, 0) /
              rangeSize /
              255
            : 0;

        setAudioData((prev) => {
          const next = [...prev.slice(1), value];
          return next;
        });
      }, UPDATE_INTERVAL_MS);
    } catch {
      // Audio analysis not available
    }
  }, [stream, enabled]);

  const teardown = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    if (enabled && stream) {
      setup();
    } else {
      teardown();
    }
    return teardown;
  }, [stream, enabled, setup, teardown]);

  return { audioData, numBars: NUM_BARS };
}
