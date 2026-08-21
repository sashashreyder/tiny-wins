import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { TagPill } from '@/components/design-system/Tags';
import {
  DistractionParking,
  formatParkedTime,
  parkedCountLabel,
} from '@/components/focus/DistractionParking';
import { GentleTimer, type GentleTimerFinishReason } from '@/components/tools/GentleTimer';
import { focusResults } from '@/data/content';
import {
  DEFAULT_POMODORO_RHYTHM,
  DEFAULT_POMODORO_ROUNDS,
  POMODORO_BREAK_IDEAS,
  POMODORO_BREAK_MAX,
  POMODORO_BREAK_MIN,
  POMODORO_FOCUS_MAX,
  POMODORO_FOCUS_MIN,
  POMODORO_PRESETS,
  POMODORO_ROUNDS,
  breaksLabel,
  parsePomodoroMinutes,
  remainingRoundsLabel,
  roundsLabel,
  type PomodoroRhythmId,
} from '@/data/pomodoro';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { FocusDistraction, FocusResult } from '@/types';

type PomodoroPhase =
  | 'setup'
  | 'focus'
  | 'transition'
  | 'break'
  | 'ready'
  | 'complete'
  | 'ending';

type EndedFrom = 'focus' | 'break';

type FollowUpAction = {
  id: string;
  label: string;
  variant: 'primary' | 'ghost' | 'link';
};

const SETUP_CONTENT_MAX_WIDTH = 640;
const RUNNING_CONTENT_MAX_WIDTH = 960;
const START_BUTTON_MAX_WIDTH = 320;
const NARROW_BREAKPOINT = 700;
const SPLIT_MIN_WIDTH = 820;
const SIDEBAR_WIDTH = 260;
const WIDE_SHELL = 900;
const FOLLOW_UP_ACTION_MAX = 280;

function getFollowUp(result: FocusResult): {
  message: string;
  actions: FollowUpAction[];
} {
  switch (result) {
    case 'progress':
      return {
        message: 'That counts. You moved it forward.',
        actions: [
          { id: 'finish', label: 'Finish for now', variant: 'primary' },
          { id: 'another', label: 'Do another Pomodoro', variant: 'ghost' },
          { id: 'hub', label: 'Back to focus tools', variant: 'link' },
        ],
      };
    case 'finished':
      return {
        message: 'Done is done. Nice work.',
        actions: [
          { id: 'finish', label: 'Finish Pomodoro', variant: 'primary' },
          { id: 'tiny-win', label: 'Log as a Tiny Win', variant: 'ghost' },
          { id: 'hub', label: 'Back to focus tools', variant: 'link' },
        ],
      };
    case 'stuck':
      return {
        message: 'You got into the task — you just hit a wall.',
        actions: [
          { id: 'smaller', label: 'Make the task smaller', variant: 'primary' },
          { id: 'cant-start', label: "Go to I Can't Start", variant: 'ghost' },
          { id: 'finish', label: 'Finish for now', variant: 'link' },
        ],
      };
    case 'couldnt-start':
      return {
        message: 'Okay — starting is the part that needs support.',
        actions: [
          { id: 'cant-start', label: "Go to I Can't Start", variant: 'primary' },
          { id: 'hub', label: 'Try another focus tool', variant: 'ghost' },
          { id: 'finish', label: 'Finish for now', variant: 'link' },
        ],
      };
    default:
      return {
        message: 'How do you want to continue?',
        actions: [{ id: 'finish', label: 'Finish for now', variant: 'primary' }],
      };
  }
}

function TaskContext({ title }: { title: string }) {
  const theme = useAppTheme();
  const task = title.trim();
  if (!task) return null;

  return (
    <View style={styles.contextText}>
      <Text style={[styles.contextLabel, { color: theme.textMuted }]}>You're focusing on</Text>
      <Text style={[styles.contextValue, { color: theme.accent }]} numberOfLines={2}>
        {task}
      </Text>
    </View>
  );
}

