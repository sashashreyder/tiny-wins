import { useCallback, useEffect, useRef, useState } from 'react';

export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function useCountdownTimer(totalSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    setPaused(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (paused) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return {
    secondsLeft,
    paused,
    isComplete: secondsLeft <= 0,
    pause,
    resume,
  };
}
