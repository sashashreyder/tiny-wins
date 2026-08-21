import { useCallback, useRef, useState, type RefObject } from 'react';
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
import { GentleTimer } from '@/components/tools/GentleTimer';
import { focusModes, focusResults } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { FocusDistraction, FocusResult } from '@/types';

type Phase = 'setup' | 'running' | 'done';

const SETUP_CONTENT_MAX_WIDTH = 640;
const RUNNING_CONTENT_MAX_WIDTH = 960;
const START_BUTTON_MAX_WIDTH = 320;
const NARROW_BREAKPOINT = 700;
const SPLIT_MIN_WIDTH = 820;
const SIDEBAR_WIDTH = 260;
const WIDE_SHELL = 900;
const PARKED_LIST_MAX_HEIGHT = 136;
const FOLLOW_UP_ACTION_MAX = 280;

function formatParkedTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parkedCountLabel(count: number): string {
  return count === 1 ? '1 distraction parked' : `${count} distractions parked`;
}

function SprintTaskContext({ title, smallest }: { title: string; smallest: string }) {
  const theme = useAppTheme();
  const task = title.trim() || 'This sprint';
  const win = smallest.trim() || 'Show up';

  return (
    <View style={styles.contextText}>
      <Text style={[styles.contextLabel, { color: theme.textMuted }]}>You're focusing on</Text>
      <Text style={[styles.contextValue, { color: theme.accent }]} numberOfLines={2}>
        {task}
      </Text>
      <Text style={[styles.contextLabel, styles.contextLabelSpaced, { color: theme.textMuted }]}>
        Smallest win
      </Text>
      <Text style={[styles.contextValue, { color: theme.accent }]} numberOfLines={2}>
        {win}
      </Text>
    </View>
  );
}