function ActionStack({
  actions,
  onPress,
  hideIds,
}: {
  actions: FollowUpAction[];
  onPress: (id: string) => void;
  hideIds?: string[];
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.followUpActions}>
      {actions.map((action) => {
        if (hideIds?.includes(action.id)) return null;
        if (action.variant === 'link') {
          return (
            <Pressable
              key={action.id}
              onPress={() => onPress(action.id)}
              accessibilityRole="link"
              accessibilityLabel={action.label}
              style={styles.followUpLink}>
              <Text style={[styles.followUpLinkText, { color: theme.textSecondary }]}>
                {action.label}
              </Text>
            </Pressable>
          );
        }
        return (
          <GradientButton
            key={action.id}
            label={action.label}
            onPress={() => onPress(action.id)}
            variant={action.variant}
            small
            style={styles.followUpButton}
          />
        );
      })}
    </View>
  );
}

export function Pomodoro({ onBack }: { onBack: () => void }) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const completeFocus = useAppStore((s) => s.completeFocus);
  const addTinyWin = useAppStore((s) => s.addTinyWin);
  const isNarrow = viewportWidth < NARROW_BREAKPOINT;
  const contentWidth = viewportWidth >= WIDE_SHELL ? viewportWidth - SIDEBAR_WIDTH : viewportWidth;
  const isSplit = contentWidth >= SPLIT_MIN_WIDTH;

  const classic = POMODORO_PRESETS.find((preset) => preset.id === DEFAULT_POMODORO_RHYTHM)!;

  const [phase, setPhase] = useState<PomodoroPhase>('setup');
  const [title, setTitle] = useState('');
  const [rhythmId, setRhythmId] = useState<PomodoroRhythmId>(DEFAULT_POMODORO_RHYTHM);
  const [focusMinutes, setFocusMinutes] = useState(classic.focusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(classic.breakMinutes);
  const [customFocusText, setCustomFocusText] = useState(String(classic.focusMinutes));
  const [customBreakText, setCustomBreakText] = useState(String(classic.breakMinutes));
  const [customError, setCustomError] = useState<string | null>(null);
  const [totalRounds, setTotalRounds] = useState(DEFAULT_POMODORO_ROUNDS);
  const [currentRound, setCurrentRound] = useState(1);
  const [completedFocusRounds, setCompletedFocusRounds] = useState(0);
  const [completedBreaks, setCompletedBreaks] = useState(0);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(classic.breakMinutes);
  const [timerNonce, setTimerNonce] = useState(0);
  const [endedFrom, setEndedFrom] = useState<EndedFrom | null>(null);
  const [distractions, setDistractions] = useState<FocusDistraction[]>([]);
  const [distractionInput, setDistractionInput] = useState('');
  const [outcome, setOutcome] = useState<FocusResult | null>(null);
  const [tinyWinLogged, setTinyWinLogged] = useState(false);
  const parkInputRef = useRef<TextInput>(null);
  const savedRef = useRef(false);

  const isCustom = rhythmId === 'custom';
  const showingFocus =
    phase === 'focus' || (phase === 'ending' && endedFrom === 'focus');
  const showingBreak =
    phase === 'break' || (phase === 'ending' && endedFrom === 'break');
  const hideActive = phase === 'ending';
  const roundsLeftAfterCurrent = Math.max(totalRounds - currentRound, 0);
  const sessionFocusMinutes =
    endedFrom === 'focus' && (phase === 'ending' || phase === 'complete')
      ? currentRound * focusMinutes
      : completedFocusRounds * focusMinutes;

  const selectRhythm = (id: PomodoroRhythmId) => {
    setRhythmId(id);
    setCustomError(null);
    if (id === 'custom') {
      setCustomFocusText(String(focusMinutes));
      setCustomBreakText(String(breakMinutes));
      return;
    }
    const preset = POMODORO_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setFocusMinutes(preset.focusMinutes);
    setBreakMinutes(preset.breakMinutes);
    setCustomFocusText(String(preset.focusMinutes));
    setCustomBreakText(String(preset.breakMinutes));
  };

  const resolveDurations = (): { focus: number; break: number } | null => {
    if (!isCustom) return { focus: focusMinutes, break: breakMinutes };
    const focus = parsePomodoroMinutes(
      customFocusText,
      POMODORO_FOCUS_MIN,
      POMODORO_FOCUS_MAX,
    );
    const brk = parsePomodoroMinutes(
      customBreakText,
      POMODORO_BREAK_MIN,
      POMODORO_BREAK_MAX,
    );
    if (focus == null || brk == null) {
      setCustomError(
        `Focus needs to be ${POMODORO_FOCUS_MIN}–${POMODORO_FOCUS_MAX} minutes, and break ${POMODORO_BREAK_MIN}–${POMODORO_BREAK_MAX}.`,
      );
      return null;
    }
    setCustomError(null);
    setFocusMinutes(focus);
    setBreakMinutes(brk);
    return { focus, break: brk };
  };

  const resetSessionFields = (options?: { clearTask?: boolean }) => {
    savedRef.current = false;
    setOutcome(null);
    setTinyWinLogged(false);
    setDistractions([]);
    setDistractionInput('');
    setEndedFrom(null);
    setCurrentRound(1);
    setCompletedFocusRounds(0);
    setCompletedBreaks(0);
    setTimerNonce((n) => n + 1);
    if (options?.clearTask) setTitle('');
  };

  const goToSetup = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options);
    setPhase('setup');
  };

  const leavePomodoro = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options ?? { clearTask: true });
    setPhase('setup');
    onBack();
  };

  const finalizeSession = (result: FocusResult, durationMinutes: number) => {
    if (savedRef.current) return;
    completeFocus(
      {
        title: title.trim() || 'Pomodoro',
        duration: Math.max(durationMinutes, focusMinutes),
        distractions,
        result,
      },
      result,
    );
    savedRef.current = true;
  };

  const durationForSave = () => Math.max(sessionFocusMinutes, focusMinutes);

  const goToCantStart = (result: FocusResult) => {
    const task = title.trim();
    finalizeSession(result, durationForSave());
    resetSessionFields({ clearTask: true });
    setPhase('setup');
    onBack();
    if (task) {
      router.push({ pathname: '/cant-start', params: { task } } as never);
    } else {
      router.push('/cant-start' as never);
    }
  };

  const startPomodoro = () => {
    const durations = resolveDurations();
    if (!durations) return;
    savedRef.current = false;
    setOutcome(null);
    setTinyWinLogged(false);
    setEndedFrom(null);
    setCurrentRound(1);
    setCompletedFocusRounds(0);
    setCompletedBreaks(0);
    setFocusMinutes(durations.focus);
    setBreakMinutes(durations.break);
    setBreakDurationMinutes(durations.break);
    setTimerNonce((n) => n + 1);
    setPhase('focus');
  };

  const beginBreak = (minutes: number, countBreak: boolean) => {
    if (countBreak) setCompletedBreaks((n) => n + 1);
    setEndedFrom(null);
    setBreakDurationMinutes(minutes);
    setTimerNonce((n) => n + 1);
    setPhase('break');
  };

  const skipBreak = () => {
    setEndedFrom(null);
    setPhase('ready');
  };

  const startNextRound = () => {
    setEndedFrom(null);
    setCurrentRound((round) => round + 1);
    setTimerNonce((n) => n + 1);
    setPhase('focus');
  };

  const showCompletion = () => {
    setEndedFrom(null);
    setOutcome(null);
    setPhase('complete');
  };

  const handleFocusFinish = useCallback(
    (reason: GentleTimerFinishReason) => {
      if (reason !== 'completed') return;
      const next = completedFocusRounds + 1;
      setCompletedFocusRounds(next);
      if (next >= totalRounds) {
        setEndedFrom(null);
        setPhase('complete');
      } else {
        setPhase('transition');
      }
    },
    [completedFocusRounds, totalRounds],
  );

  const handleBreakFinish = useCallback((reason: GentleTimerFinishReason) => {
    if (reason !== 'completed') return;
    setEndedFrom(null);
    setPhase('ready');
  }, []);

  const handleEndRequest = (from: EndedFrom) => {
    setEndedFrom(from);
    setOutcome(null);
    setTinyWinLogged(false);
    setPhase('ending');
  };

  const returnToSession = () => {
    if (savedRef.current) return;
    setOutcome(null);
    setTinyWinLogged(false);
    setPhase(endedFrom === 'break' ? 'break' : 'focus');
  };

  const handleFollowUp = (actionId: string) => {
    if (!outcome) return;
    switch (actionId) {
      case 'another':
        finalizeSession(outcome, durationForSave());
        goToSetup();
        break;
      case 'finish':
      case 'hub':
        finalizeSession(outcome, durationForSave());
        leavePomodoro({ clearTask: true });
        break;
      case 'tiny-win':
        if (!tinyWinLogged) {
          addTinyWin(title.trim() || 'Pomodoro', 'work-study');
          setTinyWinLogged(true);
        }
        finalizeSession(outcome, durationForSave());
        break;
      case 'smaller':
        finalizeSession(outcome, durationForSave());
        goToSetup();
        break;
      case 'cant-start':
        goToCantStart(outcome);
        break;
      default:
        break;
    }
  };

  const handleCompleteAction = (actionId: string) => {
    finalizeSession('progress', Math.max(completedFocusRounds * focusMinutes, focusMinutes));
    if (actionId === 'another') {
      goToSetup();
      return;
    }
    leavePomodoro({ clearTask: true });
  };

  const parkDistraction = () => {
    const text = distractionInput.trim();
    if (!text) return;
    setDistractions((current) => [
      ...current,
      {
        id: `park-${Date.now()}-${current.length}`,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDistractionInput('');
    requestAnimationFrame(() => {
      parkInputRef.current?.focus();
    });
  };

  const parking = (
    <DistractionParking
      input={distractionInput}
      onChangeInput={setDistractionInput}
      onPark={parkDistraction}
      parked={distractions}
      inputRef={parkInputRef}
      stacked={!isSplit}
    />
  );

  const followUp = outcome ? getFollowUp(outcome) : null;
  const previewFocus =
    (isCustom
      ? parsePomodoroMinutes(customFocusText, POMODORO_FOCUS_MIN, POMODORO_FOCUS_MAX)
      : focusMinutes) ?? focusMinutes;
  const previewBreak =
    (isCustom
      ? parsePomodoroMinutes(customBreakText, POMODORO_BREAK_MIN, POMODORO_BREAK_MAX)
      : breakMinutes) ?? breakMinutes;
  const startLabel = `Start ${previewFocus} / ${previewBreak} Pomodoro`;
  const isWideSession = showingFocus || showingBreak;
  const lastRound = currentRound >= totalRounds;

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.shell}>
        <View style={[styles.inner, isWideSession ? styles.innerRunning : null]}>
          <Pressable
            onPress={() => {
              if (phase === 'complete') {
                handleCompleteAction('hub');
                return;
              }
              onBack();
            }}
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
              <Text style={[styles.headline, { color: theme.text }]}>Pomodoro</Text>
              <Text style={[styles.lede, { color: theme.text }]}>Focus. Break. Come back.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Choose a rhythm that feels manageable today.
              </Text>

              <GlassCard>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  What are you working on?
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. finish presentation"
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel="What are you working on?"
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  Optional, but it stays visible while you work.
                </Text>
              </GlassCard>

              <SectionHeader title="Pick a rhythm" />
              <View style={styles.presetGrid}>
                {POMODORO_PRESETS.map((preset) => {
                  const selected = rhythmId === preset.id;
                  return (
                    <Pressable
                      key={preset.id}
                      onPress={() => selectRhythm(preset.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${preset.label}. ${preset.description}`}
                      style={[
                        styles.presetCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: selected ? theme.accent : theme.surfaceBorder,
                        },
                      ]}>
                      <Text style={[styles.presetTitle, { color: theme.text }]}>{preset.label}</Text>
                      <Text style={[styles.presetDesc, { color: theme.textSecondary }]}>
                        {preset.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {isCustom ? (
                <GlassCard style={styles.customCard}>
                  <View style={[styles.customRow, isNarrow && styles.customRowStack]}>
                    <View style={styles.customField}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Focus</Text>
                      <View style={styles.minutesRow}>
                        <TextInput
                          value={customFocusText}
                          onChangeText={(value) => {
                            setCustomFocusText(value.replace(/[^0-9]/g, '').slice(0, 2));
                            setCustomError(null);
                          }}
                          keyboardType="number-pad"
                          placeholder="25"
                          placeholderTextColor={theme.textMuted}
                          accessibilityLabel="Focus minutes"
                          style={[
                            styles.input,
                            styles.minutesInput,
                            { color: theme.text, borderColor: theme.surfaceBorder },
                          ]}
                        />
                        <Text style={[styles.minutesSuffix, { color: theme.textSecondary }]}>
                          minutes
                        </Text>
                      </View>
                    </View>
                    <View style={styles.customField}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Break</Text>
                      <View style={styles.minutesRow}>
                        <TextInput
                          value={customBreakText}
                          onChangeText={(value) => {
                            setCustomBreakText(value.replace(/[^0-9]/g, '').slice(0, 2));
                            setCustomError(null);
                          }}
                          keyboardType="number-pad"
                          placeholder="5"
                          placeholderTextColor={theme.textMuted}
                          accessibilityLabel="Break minutes"
                          style={[
                            styles.input,
                            styles.minutesInput,
                            { color: theme.text, borderColor: theme.surfaceBorder },
                          ]}
                        />
                        <Text style={[styles.minutesSuffix, { color: theme.textSecondary }]}>
                          minutes
                        </Text>
                      </View>
                    </View>
                  </View>
                  {customError ? (
                    <Text style={[styles.errorText, { color: theme.accent }]}>{customError}</Text>
                  ) : (
                    <Text style={[styles.hint, { color: theme.textMuted }]}>
                      Focus {POMODORO_FOCUS_MIN}–{POMODORO_FOCUS_MAX} min · Break{' '}
                      {POMODORO_BREAK_MIN}–{POMODORO_BREAK_MAX} min
                    </Text>
                  )}
                </GlassCard>
              ) : null}

              <Text style={[styles.roundsLabel, { color: theme.text }]}>How many rounds?</Text>
              <Text style={[styles.hint, { color: theme.textMuted }]}>One round = focus + break.</Text>
              <View style={styles.roundRow}>
                {POMODORO_ROUNDS.map((count) => (
                  <TagPill
                    key={count}
                    label={String(count)}
                    selected={totalRounds === count}
                    onPress={() => setTotalRounds(count)}
                  />
                ))}
              </View>

              <View style={[styles.startWrap, isNarrow && styles.startWrapMobile]}>
                <GradientButton
                  label={startLabel}
                  onPress={startPomodoro}
                  style={styles.startButton}
                />
              </View>
            </>
          ) : null}

          {showingFocus ? (
            <View
              style={hideActive ? styles.hidden : undefined}
              pointerEvents={hideActive ? 'none' : 'auto'}>
              <Text style={[styles.runningEyebrow, { color: theme.textMuted }]}>
                FOCUS · ROUND {currentRound} OF {totalRounds}
              </Text>
              <Text style={[styles.runningSub, { color: theme.textSecondary }]}>
                {lastRound
                  ? 'Last round. You only need to stay for this one.'
                  : 'You only need to stay for this round. Then you get a break.'}
              </Text>
              <View style={isSplit ? styles.runningSplit : styles.runningStack}>
                <View style={isSplit ? styles.runningPrimary : styles.runningBlock}>
                  <GentleTimer
                    key={`pomo-focus-${currentRound}-${timerNonce}`}
                    durationMinutes={focusMinutes}
                    endLabel="End Pomodoro"
                    pauseLabel="Pause"
                    resumeLabel="Resume"
                    actionLayout="centered"
                    cardStyle={styles.timerCard}
                    onFinish={handleFocusFinish}
                    onEndRequest={() => handleEndRequest('focus')}
                  />
                  <TaskContext title={title} />
                </View>
                <View style={isSplit ? styles.runningSecondary : styles.runningBlock}>
                  {parking}
                </View>
              </View>
            </View>
          ) : null}

          {showingBreak ? (
            <View
              style={hideActive ? styles.hidden : undefined}
              pointerEvents={hideActive ? 'none' : 'auto'}>
              <Text style={[styles.runningEyebrow, { color: theme.accentSecondary }]}>Break</Text>
              <Text style={[styles.lede, { color: theme.text }]}>
                You don't need to be productive right now.
              </Text>
              <View style={styles.breakBlock}>
                <GentleTimer
                  key={`pomo-break-${currentRound}-${timerNonce}-${breakDurationMinutes}`}
                  durationMinutes={breakDurationMinutes}
                  endLabel="Skip break"
                  secondaryLabel="End Pomodoro"
                  onSecondary={() => handleEndRequest('break')}
                  showPause={false}
                  actionLayout="stack"
                  cardStyle={styles.timerCard}
                  onFinish={handleBreakFinish}
                  onEndRequest={skipBreak}
                />
                <GlassCard style={styles.ideasCard}>
                  <Text style={[styles.ideasTitle, { color: theme.text }]}>If you want a tiny idea</Text>
                  <Text style={[styles.hint, { color: theme.textMuted }]}>Suggestions only.</Text>
                  {POMODORO_BREAK_IDEAS.map((idea) => (
                    <Text
                      key={idea}
                      style={[styles.ideaItem, { color: theme.textSecondary }]}>
                      · {idea}
                    </Text>
                  ))}
                </GlassCard>
              </View>
            </View>
          ) : null}

          {phase === 'transition' ? (
            <View style={styles.panel}>
              <Text style={[styles.headline, { color: theme.text }]}>Focus round complete ✨</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                You stayed with it for {focusMinutes} minutes.
              </Text>
              {roundsLeftAfterCurrent > 0 ? (
                <Text style={[styles.remaining, { color: theme.textMuted }]}>
                  {remainingRoundsLabel(roundsLeftAfterCurrent)}
                </Text>
              ) : null}
              <View style={styles.followUpActions}>
                <GradientButton
                  label={`Take a ${breakMinutes}-minute break`}
                  onPress={() => beginBreak(breakMinutes, true)}
                  small
                  style={styles.followUpButton}
                />
                <GradientButton
                  label="Skip break"
                  onPress={skipBreak}
                  variant="ghost"
                  small
                  style={styles.followUpButton}
                />
              </View>
            </View>
          ) : null}

          {phase === 'ready' ? (
            <View style={styles.panel}>
              <Text style={[styles.headline, { color: theme.text }]}>Ready for the next round?</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                {remainingRoundsLabel(roundsLeftAfterCurrent)}
              </Text>
              <View style={styles.followUpActions}>
                <GradientButton
                  label={`Start round ${currentRound + 1}`}
                  onPress={startNextRound}
                  small
                  style={styles.followUpButton}
                />
                <GradientButton
                  label="Take one more minute"
                  onPress={() => beginBreak(1, completedBreaks === 0)}
                  variant="ghost"
                  small
                  style={styles.followUpButton}
                />
                <Pressable
                  onPress={showCompletion}
                  accessibilityRole="link"
                  accessibilityLabel="Finish for now"
                  style={styles.followUpLink}>
                  <Text style={[styles.followUpLinkText, { color: theme.textSecondary }]}>
                    Finish for now
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {phase === 'complete' ? (
            <View style={styles.panel}>
              <Text style={[styles.headline, { color: theme.text }]}>Pomodoro complete ✨</Text>
              <Text style={[styles.summaryLine, { color: theme.text }]}>
                {roundsLabel(completedFocusRounds)}
              </Text>
              <Text style={[styles.summaryLine, { color: theme.text }]}>
                {completedFocusRounds * focusMinutes} minutes of focus
              </Text>
              <Text style={[styles.summaryLine, { color: theme.textSecondary }]}>
                {breaksLabel(completedBreaks)}
              </Text>
              {title.trim() ? (
                <Text style={[styles.workedOn, { color: theme.textSecondary }]}>
                  You worked on:{'\n'}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{title.trim()}</Text>
                </Text>
              ) : null}
              {distractions.length > 0 ? (
                <GlassCard style={styles.summaryCard}>
                  <Text style={[styles.summaryTitle, { color: theme.text }]}>
                    {parkedCountLabel(distractions.length)}
                  </Text>
                  {distractions.map((item) => (
                    <Text
                      key={item.id}
                      style={[styles.summaryItem, { color: theme.textSecondary }]}>
                      {formatParkedTime(item.createdAt)} — {item.text}
                    </Text>
                  ))}
                </GlassCard>
              ) : null}
              <ActionStack
                actions={[
                  { id: 'finish', label: 'Finish for now', variant: 'primary' },
                  { id: 'another', label: 'Do another Pomodoro', variant: 'ghost' },
                  { id: 'hub', label: 'Back to focus tools', variant: 'link' },
                ]}
                onPress={handleCompleteAction}
              />
            </View>
          ) : null}

          {phase === 'ending' ? (
            <View style={styles.panel}>
              <SectionHeader title="What happened?" subtitle="How did this Pomodoro go?" />
              {!tinyWinLogged ? (
                <Pressable
                  onPress={returnToSession}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  style={styles.changeMind}>
                  <Text style={[styles.changeMindText, { color: theme.textSecondary }]}>
                    ← Go back
                  </Text>
                </Pressable>
              ) : null}
              {distractions.length > 0 ? (
                <GlassCard style={styles.summaryCard}>
                  <Text style={[styles.summaryTitle, { color: theme.text }]}>
                    {parkedCountLabel(distractions.length)}
                  </Text>
                  {distractions.map((item) => (
                    <Text
                      key={item.id}
                      style={[styles.summaryItem, { color: theme.textSecondary }]}>
                      {formatParkedTime(item.createdAt)} — {item.text}
                    </Text>
                  ))}
                </GlassCard>
              ) : null}
              {!outcome ? (
                focusResults.map((result) => (
                  <GlassCard
                    key={result.id}
                    onPress={() => setOutcome(result.id as FocusResult)}
                    style={styles.resultCard}>
                    <Text style={{ color: theme.text, ...typography.body, fontWeight: '600' }}>
                      {result.label}
                    </Text>
                  </GlassCard>
                ))
              ) : followUp ? (
                <GlassCard style={styles.followUpCard}>
                  <Text style={[styles.followUpMessage, { color: theme.text }]}>
                    {followUp.message}
                  </Text>
                  {tinyWinLogged ? (
                    <Text style={[styles.loggedNote, { color: theme.textSecondary }]}>
                      Logged as a tiny win.
                    </Text>
                  ) : null}
                  <ActionStack
                    actions={followUp.actions}
                    onPress={handleFollowUp}
                    hideIds={tinyWinLogged ? ['tiny-win'] : undefined}
                  />
                </GlassCard>
              ) : null}
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
    maxWidth: SETUP_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  innerRunning: {
    maxWidth: RUNNING_CONTENT_MAX_WIDTH,
  },
  hidden: {
    display: 'none',
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
  headline: { ...typography.h1, marginBottom: spacing.xs },
  lede: { ...typography.h3, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  label: { ...typography.caption, marginBottom: 4 },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  errorText: { ...typography.bodySmall, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    maxWidth: '100%',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  presetTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  presetDesc: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  customCard: {
    marginBottom: spacing.md,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  customRowStack: {
    flexDirection: 'column',
  },
  customField: {
    flex: 1,
    minWidth: 0,
  },
  minutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  minutesInput: {
    width: 72,
    marginBottom: 0,
    textAlign: 'center',
  },
  minutesSuffix: {
    ...typography.bodySmall,
  },
  roundsLabel: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  roundRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  startWrap: {
    width: '100%',
    minWidth: 240,
    maxWidth: START_BUTTON_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  startWrapMobile: {
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  startButton: {
    width: '100%',
  },
  runningEyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  runningSub: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  remaining: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  runningSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    width: '100%',
  },
  runningStack: {
    width: '100%',
    gap: spacing.md,
  },
  runningPrimary: {
    flexGrow: 1.55,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  runningSecondary: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignSelf: 'flex-start',
  },
  runningBlock: {
    width: '100%',
  },
  timerCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  contextText: {
    width: '100%',
    marginTop: 24,
    alignItems: 'flex-start',
  },
  contextLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  contextValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 2,
  },
  breakBlock: {
    width: '100%',
    maxWidth: SETUP_CONTENT_MAX_WIDTH,
    gap: spacing.md,
  },
  ideasCard: {
    width: '100%',
  },
  ideasTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  ideaItem: {
    ...typography.bodySmall,
    marginTop: 6,
  },
  panel: {
    width: '100%',
    maxWidth: SETUP_CONTENT_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  summaryLine: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  workedOn: {
    ...typography.body,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryItem: {
    ...typography.bodySmall,
    marginTop: 4,
  },
  resultCard: { marginBottom: spacing.sm },
  followUpCard: {
    marginTop: spacing.xs,
  },
  followUpMessage: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  loggedNote: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  followUpActions: {
    gap: spacing.sm,
    maxWidth: FOLLOW_UP_ACTION_MAX,
  },
  followUpButton: {
    width: '100%',
  },
  followUpLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  followUpLinkText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  changeMind: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeMindText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
