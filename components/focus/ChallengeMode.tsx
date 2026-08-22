import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { TagPill } from '@/components/design-system/Tags';
import {
  CHALLENGE_DURATION_DEFAULT,
  CHALLENGE_DURATION_MAX,
  CHALLENGE_DURATION_MIN,
  CHALLENGE_DURATION_OPTIONS,
  CHALLENGE_TASK_EXAMPLES,
  CHALLENGE_UNIT_EXAMPLES,
  countLabel,
  incrementNote,
  minutesLabel,
  parseChallengeMinutes,
  scoreWithLabel,
  speedRunSupportLine,
  suggestShorterDuration,
} from '@/data/challenge';
import { formatCountdown, useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { FocusResult } from '@/types';

type ChallengePhase = 'setup' | 'running' | 'early' | 'summary';

const SETUP_MAX_WIDTH = 640;
const WORKSPACE_MAX_WIDTH = 440;
const START_BUTTON_MAX_WIDTH = 320;
const DONE_BUTTON_MAX_WIDTH = 280;
const NARROW_BREAKPOINT = 700;
const SIDEBAR_WIDTH = 260;
const WIDE_SHELL = 900;
const ACTION_MAX = 280;

function elapsedFocusMinutes(startedAt: string | null): number {
  if (!startedAt) return 1;
  const ms = Date.now() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 1;
  return Math.max(1, Math.round(ms / 60000));
}

function ChallengeClock({
  durationMinutes,
  running,
  onComplete,
  onTick,
  color,
}: {
  durationMinutes: number;
  running: boolean;
  onComplete: () => void;
  onTick: (secondsLeft: number) => void;
  color: string;
}) {
  const { secondsLeft, paused, pause, resume } = useCountdownTimer(durationMinutes * 60);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (running) {
      if (paused) resume();
      return;
    }
    if (!paused) pause();
  }, [running, paused, pause, resume]);

  useEffect(() => {
    onTick(secondsLeft);
  }, [secondsLeft, onTick]);

  useEffect(() => {
    if (secondsLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      pause();
      onComplete();
    }
  }, [secondsLeft, onComplete, pause]);

  return (
    <Text
      style={[styles.timer, { color }]}
      accessibilityRole="text"
      accessibilityLabel={`Time remaining ${formatCountdown(secondsLeft)}`}>
      {formatCountdown(secondsLeft)}
    </Text>
  );
}

