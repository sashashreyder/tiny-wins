import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { formatCountdown, useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';

export type GentleTimerFinishReason = 'completed' | 'ended-early';
export type GentleTimerActionLayout = 'stretch' | 'centered' | 'stack';

export type GentleTimerProps = {
  durationMinutes: number;
  title?: string;
  goal?: string;
  compact?: boolean;
  endLabel?: string;
  pauseLabel?: string;
  resumeLabel?: string;
  header?: ReactNode;
  actionLayout?: GentleTimerActionLayout;
  cardStyle?: ViewStyle;
  showPause?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onFinish: (reason: GentleTimerFinishReason) => void;
  onEndRequest?: () => void;
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
  header,
  actionLayout = 'stretch',
  cardStyle,
  showPause = true,
  secondaryLabel,
  onSecondary,
  onFinish,
  onEndRequest,
  children,
}: GentleTimerProps) {
  const theme = useAppTheme();
  const totalSeconds = durationMinutes * 60;
  const { secondsLeft, paused, pause, resume } = useCountdownTimer(totalSeconds);
  const finishedRef = useRef(false);
  const compactControls = actionLayout !== 'stack';

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
      pause();
      finishOnce('completed');
    }
  }, [secondsLeft, finishOnce, pause]);

  const cardStyles: ViewStyle[] = [styles.timerCard];
  if (compact) cardStyles.push(styles.timerCardCompact);
  if (header) cardStyles.push(styles.timerCardSpacious);
  if (cardStyle) cardStyles.push(cardStyle);

  return (
    <GlassCard
      glow
      style={cardStyles}>
      {header ? <View style={styles.headerSlot}>{header}</View> : null}

      <Text
        style={[
          compact ? styles.timerCompact : styles.timer,
          header && !compact ? styles.timerDominant : null,
          { color: theme.text },
        ]}>
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

      <View
        style={[
          styles.actionRow,
          compact ? styles.actionRowCompact : null,
          actionLayout === 'centered' ? styles.actionRowCentered : null,
          actionLayout === 'stack' ? styles.actionRowStack : null,
        ]}>
        {showPause ? (
          <GradientButton
            label={paused ? resumeLabel : pauseLabel}
            onPress={() => (paused ? resume() : pause())}
            variant="ghost"
            small={compactControls}
            style={actionLayout === 'stack' ? styles.actionButtonStack : styles.actionButton}
          />
        ) : null}
        <GradientButton
          label={endLabel}
          onPress={() => {
            if (onEndRequest) {
              pause();
              onEndRequest();
              return;
            }
            finishOnce('ended-early');
          }}
          small={compactControls}
          style={actionLayout === 'stack' ? styles.actionButtonStack : styles.actionButton}
        />
        {secondaryLabel && onSecondary ? (
          <GradientButton
            label={secondaryLabel}
            onPress={() => {
              pause();
              onSecondary();
            }}
            variant="ghost"
            small={compactControls}
            style={actionLayout === 'stack' ? styles.actionButtonStack : styles.actionButton}
          />
        ) : null}
      </View>

      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  timerCard: { alignItems: 'center', paddingVertical: spacing.xl, width: '100%' },
  timerCardCompact: { paddingVertical: spacing.lg },
  timerCardSpacious: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerSlot: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  timer: { fontSize: 64, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerCompact: { fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'], marginBottom: spacing.sm },
  timerDominant: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  focusTitle: { ...typography.h3, marginBottom: spacing.sm },
  titleCompact: { ...typography.body, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.sm,
  },
  actionRowCompact: { marginTop: spacing.sm },
  actionRowCentered: {
    maxWidth: 280,
    width: '100%',
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  actionRowStack: {
    flexDirection: 'column',
    maxWidth: 280,
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  actionButtonStack: {
    width: '100%',
  },
});

