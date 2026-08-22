import { useEffect, useRef, useState } from 'react';
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
import { ProgressBar } from '@/components/design-system/Progress';
import { TagPill } from '@/components/design-system/Tags';
import {
  BATCH_ADD_MORE,
  BATCH_DEFAULT,
  BATCH_MAX,
  BATCH_MIN,
  BATCH_TARGET_CAP,
  clampBatchCount,
  parseBatchCount,
  thingsLabel,
} from '@/data/batch';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { FocusResult } from '@/types';

type BatchPhase = 'setup' | 'running' | 'reached' | 'early' | 'summary';

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

export function BatchMode({ onBack }: { onBack: () => void }) {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const completeFocus = useAppStore((s) => s.completeFocus);
  const isNarrow = viewportWidth < NARROW_BREAKPOINT;
  const contentWidth = viewportWidth >= WIDE_SHELL ? viewportWidth - SIDEBAR_WIDTH : viewportWidth;
  const compactLayout = contentWidth < 520;

  const [phase, setPhase] = useState<BatchPhase>('setup');
  const [task, setTask] = useState('');
  const [targetText, setTargetText] = useState(String(BATCH_DEFAULT));
  const [target, setTarget] = useState(BATCH_DEFAULT);
  const [completed, setCompleted] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [customAddText, setCustomAddText] = useState('');
  const [sparkle, setSparkle] = useState(false);
  const savedRef = useRef(false);
  const sparkleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countScale = useRef(new Animated.Value(1)).current;

  const taskLabel = task.trim();
  const reachedTarget = completed >= target && target > 0;

  useEffect(() => {
    return () => {
      if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'running' && reachedTarget) {
      setPhase('reached');
      setShowAddMore(false);
    }
  }, [phase, reachedTarget]);

  const pulseCount = () => {
    countScale.setValue(1);
    Animated.sequence([
      Animated.timing(countScale, { toValue: 1.08, duration: 90, useNativeDriver: true }),
      Animated.timing(countScale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    setSparkle(true);
    if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
    sparkleTimer.current = setTimeout(() => setSparkle(false), 420);
  };

  const resetSessionFields = (options?: { clearTask?: boolean }) => {
    savedRef.current = false;
    setCompleted(0);
    setStartedAt(null);
    setShowAddMore(false);
    setCustomAddText('');
    setSparkle(false);
    setTargetError(null);
    if (options?.clearTask) {
      setTask('');
      setTarget(BATCH_DEFAULT);
      setTargetText(String(BATCH_DEFAULT));
    }
  };

  const goToSetup = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options);
    setPhase('setup');
  };

  const leaveBatch = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options ?? { clearTask: true });
    setPhase('setup');
    onBack();
  };

  const finalizeSession = (result: FocusResult) => {
    if (savedRef.current) return;
    completeFocus(
      {
        title: taskLabel || 'Batch',
        duration: elapsedFocusMinutes(startedAt),
        result,
      },
      result,
    );
    savedRef.current = true;
  };

  const startBatch = () => {
    const parsed = parseBatchCount(targetText);
    if (parsed == null) {
      setTargetError(`Choose a number from ${BATCH_MIN} to ${BATCH_MAX}.`);
      return;
    }
    savedRef.current = false;
    setTargetError(null);
    setTarget(parsed);
    setCompleted(0);
    setStartedAt(new Date().toISOString());
    setShowAddMore(false);
    setCustomAddText('');
    setPhase('running');
  };

  const doneOne = () => {
    if (phase !== 'running') return;
    setCompleted((n) => Math.min(n + 1, target));
    pulseCount();
  };

  const undoLast = () => {
    setCompleted((n) => Math.max(n - 1, 0));
    if (phase === 'reached') {
      setShowAddMore(false);
      setPhase('running');
    }
  };

  const addToTarget = (amount: number) => {
    const next = clampBatchCount(target + amount, BATCH_MIN, BATCH_TARGET_CAP);
    if (next <= target) return;
    setTarget(next);
    setTargetText(String(next));
    setShowAddMore(false);
    setCustomAddText('');
    setPhase('running');
  };

  const addCustom = () => {
    const parsed = parseBatchCount(customAddText, BATCH_MIN, BATCH_MAX);
    if (parsed == null) return;
    addToTarget(parsed);
  };

  const finishConfirmed = () => {
    setShowAddMore(false);
    setPhase('summary');
  };

  const handleSummaryAction = (actionId: string) => {
    finalizeSession(reachedTarget ? 'finished' : 'progress');
    if (actionId === 'another') {
      goToSetup();
      return;
    }
    leaveBatch({ clearTask: true });
  };

  const handleBack = () => {
    if (phase === 'summary') {
      handleSummaryAction('hub');
      return;
    }
    onBack();
  };

  const trimmedStart =
    taskLabel.length > 32 ? `${taskLabel.slice(0, 32).trimEnd()}…` : taskLabel;
  const startLabel = taskLabel ? `Start: ${trimmedStart}` : 'Start batch';

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.shell}>
        <View
          style={[
            styles.inner,
            phase !== 'setup' ? styles.innerActive : null,
          ]}>
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
              <Text style={[styles.eyebrow, { color: theme.textMuted }]}>BATCH MODE</Text>
              <Text style={[styles.headline, { color: theme.text }]}>Batch Mode</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Clear a bunch of similar little things without treating them like one giant task.
              </Text>

              <GlassCard>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  What are you batching?
                </Text>
                <TextInput
                  value={task}
                  onChangeText={setTask}
                  placeholder="Reply to emails"
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel="What are you batching?"
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  Process photos, put things away, fill out forms…
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>How many?</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => {
                      const current = parseBatchCount(targetText) ?? target;
                      const next = clampBatchCount(current - 1);
                      setTarget(next);
                      setTargetText(String(next));
                      setTargetError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease count"
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
                    accessibilityLabel="How many"
                    style={[
                      styles.input,
                      styles.countInput,
                      { color: theme.text, borderColor: theme.surfaceBorder },
                    ]}
                  />
                  <Pressable
                    onPress={() => {
                      const current = parseBatchCount(targetText) ?? target;
                      const next = clampBatchCount(current + 1);
                      setTarget(next);
                      setTargetText(String(next));
                      setTargetError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Increase count"
                    style={[styles.stepperBtn, { borderColor: theme.surfaceBorder }]}>
                    <Text style={[styles.stepperGlyph, { color: theme.text }]}>+</Text>
                  </Pressable>
                </View>
                {targetError ? (
                  <Text style={[styles.errorText, { color: theme.accent }]}>{targetError}</Text>
                ) : (
                  <Text style={[styles.hint, { color: theme.textMuted }]}>
                    {BATCH_MIN}–{BATCH_MAX}. Default is {BATCH_DEFAULT}.
                  </Text>
                )}
              </GlassCard>

              <View style={[styles.startWrap, isNarrow && styles.startWrapMobile]}>
                <GradientButton label={startLabel} onPress={startBatch} style={styles.startButton} />
              </View>
            </>
          ) : null}

          {phase === 'running' || phase === 'reached' ? (
            <View style={styles.workspace}>
              <Text style={[styles.eyebrow, { color: theme.textMuted }]}>BATCH MODE</Text>
              <GlassCard style={styles.workspaceCard}>
                <Animated.View style={{ transform: [{ scale: countScale }] }}>
                  <Text
                    style={[styles.count, { color: theme.text }]}
                    accessibilityLabel={`${completed} of ${target} done`}>
                    {completed} / {target}
                    {sparkle ? ' ✨' : ''}
                  </Text>
                </Animated.View>
                <Text style={[styles.taskLine, { color: theme.textSecondary }]} numberOfLines={2}>
                  {taskLabel || 'This batch'}
                </Text>
                <View style={styles.barWrap}>
                  <ProgressBar progress={target > 0 ? completed / target : 0} />
                </View>

                {phase === 'running' ? (
                  <View style={[styles.doneWrap, compactLayout && styles.doneWrapMobile]}>
                    <GradientButton
                      label="+ Done one"
                      onPress={doneOne}
                      style={styles.doneButton}
                    />
                  </View>
                ) : (
                  <>
                    <Text style={[styles.completeTitle, { color: theme.text }]}>
                      Batch complete ✨
                    </Text>
                    <Text style={[styles.completeSub, { color: theme.textSecondary }]}>
                      {completed} / {target} done
                    </Text>
                    {!showAddMore ? (
                      <View style={styles.actionStack}>
                        <GradientButton
                          label="Finish batch"
                          onPress={finishConfirmed}
                          small
                          style={styles.actionButton}
                        />
                        <GradientButton
                          label="Add a few more"
                          onPress={() => setShowAddMore(true)}
                          variant="ghost"
                          small
                          style={styles.actionButton}
                        />
                      </View>
                    ) : (
                      <View style={styles.addMoreBlock}>
                        <Text style={[styles.hint, { color: theme.textMuted }]}>
                          Keep your progress. Just raise the target.
                        </Text>
                        <View style={styles.addRow}>
                          {BATCH_ADD_MORE.map((amount) => (
                            <TagPill
                              key={amount}
                              label={`+${amount}`}
                              onPress={() => addToTarget(amount)}
                            />
                          ))}
                        </View>
                        <View style={styles.customAddRow}>
                          <TextInput
                            value={customAddText}
                            onChangeText={(value) =>
                              setCustomAddText(value.replace(/[^0-9]/g, '').slice(0, 2))
                            }
                            keyboardType="number-pad"
                            placeholder="Custom"
                            placeholderTextColor={theme.textMuted}
                            accessibilityLabel="Custom number to add"
                            style={[
                              styles.input,
                              styles.customAddInput,
                              { color: theme.text, borderColor: theme.surfaceBorder },
                            ]}
                          />
                          <GradientButton
                            label="Add"
                            onPress={addCustom}
                            small
                            style={styles.customAddButton}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}
              </GlassCard>

              <View style={styles.secondaryRow}>
                <Pressable
                  onPress={undoLast}
                  disabled={completed <= 0}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: completed <= 0 }}
                  accessibilityLabel="Undo last"
                  hitSlop={8}
                  style={styles.secondaryLink}>
                  <Text
                    style={[
                      styles.secondaryText,
                      { color: completed <= 0 ? theme.textMuted : theme.textSecondary },
                    ]}>
                    Undo last
                  </Text>
                </Pressable>
                {phase === 'running' ? (
                  <Pressable
                    onPress={() => setPhase('early')}
                    accessibilityRole="button"
                    accessibilityLabel="Finish for now"
                    hitSlop={8}
                    style={styles.secondaryLink}>
                    <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
                      Finish for now
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {phase === 'early' ? (
            <View style={styles.panel}>
              <Text style={[styles.headline, { color: theme.text }]}>
                {completed === 0 ? 'Nothing cleared yet. That’s okay.' : `${completed} done. That still counts.`}
              </Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                {completed === 0
                  ? 'You can keep going, or stop here.'
                  : `You cleared ${completed} ${thingsLabel(completed)}. That’s ${completed} fewer ${thingsLabel(completed)} waiting for you.`}
              </Text>
              <Text style={[styles.hint, { color: theme.textMuted }]}>
                {completed} / {target}
                {taskLabel ? ` · ${taskLabel}` : ''}
              </Text>
              <View style={styles.actionStack}>
                <GradientButton
                  label="Finish for now"
                  onPress={finishConfirmed}
                  small
                  style={styles.actionButton}
                />
                <GradientButton
                  label="Continue batch"
                  onPress={() => setPhase('running')}
                  variant="ghost"
                  small
                  style={styles.actionButton}
                />
              </View>
            </View>
          ) : null}

          {phase === 'summary' ? (
            <View style={styles.panel}>
              <Text style={[styles.headline, { color: theme.text }]}>Batch done ✨</Text>
              <Text style={[styles.summaryLine, { color: theme.text }]}>
                {completed} / {target} completed
              </Text>
              {taskLabel ? (
                <Text style={[styles.workedOn, { color: theme.textSecondary }]}>{taskLabel}</Text>
              ) : null}
              <View style={styles.actionStack}>
                <GradientButton
                  label="Finish for now"
                  onPress={() => handleSummaryAction('finish')}
                  small
                  style={styles.actionButton}
                />
                <GradientButton
                  label="Start another batch"
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
  workspaceCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  count: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  taskLine: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  barWrap: {
    width: '100%',
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  doneWrap: {
    width: '100%',
    maxWidth: DONE_BUTTON_MAX_WIDTH,
    alignSelf: 'center',
  },
  doneWrapMobile: {
    maxWidth: '100%',
  },
  doneButton: {
    width: '100%',
    minHeight: 60,
  },
  completeTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 4,
  },
  completeSub: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  addMoreBlock: {
    width: '100%',
    alignItems: 'center',
  },
  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: ACTION_MAX,
  },
  customAddInput: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  customAddButton: {
    minWidth: 72,
  },
  secondaryRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
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
  summaryLine: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  workedOn: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
});