function DistractionParking({
  input,
  onChangeInput,
  onPark,
  parked,
  inputRef,
  stacked,
}: {
  input: string;
  onChangeInput: (value: string) => void;
  onPark: () => void;
  parked: FocusDistraction[];
  inputRef: RefObject<TextInput | null>;
  stacked?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <GlassCard style={styles.parkingCard}>
      <Text style={[styles.parkingTitle, { color: theme.text }]}>Distraction parking</Text>
      <Text style={[styles.parkingCopy, { color: theme.textSecondary }]}>
        Write it down, then return to your task.
      </Text>

      <View style={[styles.parkRow, stacked && styles.parkRowStacked]}>
        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={onChangeInput}
          placeholder="Reply to Sam, look up that book..."
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Park a distraction"
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onPark}
          style={[
            styles.input,
            styles.parkInput,
            stacked && styles.parkInputStacked,
            { color: theme.text, borderColor: theme.surfaceBorder },
          ]}
        />
        <GradientButton
          label="Park it"
          onPress={onPark}
          small
          style={stacked ? styles.parkButtonStacked : styles.parkButton}
        />
      </View>

          {parked.length > 0 ? (
        <View style={styles.parkedBlock}>
          <Text style={[styles.parkedHeading, { color: theme.textMuted }]}>
            Parked distractions · {parked.length}
          </Text>
          <ScrollView
            style={styles.parkedList}
            contentContainerStyle={styles.parkedListContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator>
            {parked.map((item) => (
              <View key={item.id} style={styles.parkedItem}>
                <Text style={[styles.parkedTime, { color: theme.textMuted }]}>
                  {formatParkedTime(item.createdAt)}
                </Text>
                <Text style={[styles.parkedText, { color: theme.text }]}>{item.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </GlassCard>
  );
}

type FollowUpAction = {
  id: string;
  label: string;
  variant: 'primary' | 'ghost' | 'link';
};

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
          { id: 'another', label: 'Do another sprint', variant: 'ghost' },
          { id: 'hub', label: 'Back to focus tools', variant: 'link' },
        ],
      };
    case 'finished':
      return {
        message: 'Done is done. Nice work.',
        actions: [
          { id: 'finish-sprint', label: 'Finish sprint', variant: 'primary' },
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

export function FocusSprint({ onBack }: { onBack: () => void }) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const completeFocus = useAppStore((s) => s.completeFocus);
  const addTinyWin = useAppStore((s) => s.addTinyWin);
  const isNarrow = viewportWidth < NARROW_BREAKPOINT;
  const contentWidth = viewportWidth >= WIDE_SHELL ? viewportWidth - SIDEBAR_WIDTH : viewportWidth;
  const isSplit = contentWidth >= SPLIT_MIN_WIDTH;

  const [phase, setPhase] = useState<Phase>('setup');
  const [minutes, setMinutes] = useState(10);
  const [title, setTitle] = useState('');
  const [smallest, setSmallest] = useState('');
  const [distractions, setDistractions] = useState<FocusDistraction[]>([]);
  const [distractionInput, setDistractionInput] = useState('');
  const [outcome, setOutcome] = useState<FocusResult | null>(null);
  const [tinyWinLogged, setTinyWinLogged] = useState(false);
  const parkInputRef = useRef<TextInput>(null);
  const savedRef = useRef(false);

  const start = (mins: number) => {
    setMinutes(mins || minutes);
    setPhase('running');
  };

  const resetSessionFields = (options?: { clearTask?: boolean; smallerTask?: boolean }) => {
    savedRef.current = false;
    setOutcome(null);
    setTinyWinLogged(false);
    setDistractions([]);
    setDistractionInput('');
    if (options?.clearTask) {
      setTitle('');
      setSmallest('');
    } else if (options?.smallerTask) {
      setSmallest('');
    }
  };

  const goToSetup = (options?: { clearTask?: boolean; smallerTask?: boolean }) => {
    resetSessionFields(options);
    setPhase('setup');
  };

  const leaveSprint = (options?: { clearTask?: boolean }) => {
    resetSessionFields(options ?? { clearTask: true });
    setPhase('setup');
    onBack();
  };

  const finalizeSprint = (result: FocusResult) => {
    if (savedRef.current) return;
    completeFocus(
      { title: title || 'Focus session', duration: minutes, distractions, result },
      result,
    );
    savedRef.current = true;
  };

  const recordOutcome = (result: FocusResult) => {
    setOutcome(result);
  };

  const returnToSprint = () => {
    if (savedRef.current) return;
    setOutcome(null);
    setTinyWinLogged(false);
    setPhase('running');
  };

  const goToCantStart = (result: FocusResult) => {
    const task = title.trim();
    finalizeSprint(result);
    resetSessionFields({ clearTask: true });
    setPhase('setup');
    onBack();
    if (task) {
      router.push({ pathname: '/cant-start', params: { task } } as never);
    } else {
      router.push('/cant-start' as never);
    }
  };

  const handleFollowUp = (actionId: string) => {
    if (!outcome) return;
    switch (actionId) {
      case 'another':
      case 'new':
        finalizeSprint(outcome);
        goToSetup(actionId === 'new' ? { clearTask: true } : undefined);
        break;
      case 'finish':
      case 'finish-sprint':
      case 'hub':
        finalizeSprint(outcome);
        leaveSprint({ clearTask: true });
        break;
      case 'tiny-win':
        if (!tinyWinLogged) {
          addTinyWin(title.trim() || 'Focus sprint', 'work-study');
          setTinyWinLogged(true);
        }
        finalizeSprint(outcome);
        break;
      case 'smaller':
        finalizeSprint(outcome);
        goToSetup({ smallerTask: true });
        break;
      case 'cant-start':
        goToCantStart(outcome);
        break;
      default:
        break;
    }
  };

  const handleTimerFinish = useCallback(() => {
    setPhase('done');
    setOutcome(null);
    setTinyWinLogged(false);
  }, []);

  const handleEndRequest = useCallback(() => {
    setPhase('done');
    setOutcome(null);
    setTinyWinLogged(false);
  }, []);

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

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.sprintShell}>
        <View
          style={[
            styles.sprintInner,
            phase === 'running' || phase === 'done' ? styles.sprintInnerRunning : null,
          ]}>
          <Pressable
            onPress={onBack}
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
              <Text style={[styles.headline, { color: theme.text }]}>Just begin.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                ADHD-friendly sprints. Starting earns XP. Finishing optional.
              </Text>
            </>
          ) : null}

          {phase === 'setup' && (
            <>
              <GlassCard>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  What are you focusing on?
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="One task, one tab..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  Smallest visible result?
                </Text>
                <TextInput
                  value={smallest}
                  onChangeText={setSmallest}
                  placeholder="Open the doc, write one line..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
              </GlassCard>

              <SectionHeader title="Pick a sprint" />
              <View style={styles.modeGrid}>
                {focusModes.map((mode) => (
                  <TagPill
                    key={mode.label}
                    label={mode.minutes ? `${mode.minutes} min` : 'Custom'}
                    selected={minutes === mode.minutes && mode.minutes > 0}
                    onPress={() => mode.minutes && setMinutes(mode.minutes)}
                  />
                ))}
              </View>
              <View style={[styles.startWrap, isNarrow && styles.startWrapMobile]}>
                <GradientButton
                  label={`Start ${minutes}-minute sprint`}
                  onPress={() => start(minutes)}
                  style={styles.startButton}
                />
              </View>
            </>
          )}

          {(phase === 'running' || phase === 'done') && (
            <View
              style={phase === 'done' ? styles.hiddenSprint : undefined}
              pointerEvents={phase === 'done' ? 'none' : 'auto'}>
              {phase === 'running' ? (
                <>
                  <Text style={[styles.runningTitle, { color: theme.text }]}>Focus Sprint</Text>
                  <Text style={[styles.runningSub, { color: theme.textSecondary }]}>
                    Stay with this one thing.
                  </Text>
                </>
              ) : null}
              <View style={isSplit ? styles.runningSplit : styles.runningStack}>
                <View style={isSplit ? styles.runningPrimary : styles.runningBlock}>
                  <GentleTimer
                    key={`focus-${minutes}`}
                    durationMinutes={minutes}
                    endLabel="End sprint"
                    pauseLabel="Pause"
                    resumeLabel="Resume"
                    actionLayout="centered"
                    cardStyle={styles.sprintTimerCard}
                    onFinish={handleTimerFinish}
                    onEndRequest={handleEndRequest}
                  />
                  <SprintTaskContext title={title} smallest={smallest} />
                </View>
                <View style={isSplit ? styles.runningSecondary : styles.runningBlock}>
                  {parking}
                </View>
              </View>
            </View>
          )}

          {phase === 'done' && (
            <View style={styles.doneInner}>
              <SectionHeader title="What happened?" subtitle="How did this sprint go?" />
              {!tinyWinLogged ? (
                <Pressable
                  onPress={returnToSprint}
                  accessibilityRole="button"
                  accessibilityLabel="I changed my mind, go back to my sprint"
                  style={styles.changeMind}>
                  <Text style={[styles.changeMindText, { color: theme.textSecondary }]}>
                    ← I changed my mind — go back to my sprint
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
                focusResults.map((r) => (
                  <GlassCard
                    key={r.id}
                    onPress={() => recordOutcome(r.id as FocusResult)}
                    style={styles.resultCard}>
                    <Text style={{ color: theme.text, ...typography.body, fontWeight: '600' }}>
                      {r.label}
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
                  <View style={styles.followUpActions}>
                    {followUp.actions.map((action) => {
                      if (action.id === 'tiny-win' && tinyWinLogged) return null;
                      if (action.variant === 'link') {
                        return (
                          <Pressable
                            key={action.id}
                            onPress={() => handleFollowUp(action.id)}
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
                          onPress={() => handleFollowUp(action.id)}
                          variant={action.variant}
                          small
                          style={styles.followUpButton}
                        />
                      );
                    })}
                  </View>
                </GlassCard>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  sprintShell: {
    width: '100%',
    alignItems: 'center',
  },
  sprintInner: {
    width: '100%',
    maxWidth: SETUP_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  sprintInnerRunning: {
    maxWidth: RUNNING_CONTENT_MAX_WIDTH,
  },
  hiddenSprint: {
    display: 'none',
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
  followUpLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  followUpLinkText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
  sub: { ...typography.body, marginBottom: spacing.lg },
  runningTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  runningSub: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  label: { ...typography.caption, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  modeGrid: {
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
  sprintTimerCard: {
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
  contextLabelSpaced: {
    marginTop: 10,
  },
  contextValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 2,
  },
  parkingCard: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  parkingTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  parkingCopy: {
    ...typography.bodySmall,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  parkRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  parkRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  parkInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 40,
    marginBottom: 0,
    paddingVertical: 8,
  },
  parkInputStacked: {
    minWidth: 0,
    width: '100%',
  },
  parkButton: {
    minWidth: 88,
    minHeight: 40,
    flexShrink: 0,
  },
  parkButtonStacked: {
    minHeight: 40,
    alignSelf: 'flex-start',
    minWidth: 96,
  },
  parkedBlock: {
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  parkedHeading: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: 6,
  },
  parkedList: {
    maxHeight: PARKED_LIST_MAX_HEIGHT,
    flexGrow: 0,
  },
  parkedListContent: {
    paddingBottom: 2,
  },
  parkedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  parkedTime: {
    ...typography.caption,
    fontVariant: ['tabular-nums'],
    width: 40,
    marginTop: 2,
  },
  parkedText: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
  },
  doneInner: {
    width: '100%',
    maxWidth: SETUP_CONTENT_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  summaryCard: {
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
});
