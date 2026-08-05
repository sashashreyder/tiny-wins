import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { formatStopwatchTime } from '@/data/messageLoop';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';

export type GentleStopwatchProps = {
  title?: string;
  runKey: number;
  onFinish: (elapsedSeconds: number) => void;
  onCancel?: () => void;
  finishLabel?: string;
  pauseLabel?: string;
  resumeLabel?: string;
  cancelLabel?: string;
};

export function GentleStopwatch({
  title,
  runKey,
  onFinish,
  onCancel,
  finishLabel = 'Reply sent / loop closed',
  pauseLabel = 'Pause',
  resumeLabel = 'Resume',
  cancelLabel = 'Cancel without saving',
}: GentleStopwatchProps) {
  const theme = useAppTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const readElapsed = useCallback(() => {
    if (startedAtRef.current === null) {
      return accumulatedRef.current;
    }
    const runningMs = Date.now() - startedAtRef.current;
    return accumulatedRef.current + Math.max(0, Math.floor(runningMs / 1000));
  }, []);

  const syncDisplay = useCallback(() => {
    setElapsedSeconds(readElapsed());
  }, [readElapsed]);

  const startTicking = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(readElapsed());
    }, 250);
  }, [clearTick, readElapsed]);

  const resetRun = useCallback(() => {
    clearTick();
    accumulatedRef.current = 0;
    startedAtRef.current = Date.now();
    finishedRef.current = false;
    setFinished(false);
    setPaused(false);
    setElapsedSeconds(0);
    startTicking();
  }, [clearTick, startTicking]);

  useEffect(() => {
    resetRun();
    return () => {
      clearTick();
    };
  }, [runKey, resetRun, clearTick]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (finishedRef.current || paused) return;
      if (nextState === 'active') {
        syncDisplay();
        if (!intervalRef.current && startedAtRef.current !== null) {
          startTicking();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [paused, startTicking, syncDisplay]);

  const pause = () => {
    if (finishedRef.current || paused) return;
    accumulatedRef.current = readElapsed();
    startedAtRef.current = null;
    clearTick();
    setPaused(true);
    setElapsedSeconds(accumulatedRef.current);
  };

  const resume = () => {
    if (finishedRef.current || !paused) return;
    startedAtRef.current = Date.now();
    setPaused(false);
    startTicking();
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const total = readElapsed();
    accumulatedRef.current = total;
    startedAtRef.current = null;
    clearTick();
    setFinished(true);
    setPaused(true);
    setElapsedSeconds(total);
    onFinish(total);
  };

  const cancel = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTick();
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    setFinished(true);
    setPaused(true);
    setElapsedSeconds(0);
    onCancel?.();
  };

  return (
    <GlassCard glow style={styles.card}>
      <Text style={[styles.timer, { color: theme.text }]}>
        {formatStopwatchTime(elapsedSeconds)}
      </Text>
      {title ? (
        <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      ) : null}
      <Text style={[styles.quietLine, { color: theme.textMuted }]}>
        The clock measures the task, not your worth.
      </Text>

      <View style={styles.actionRow}>
        <GradientButton
          label={paused && !finished ? resumeLabel : pauseLabel}
          onPress={() => {
            if (finished) return;
            if (paused) resume();
            else pause();
          }}
          variant="ghost"
          small
          style={{ flex: 1 }}
        />
        <GradientButton
          label={finishLabel}
          onPress={finish}
          small
          style={{ flex: 1 }}
        />
      </View>

      {onCancel ? (
        <GradientButton
          label={cancelLabel}
          onPress={cancel}
          variant="ghost"
          small
          style={styles.cancelBtn}
        />
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    width: '100%',
  },
  timer: {
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  quietLine: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.sm,
  },
  cancelBtn: {
    width: '100%',
  },
});
