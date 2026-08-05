import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { formatCountdown, useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';

export type GentleTimerFinishReason = 'completed' | 'ended-early';

export type GentleTimerProps = {
  durationMinutes: number;
  title?: string;
  goal?: string;
  compact?: boolean;
  endLabel?: string;
  pauseLabel?: string;
  resumeLabel?: string;
  onFinish: (reason: GentleTimerFinishReason) => void;
  children?: ReactNode;
};

export function GentleTimer({
  durationMinutes,
  title,
  goal,
  compact = false,
  endLabel = 'End early',
  pauseLabel = 'Pause',
  resumeLabel = 'Resume',
  onFinish,
  children,
}: GentleTimerProps) {
  const theme = useAppTheme();
  const totalSeconds = durationMinutes * 60;
  const { secondsLeft, paused, pause, resume } = useCountdownTimer(totalSeconds);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
  }, [totalSeconds]);

  const finishOnce = useCallback(
    (reason: GentleTimerFinishReason) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish(reason);
    },
    [onFinish],
  );

  useEffect(() => {
    if (secondsLeft === 0 && !finishedRef.current) {
      finishOnce('completed');
    }
  }, [secondsLeft, finishOnce]);

  return (
    <GlassCard
      glow
      style={compact ? [styles.timerCard, styles.timerCardCompact] : styles.timerCard}>
      <Text style={[compact ? styles.timerCompact : styles.timer, { color: theme.text }]}>
        {formatCountdown(secondsLeft)}
      </Text>
      {title ? (
        <Text style={[compact ? styles.titleCompact : styles.focusTitle, { color: theme.textSecondary }]}>
          {title}
        </Text>
      ) : null}
      {goal && !compact ? (
        <Text style={{ color: theme.textMuted, marginBottom: spacing.md }}>Goal: {goal}</Text>
      ) : null}

      <View style={[styles.actionRow, compact ? styles.actionRowCompact : undefined]}>
        <GradientButton
          label={paused ? resumeLabel : pauseLabel}
          onPress={() => (paused ? resume() : pause())}
          variant="ghost"
          small
          style={{ flex: 1 }}
        />
        <GradientButton
          label={endLabel}
          onPress={() => finishOnce('ended-early')}
          small
          style={{ flex: 1 }}
        />
      </View>

      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  timerCard: { alignItems: 'center', paddingVertical: spacing.xl, width: '100%' },
  timerCardCompact: { paddingVertical: spacing.lg },
  timer: { fontSize: 64, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerCompact: { fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'], marginBottom: spacing.sm },
  focusTitle: { ...typography.h3, marginBottom: spacing.sm },
  titleCompact: { ...typography.body, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginBottom: spacing.sm },
  actionRowCompact: { marginTop: spacing.sm },
});
