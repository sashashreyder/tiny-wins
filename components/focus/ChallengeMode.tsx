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
  CHALLENGE_PRESETS,
  CHALLENGE_TARGET_DEFAULT,
  CHALLENGE_TARGET_MAX,
  CHALLENGE_TARGET_MIN,
  CHALLENGE_TASK_EXAMPLES,
  CHALLENGE_UNIT_EXAMPLES,
  challengePreview,
  challengeSupportLine,
  challengeTimerHeadline,
  challengeTimerSupport,
  clampChallengeCount,
  incrementNote,
  matchingPreset,
  minutesLabel,
  parseChallengeCount,
  parseChallengeMinutes,
  suggestSmallerChallenge,
  unitScoreLabel,
} from '@/data/challenge';
import { formatCountdown, useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
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
  const [targetText, setTargetText] = useState(String(CHALLENGE_TARGET_DEFAULT));
  const [target, setTarget] = useState(CHALLENGE_TARGET_DEFAULT);
  const [durationMinutes, setDurationMinutes] = useState(CHALLENGE_DURATION_DEFAULT);
  const [durationCustom, setDurationCustom] = useState(false);
  const [customMinutesText, setCustomMinutesText] = useState('');
  const [completed, setCompleted] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const [endedByTimer, setEndedByTimer] = useState(false);
  const [remainingSnapshot, setRemainingSnapshot] = useState(0);
  const [targetError, setTargetError] = useState<string | null>(null);
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
  const unitLabel = unit.trim();
  const reachedTarget = completed >= target && target > 0;
  const showTargetHit = phase === 'running' && reachedTarget && !keepGoing;
  const selectedPreset = durationCustom ? null : matchingPreset(target, durationMinutes);
  const previewTarget = parseChallengeCount(targetText) ?? target;
  const previewMinutes = durationCustom
    ? (parseChallengeMinutes(customMinutesText) ?? durationMinutes)
    : durationMinutes;
  const preview = challengePreview(previewTarget, unitLabel, previewMinutes);
  const scoreUnit = unitScoreLabel(unitLabel, completed);

  useEffect(() => {
    return () => {
      if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, []);

  useEffect(() => {
    if (completed < target) setKeepGoing(false);
  }, [completed, target]);

  const handleTick = useCallback((secondsLeft: number) => {
    remainingRef.current = secondsLeft;
  }, []);

  const handleTimerComplete = useCallback(() => {
    setPaused(false);
    setEndedByTimer(true);
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
    if (completed >= target && target > 0) return 'finished';
    if (completed > 0) return 'progress';
    return 'started';
  };

  const resetSessionFields = (options?: { clearTask?: boolean }) => {
    savedRef.current = false;
    setCompleted(0);
    setStartedAt(null);
    setPaused(false);
    setKeepGoing(false);
    setEndedByTimer(false);
    setRemainingSnapshot(0);
    setSparkle(false);
    setPulseNote(null);
    setTargetError(null);
    setDurationError(null);
    if (options?.clearTask) {
      setTask('');
      setUnit('');
      setTarget(CHALLENGE_TARGET_DEFAULT);
      setTargetText(String(CHALLENGE_TARGET_DEFAULT));
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
        title: taskLabel || 'Challenge',
        duration: elapsedFocusMinutes(startedAt),
        result,
      },
      result,
    );
    savedRef.current = true;
  };

  const resolveSetup = (): { nextTarget: number; nextMinutes: number } | null => {
    const parsedTarget = parseChallengeCount(targetText);
    if (parsedTarget == null) {
      setTargetError(`Choose a number from ${CHALLENGE_TARGET_MIN} to ${CHALLENGE_TARGET_MAX}.`);
      return null;
    }

    if (durationCustom) {
      const parsedMinutes = parseChallengeMinutes(customMinutesText);
      if (parsedMinutes == null) {
        setDurationError(`Choose ${CHALLENGE_DURATION_MIN}–${CHALLENGE_DURATION_MAX} minutes.`);
        return null;
      }
      setDurationMinutes(parsedMinutes);
      setTargetError(null);
      setDurationError(null);
      setTarget(parsedTarget);
      return { nextTarget: parsedTarget, nextMinutes: parsedMinutes };
    }

    setTargetError(null);
    setDurationError(null);
    setTarget(parsedTarget);
    return { nextTarget: parsedTarget, nextMinutes: durationMinutes };
  };

  const beginChallenge = (nextTarget: number, nextMinutes: number) => {
    savedRef.current = false;
    setTarget(nextTarget);
    setDurationMinutes(nextMinutes);
    setCompleted(0);
    setPaused(false);
    setKeepGoing(false);
    setEndedByTimer(false);
    remainingRef.current = nextMinutes * 60;
    setRemainingSnapshot(nextMinutes * 60);
    setStartedAt(new Date().toISOString());
    setPhase('running');
  };

  const startChallenge = () => {
    const resolved = resolveSetup();
    if (!resolved) return;
    beginChallenge(resolved.nextTarget, resolved.nextMinutes);
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
    setEndedByTimer(false);
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
      beginChallenge(target, durationMinutes);
      return;
    }
    if (actionId === 'smaller') {
      const smaller = suggestSmallerChallenge(target, durationMinutes);
      setTarget(smaller.target);
      setTargetText(String(smaller.target));
      setDurationMinutes(smaller.minutes);
      const isPreset = CHALLENGE_DURATION_OPTIONS.includes(
        smaller.minutes as (typeof CHALLENGE_DURATION_OPTIONS)[number],
      );
      setDurationCustom(!isPreset);
      setCustomMinutesText(isPreset ? '' : String(smaller.minutes));
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

  const applyPreset = (presetTarget: number, presetMinutes: number) => {
    setTarget(presetTarget);
    setTargetText(String(presetTarget));
    setDurationMinutes(presetMinutes);
    setDurationCustom(false);
    setCustomMinutesText('');
    setTargetError(null);
    setDurationError(null);
  };

  const clockMounted = Boolean(startedAt) && (phase === 'running' || phase === 'early');
  const supportLine = challengeSupportLine(completed, target, endedByTimer);
  const timerHeadline = challengeTimerHeadline(completed, target);
  const timerSupport = challengeTimerSupport(completed, target);
  const showZeroActions = completed === 0;
  const showSmaller = completed < target;

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
              <Text style={[styles.headline, { color: theme.text }]}>Challenge Mode</Text>
              <Text style={[styles.lede, { color: theme.text }]}>Make it a tiny game.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Give yourself a small target and see what you can do before the timer ends.
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
                  What counts as one point?
                </Text>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  placeholder={CHALLENGE_UNIT_EXAMPLES[0]}
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel="What counts as one point?"
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  {CHALLENGE_UNIT_EXAMPLES.slice(1).join(' · ')}
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>Target</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => {
                      const current = parseChallengeCount(targetText) ?? target;
                      const next = clampChallengeCount(current - 1);
                      setTarget(next);
                      setTargetText(String(next));
                      setTargetError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease target"
                    style={[styles.stepperBtn, { borderColor: theme.surfaceBorder }]}>
                    <Text style={[styles.stepperGlyph, { color: theme.text }]}>−</Text>
                  </Pressable>
                  <TextInput
                    value={targetText}
                    onChangeText={(value) => {
                      setTargetText(value.replace(/[^0-9]/g, '').slice(0, 2));
                      setTargetError(null);
                    }}
                    keyboardType="number-pad"
                    accessibilityLabel="Target"
                    style={[
                      styles.input,
                      styles.countInput,
                      { color: theme.text, borderColor: theme.surfaceBorder },
                    ]}
                  />
                  <Pressable
                    onPress={() => {
                      const current = parseChallengeCount(targetText) ?? target;
                      const next = clampChallengeCount(current + 1);
                      setTarget(next);
                      setTargetText(String(next));
                      setTargetError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Increase target"
                    style={[styles.stepperBtn, { borderColor: theme.surfaceBorder }]}>
                    <Text style={[styles.stepperGlyph, { color: theme.text }]}>+</Text>
                  </Pressable>
                </View>
                {targetError ? (
                  <Text style={[styles.errorText, { color: theme.accent }]}>{targetError}</Text>
                ) : (
                  <Text style={[styles.hint, { color: theme.textMuted }]}>
                    {CHALLENGE_TARGET_MIN}–{CHALLENGE_TARGET_MAX}. Default is {CHALLENGE_TARGET_DEFAULT}.
                  </Text>
                )}

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
                    One short challenge. Default is {CHALLENGE_DURATION_DEFAULT} min.
                  </Text>
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>Quick presets</Text>
                <View style={styles.pillRow}>
                  {CHALLENGE_PRESETS.map((preset) => (
                    <TagPill
                      key={preset.id}
                      label={`${preset.label}: ${preset.target} · ${preset.minutes} min`}
                      selected={selectedPreset === preset.id}
                      onPress={() => applyPreset(preset.target, preset.minutes)}
                    />
                  ))}
                </View>
              </GlassCard>

              <View
                style={[
                  styles.preview,
                  { borderColor: theme.surfaceBorder, backgroundColor: theme.surface },
                ]}>
                <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Your challenge:</Text>
                <Text style={[styles.previewText, { color: theme.text }]}>{preview}</Text>
              </View>

              <View style={[styles.startWrap, isNarrow && styles.startWrapMobile]}>
                <GradientButton
                  label="Start challenge"
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
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>CHALLENGE MODE</Text>
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
                          accessibilityLabel={`${completed} of ${target} done`}>
                          {completed} / {target}
                          {sparkle ? ' ✨' : ''}
                        </Text>
                      </Animated.View>
                      {scoreUnit ? (
                        <Text style={[styles.unitLine, { color: theme.textSecondary }]}>
                          {scoreUnit}
                        </Text>
                      ) : taskLabel ? (
                        <Text
                          style={[styles.unitLine, { color: theme.textSecondary }]}
                          numberOfLines={2}>
                          {taskLabel}
                        </Text>
                      ) : null}
                      {pulseNote ? (
                        <Text style={[styles.pulseNote, { color: theme.accent }]}>{pulseNote}</Text>
                      ) : (
                        <View style={styles.pulseNoteSpacer} />
                      )}

                      {showTargetHit ? (
                        <View style={styles.targetHit}>
                          <Text style={[styles.targetHitTitle, { color: theme.text }]}>
                            Target hit ✨
                          </Text>
                          <View style={[styles.actionStack, compactLayout && styles.actionStackWide]}>
                            <GradientButton
                              label="Finish challenge"
                              onPress={finishToSummary}
                              small
                              style={styles.actionButton}
                            />
                            <GradientButton
                              label="Keep going"
                              onPress={() => setKeepGoing(true)}
                              variant="ghost"
                              small
                              style={styles.actionButton}
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={[styles.doneWrap, compactLayout && styles.doneWrapMobile]}>
                          <GradientButton
                            label="+ 1 done"
                            onPress={addOneDone}
                            accessibilityLabel="Add one done"
                            style={styles.doneButton}
                          />
                        </View>
                      )}
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
                      accessibilityLabel={paused ? 'Resume challenge' : 'Pause challenge'}
                      hitSlop={8}
                      style={styles.secondaryLink}>
                      <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                        {paused ? 'Resume' : 'Pause'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={requestEnd}
                      accessibilityRole="button"
                      accessibilityLabel="End challenge"
                      hitSlop={8}
                      style={styles.secondaryLink}>
                      <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                        End challenge
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {phase === 'early' ? (
                <View style={styles.panel}>
                  <Text style={[styles.headline, { color: theme.text }]}>Done for now?</Text>
                  <Text style={[styles.summaryLine, { color: theme.text }]}>
                    {completed} / {target}
                  </Text>
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
                {completed === 0
                  ? endedByTimer
                    ? 'The timer ended. You still showed up.'
                    : 'You still showed up.'
                  : 'Challenge complete ✨'}
              </Text>
              {endedByTimer && timerHeadline ? (
                <Text style={[styles.outcomeLine, { color: theme.text }]}>{timerHeadline}</Text>
              ) : null}
              {endedByTimer && timerSupport ? (
                <Text style={[styles.sub, { color: theme.textSecondary }]}>{timerSupport}</Text>
              ) : null}

              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Task</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {taskLabel || 'This challenge'}
              </Text>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Result</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {completed} / {target}
              </Text>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Time</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {minutesLabel(durationMinutes)}
              </Text>
              {completed > 0 && !endedByTimer ? (
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
                      label="Make the challenge smaller"
                      onPress={() => handleSummaryAction('smaller')}
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
                      label="Try another challenge"
                      onPress={() => handleSummaryAction('another')}
                      variant="ghost"
                      small
                      style={styles.actionButton}
                    />
                    {showSmaller ? (
                      <Pressable
                        onPress={() => handleSummaryAction('smaller')}
                        accessibilityRole="button"
                        accessibilityLabel="Make the challenge smaller"
                        style={styles.secondaryLink}>
                        <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                          Make the challenge smaller
                        </Text>
                      </Pressable>
                    ) : null}
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
    marginBottom: spacing.md,
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  countInput: {
    width: 72,
    marginBottom: 0,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  previewLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  previewText: {
    ...typography.body,
    fontWeight: '600',
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
    fontSize: 52,
    lineHeight: 60,
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
  targetHit: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  targetHitTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
  actionStackWide: {
    maxWidth: '100%',
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
    ...typography.h3,
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