export function ChallengeMode({ onBack }: { onBack: () => void }) {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const completeFocus = useAppStore((s) => s.completeFocus);
  const isNarrow = viewportWidth < NARROW_BREAKPOINT;
  const contentWidth = viewportWidth >= WIDE_SHELL ? viewportWidth - SIDEBAR_WIDTH : viewportWidth;
  const compactLayout = contentWidth < 520;

  const [phase, setPhase] = useState<ChallengePhase>('setup');
  const [task, setTask] = useState('');
  const [unit, setUnit] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(CHALLENGE_DURATION_DEFAULT);
  const [durationCustom, setDurationCustom] = useState(false);
  const [customMinutesText, setCustomMinutesText] = useState('');
  const [completed, setCompleted] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [remainingSnapshot, setRemainingSnapshot] = useState(0);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [sparkle, setSparkle] = useState(false);
  const [pulseNote, setPulseNote] = useState<string | null>(null);
  const savedRef = useRef(false);
  const remainingRef = useRef(CHALLENGE_DURATION_DEFAULT * 60);
  const incrementSeed = useRef(0);
  const sparkleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countScale = useRef(new Animated.Value(1)).current;

  const taskLabel = task.trim();
  const unitLabel = countLabel(unit);
  const previewMinutes = durationCustom
    ? (parseChallengeMinutes(customMinutesText) ?? durationMinutes)
    : durationMinutes;
  const scoreLine = scoreWithLabel(completed, unit);
  const supportLine = speedRunSupportLine(completed, unit, durationMinutes);

  useEffect(() => {
    return () => {
      if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, []);

  const handleTick = useCallback((secondsLeft: number) => {
    remainingRef.current = secondsLeft;
  }, []);

  const handleTimerComplete = useCallback(() => {
    setPaused(false);
    setPhase('summary');
  }, []);

  const pulseCount = () => {
    countScale.setValue(1);
    Animated.sequence([
      Animated.timing(countScale, { toValue: 1.1, duration: 90, useNativeDriver: true }),
      Animated.timing(countScale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    setSparkle(true);
    incrementSeed.current += 1;
    setPulseNote(incrementNote(incrementSeed.current));
    if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    sparkleTimer.current = setTimeout(() => setSparkle(false), 420);
    noteTimer.current = setTimeout(() => setPulseNote(null), 700);
  };

  const sessionResult = (): FocusResult => {
    if (completed > 0) return 'progress';
    return 'started';
  };

  const resetSessionFields = (options?: { clearTask?: boolean }) => {
    savedRef.current = false;
    setCompleted(0);
    setStartedAt(null);
    setPaused(false);
    setRemainingSnapshot(0);
    setSparkle(false);
    setPulseNote(null);
    setDurationError(null);
    if (options?.clearTask) {
      setTask('');
      setUnit('');
      setDurationMinutes(CHALLENGE_DURATION_DEFAULT);
      setDurationCustom(false);
      setCustomMinutesText('');
    }
  };

  const goToSetup = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options);
    setPhase('setup');
  };

  const leaveChallenge = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options ?? { clearTask: true });
    setPhase('setup');
    onBack();
  };

  const finalizeSession = (result: FocusResult) => {
    if (savedRef.current) return;
    completeFocus(
      {
        title: taskLabel || 'Speed Run',
        duration: elapsedFocusMinutes(startedAt),
        result,
      },
      result,
    );
    savedRef.current = true;
  };

  const resolveSetup = (): number | null => {
    if (durationCustom) {
      const parsedMinutes = parseChallengeMinutes(customMinutesText);
      if (parsedMinutes == null) {
        setDurationError(`Choose ${CHALLENGE_DURATION_MIN}–${CHALLENGE_DURATION_MAX} minutes.`);
        return null;
      }
      setDurationMinutes(parsedMinutes);
      setDurationError(null);
      return parsedMinutes;
    }

    setDurationError(null);
    return durationMinutes;
  };

  const beginChallenge = (nextMinutes: number) => {
    savedRef.current = false;
    setDurationMinutes(nextMinutes);
    setCompleted(0);
    setPaused(false);
    remainingRef.current = nextMinutes * 60;
    setRemainingSnapshot(nextMinutes * 60);
    setStartedAt(new Date().toISOString());
    setPhase('running');
  };

  const startChallenge = () => {
    const nextMinutes = resolveSetup();
    if (nextMinutes == null) return;
    beginChallenge(nextMinutes);
  };

  const addOneDone = () => {
    if (phase !== 'running') return;
    setCompleted((n) => n + 1);
    pulseCount();
  };

  const undoLast = () => {
    setCompleted((n) => Math.max(n - 1, 0));
  };

  const requestEnd = () => {
    setRemainingSnapshot(remainingRef.current);
    setPaused(true);
    setPhase('early');
  };

  const keepPlaying = () => {
    setPhase('running');
    setPaused(false);
  };

  const finishToSummary = () => {
    setPaused(true);
    setPhase('summary');
  };

  const handleSummaryAction = (actionId: string) => {
    finalizeSession(sessionResult());
    if (actionId === 'another') {
      goToSetup();
      return;
    }
    if (actionId === 'again') {
      savedRef.current = false;
      beginChallenge(durationMinutes);
      return;
    }
    if (actionId === 'easier') {
      const shorter = suggestShorterDuration(durationMinutes);
      setDurationMinutes(shorter);
      const isPreset = CHALLENGE_DURATION_OPTIONS.includes(
        shorter as (typeof CHALLENGE_DURATION_OPTIONS)[number],
      );
      setDurationCustom(!isPreset);
      setCustomMinutesText(isPreset ? '' : String(shorter));
      goToSetup();
      return;
    }
    leaveChallenge({ clearTask: true });
  };

  const handleBack = () => {
    if (phase === 'summary') {
      handleSummaryAction('hub');
      return;
    }
    onBack();
  };

  const clockMounted = Boolean(startedAt) && (phase === 'running' || phase === 'early');
  const showZeroActions = completed === 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.shell}>
        <View style={[styles.inner, phase !== 'setup' ? styles.innerActive : null]}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back to focus tools"
            hitSlop={8}
            style={styles.internalBack}>
            <Text style={[styles.internalBackText, { color: theme.textSecondary }]}>
              ← Back to focus tools
            </Text>
          </Pressable>

          {phase === 'setup' ? (
            <>
              <Text style={[styles.eyebrow, { color: theme.textMuted }]}>SPEED RUN</Text>
              <Text style={[styles.lede, { color: theme.text }]}>
                Make a boring task into a tiny race against the clock.
              </Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Pick something repeatable and see how much you can get done before time runs out.
              </Text>

              <GlassCard>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  What are you working on?
                </Text>
                <TextInput
                  value={task}
                  onChangeText={setTask}
                  placeholder={CHALLENGE_TASK_EXAMPLES[0]}
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel="What are you working on?"
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  {CHALLENGE_TASK_EXAMPLES.slice(1).join(' · ')}
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  What are we counting?
                </Text>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  placeholder={CHALLENGE_UNIT_EXAMPLES[0]}
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel="What are we counting?"
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  {CHALLENGE_UNIT_EXAMPLES.slice(1).join(' · ')}
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  How long do you want to play?
                </Text>
                <View style={styles.pillRow}>
                  {CHALLENGE_DURATION_OPTIONS.map((minutes) => (
                    <TagPill
                      key={minutes}
                      label={`${minutes} min`}
                      selected={!durationCustom && durationMinutes === minutes}
                      onPress={() => {
                        setDurationMinutes(minutes);
                        setDurationCustom(false);
                        setCustomMinutesText('');
                        setDurationError(null);
                      }}
                    />
                  ))}
                  <TagPill
                    label="Custom"
                    selected={durationCustom}
                    onPress={() => {
                      setDurationCustom(true);
                      setCustomMinutesText(String(durationMinutes));
                      setDurationError(null);
                    }}
                  />
                </View>
                {durationCustom ? (
                  <TextInput
                    value={customMinutesText}
                    onChangeText={(value) => {
                      setCustomMinutesText(value.replace(/[^0-9]/g, '').slice(0, 2));
                      setDurationError(null);
                    }}
                    keyboardType="number-pad"
                    placeholder="Minutes"
                    placeholderTextColor={theme.textMuted}
                    accessibilityLabel="Custom minutes"
                    style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                  />
                ) : null}
                {durationError ? (
                  <Text style={[styles.errorText, { color: theme.accent }]}>{durationError}</Text>
                ) : (
                  <Text style={[styles.hint, { color: theme.textMuted }]}>
                    One short Speed Run. Default is {CHALLENGE_DURATION_DEFAULT} min.
                  </Text>
                )}
              </GlassCard>

              <View
                style={[
                  styles.preview,
                  { borderColor: theme.surfaceBorder, backgroundColor: theme.surface },
                ]}>
                <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Your Speed Run</Text>
                <Text style={[styles.previewText, { color: theme.text }]}>
                  {taskLabel || 'This Speed Run'}
                </Text>
                <Text style={[styles.previewMeta, { color: theme.textSecondary }]}>
                  {minutesLabel(previewMinutes)}
                </Text>
                {unitLabel ? (
                  <>
                    <Text style={[styles.previewLabel, styles.previewLabelSpaced, { color: theme.textMuted }]}>
                      Counting:
                    </Text>
                    <Text style={[styles.previewText, { color: theme.text }]}>{unitLabel}</Text>
                  </>
                ) : null}
              </View>

              <View style={[styles.startWrap, isNarrow && styles.startWrapMobile]}>
                <GradientButton
                  label="Start Speed Run"
                  onPress={startChallenge}
                  style={styles.startButton}
                />
              </View>
            </>
          ) : null}

          {clockMounted && startedAt ? (
            <>
              <View
                style={phase === 'early' ? styles.hiddenClock : styles.workspace}
                pointerEvents={phase === 'early' ? 'none' : 'auto'}
                accessibilityElementsHidden={phase === 'early'}
                importantForAccessibility={phase === 'early' ? 'no-hide-descendants' : 'auto'}>
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>SPEED RUN</Text>
                {taskLabel ? (
                  <Text
                    style={[styles.taskLine, { color: theme.textSecondary }]}
                    numberOfLines={2}>
                    {taskLabel}
                  </Text>
                ) : null}
                <View style={styles.metrics}>
                  <ChallengeClock
                    key={startedAt}
                    durationMinutes={durationMinutes}
                    running={phase === 'running' && !paused}
                    onComplete={handleTimerComplete}
                    onTick={handleTick}
                    color={theme.text}
                  />
                  {phase === 'running' && paused ? (
                    <Text style={[styles.pausedNote, { color: theme.textMuted }]}>Paused</Text>
                  ) : null}

                  {phase === 'running' ? (
                    <>
                      <Animated.View style={{ transform: [{ scale: countScale }] }}>
                        <Text
                          style={[styles.score, { color: theme.text }]}
                          accessibilityRole="text"
                          accessibilityLabel={scoreLine}>
                          {completed}
                          {sparkle ? ' ✨' : ''}
                        </Text>
                      </Animated.View>
                      {unitLabel ? (
                        <Text style={[styles.unitLine, { color: theme.textSecondary }]}>
                          {unitLabel}
                        </Text>
                      ) : (
                        <Text style={[styles.unitLine, { color: theme.textSecondary }]}>done</Text>
                      )}
                      {pulseNote ? (
                        <Text style={[styles.pulseNote, { color: theme.accent }]}>{pulseNote}</Text>
                      ) : (
                        <View style={styles.pulseNoteSpacer} />
                      )}

                      <View style={[styles.doneWrap, compactLayout && styles.doneWrapMobile]}>
                        <GradientButton
                          label="+ 1 done"
                          onPress={addOneDone}
                          accessibilityLabel="Add one done"
                          style={styles.doneButton}
                        />
                      </View>
                    </>
                  ) : null}
                </View>

                {phase === 'running' ? (
                  <View style={styles.secondaryRow}>
                    <Pressable
                      onPress={undoLast}
                      disabled={completed <= 0}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: completed <= 0 }}
                      accessibilityLabel="Undo last point"
                      hitSlop={8}
                      style={styles.secondaryLink}>
                      <Text
                        style={[
                          styles.secondaryText,
                          { color: completed <= 0 ? theme.textMuted : theme.textSecondary },
                        ]}>
                        Undo
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPaused((value) => !value)}
                      accessibilityRole="button"
                      accessibilityLabel={paused ? 'Resume Speed Run' : 'Pause Speed Run'}
                      hitSlop={8}
                      style={styles.secondaryLink}>
                      <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                        {paused ? 'Resume' : 'Pause'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={requestEnd}
                      accessibilityRole="button"
                      accessibilityLabel="End Speed Run"
                      hitSlop={8}
                      style={styles.secondaryLink}>
                      <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                        End Speed Run
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {phase === 'early' ? (
                <View style={styles.panel}>
                  <Text style={[styles.headline, { color: theme.text }]}>Done for now?</Text>
                  <Text style={[styles.summaryLine, { color: theme.text }]}>{scoreLine}</Text>
                  <Text style={[styles.sub, { color: theme.textSecondary }]}>
                    {formatCountdown(remainingSnapshot)} remaining
                  </Text>
                  <View style={styles.actionStack}>
                    <GradientButton
                      label="Finish for now"
                      onPress={finishToSummary}
                      small
                      style={styles.actionButton}
                    />
                    <GradientButton
                      label="Keep going"
                      onPress={keepPlaying}
                      variant="ghost"
                      small
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              ) : null}
            </>
          ) : null}

          {phase === 'summary' ? (
            <View style={styles.panel}>
              <Text style={[styles.headline, { color: theme.text }]}>
                {completed === 0 ? 'Speed Run complete.' : 'Speed Run complete ✨'}
              </Text>
              {completed > 0 ? (
                <Text style={[styles.outcomeLine, { color: theme.text }]}>{scoreLine}</Text>
              ) : (
                <Text style={[styles.sub, { color: theme.textSecondary }]}>
                  Nothing got counted this round.
                </Text>
              )}

              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Task</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {taskLabel || 'This Speed Run'}
              </Text>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Time</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {minutesLabel(durationMinutes)}
              </Text>
              {completed > 0 ? (
                <Text style={[styles.supportLine, { color: theme.textSecondary }]}>{supportLine}</Text>
              ) : (
                <View style={styles.supportSpacer} />
              )}

              <View style={styles.actionStack}>
                {showZeroActions ? (
                  <>
                    <GradientButton
                      label="Try again"
                      onPress={() => handleSummaryAction('again')}
                      small
                      style={styles.actionButton}
                    />
                    <GradientButton
                      label="Make it easier"
                      onPress={() => handleSummaryAction('easier')}
                      variant="ghost"
                      small
                      style={styles.actionButton}
                    />
                    <GradientButton
                      label="Finish for now"
                      onPress={() => handleSummaryAction('finish')}
                      variant="ghost"
                      small
                      style={styles.actionButton}
                    />
                  </>
                ) : (
                  <>
                    <GradientButton
                      label="Finish for now"
                      onPress={() => handleSummaryAction('finish')}
                      small
                      style={styles.actionButton}
                    />
                    <GradientButton
                      label="Try another Speed Run"
                      onPress={() => handleSummaryAction('another')}
                      variant="ghost"
                      small
                      style={styles.actionButton}
                    />
                    <Pressable
                      onPress={() => handleSummaryAction('hub')}
                      accessibilityRole="link"
                      accessibilityLabel="Back to focus tools"
                      style={styles.secondaryLink}>
                      <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                        Back to focus tools
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  shell: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: SETUP_MAX_WIDTH,
    alignSelf: 'center',
  },
  innerActive: {
    maxWidth: WORKSPACE_MAX_WIDTH,
  },
  internalBack: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  internalBackText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  lede: { ...typography.h2, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  label: { ...typography.caption, marginBottom: 4 },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  errorText: { ...typography.bodySmall, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  preview: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.xs,
  },
  previewLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  previewLabelSpaced: {
    marginTop: spacing.sm,
  },
  previewText: {
    ...typography.body,
    fontWeight: '600',
  },
  previewMeta: {
    ...typography.body,
  },
  startWrap: {
    width: '100%',
    minWidth: 240,
    maxWidth: START_BUTTON_MAX_WIDTH,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  startWrapMobile: {
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  startButton: {
    width: '100%',
  },
  workspace: {
    width: '100%',
    alignItems: 'center',
  },
  metrics: {
    width: '100%',
    alignItems: 'center',
  },
  taskLine: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  pausedNote: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  score: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    marginTop: spacing.md,
  },
  unitLine: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  pulseNote: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
    minHeight: 20,
  },
  pulseNoteSpacer: {
    minHeight: 20,
    marginTop: spacing.xs,
  },
  doneWrap: {
    width: '100%',
    maxWidth: DONE_BUTTON_MAX_WIDTH,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  doneWrapMobile: {
    maxWidth: '100%',
  },
  doneButton: {
    width: '100%',
    minHeight: 60,
  },
  actionStack: {
    width: '100%',
    maxWidth: ACTION_MAX,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  secondaryRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  secondaryLink: {
    paddingVertical: spacing.xs,
  },
  secondaryText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  panel: {
    width: '100%',
  },
  hiddenClock: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
  summaryLine: {
    ...typography.h2,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xs,
  },
  outcomeLine: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  metaLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
  metaValue: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportLine: {
    ...typography.body,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  supportSpacer: {
    marginBottom: spacing.lg,
  },
});
