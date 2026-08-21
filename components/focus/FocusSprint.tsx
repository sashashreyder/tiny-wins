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
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { TagPill } from '@/components/design-system/Tags';
import { GentleTimer } from '@/components/tools/GentleTimer';
import { focusModes, focusResults } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
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
const PARKED_LIST_MAX_HEIGHT = 180;

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
    <View style={styles.taskContext}>
      <Text style={[styles.contextLabel, { color: theme.textMuted }]}>You're focusing on</Text>
      <Text style={[styles.contextValue, { color: theme.text }]}>{task}</Text>
      <Text style={[styles.contextLabel, styles.contextLabelSpaced, { color: theme.textMuted }]}>
        Smallest win
      </Text>
      <Text style={[styles.contextValue, { color: theme.text }]}>{win}</Text>
    </View>
  );
}

function DistractionParking({
  input,
  onChangeInput,
  onPark,
  parked,
  inputRef,
}: {
  input: string;
  onChangeInput: (value: string) => void;
  onPark: () => void;
  parked: FocusDistraction[];
  inputRef: RefObject<TextInput | null>;
}) {
  const theme = useAppTheme();

  return (
    <GlassCard style={styles.parkingCard}>
      <Text style={[styles.parkingTitle, { color: theme.text }]}>Distraction parking</Text>
      <Text style={[styles.parkingCopy, { color: theme.textSecondary }]}>
        Something pulled your attention away? Write it down so you don't have to keep it in your
        head, then return to your task.
      </Text>

      <View style={styles.parkRow}>
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
            { color: theme.text, borderColor: theme.surfaceBorder },
          ]}
        />
        <GradientButton label="Park it" onPress={onPark} small style={styles.parkButton} />
      </View>

      {parked.length > 0 ? (
        <View style={styles.parkedBlock}>
          <Text style={[styles.parkedHeading, { color: theme.textMuted }]}>
            Parked distractions · {parked.length}
          </Text>
          <ScrollView
            style={styles.parkedList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
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

export function FocusSprint({ onBack }: { onBack: () => void }) {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const completeFocus = useAppStore((s) => s.completeFocus);
  const isNarrow = viewportWidth < NARROW_BREAKPOINT;
  const contentWidth = viewportWidth >= WIDE_SHELL ? viewportWidth - SIDEBAR_WIDTH : viewportWidth;
  const isSplit = contentWidth >= SPLIT_MIN_WIDTH;

  const [phase, setPhase] = useState<Phase>('setup');
  const [minutes, setMinutes] = useState(10);
  const [title, setTitle] = useState('');
  const [smallest, setSmallest] = useState('');
  const [distractions, setDistractions] = useState<FocusDistraction[]>([]);
  const [distractionInput, setDistractionInput] = useState('');
  const parkInputRef = useRef<TextInput>(null);

  const start = (mins: number) => {
    setMinutes(mins || minutes);
    setPhase('running');
  };

  const finish = (result: FocusResult) => {
    completeFocus(
      { title: title || 'Focus session', duration: minutes, distractions, result },
      result,
    );
    setPhase('setup');
    setTitle('');
    setSmallest('');
    setDistractions([]);
    setDistractionInput('');
  };

  const handleTimerFinish = useCallback(() => {
    setPhase('done');
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
    />
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.sprintShell}>
        <View
          style={[
            styles.sprintInner,
            phase === 'running' && isSplit ? styles.sprintInnerRunning : null,
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

          {phase === 'running' && (
            <View style={isSplit ? styles.runningSplit : styles.runningStack}>
              <View style={isSplit ? styles.runningPrimary : styles.runningBlock}>
                <SprintTaskContext title={title} smallest={smallest} />
                <GentleTimer
                  key={`focus-${minutes}`}
                  durationMinutes={minutes}
                  endLabel="End sprint"
                  pauseLabel="Pause without shame"
                  onFinish={handleTimerFinish}
                />
              </View>
              <View style={isSplit ? styles.runningSecondary : styles.runningBlock}>{parking}</View>
            </View>
          )}

          {phase === 'done' && (
            <>
              <SectionHeader title="What happened?" subtitle="Every answer earns XP" />
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
              {focusResults.map((r) => (
                <GlassCard
                  key={r.id}
                  onPress={() => finish(r.id as FocusResult)}
                  style={styles.resultCard}>
                  <Text style={{ color: theme.text, ...typography.body, fontWeight: '600' }}>
                    {r.label}
                  </Text>
                </GlassCard>
              ))}
            </>
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
  internalBack: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  internalBackText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
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
    gap: spacing.lg,
    width: '100%',
  },
  runningStack: {
    width: '100%',
    gap: spacing.md,
  },
  runningPrimary: {
    flexGrow: 1.7,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  runningSecondary: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: 380,
  },
  runningBlock: {
    width: '100%',
  },
  taskContext: {
    marginBottom: spacing.md,
  },
  contextLabel: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  contextLabelSpaced: {
    marginTop: spacing.sm,
  },
  contextValue: {
    ...typography.body,
    fontWeight: '600',
  },
  parkingCard: {
    width: '100%',
  },
  parkingTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  parkingCopy: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  parkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  parkInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 160,
    marginBottom: 0,
  },
  parkButton: {
    minWidth: 96,
    minHeight: 44,
  },
  parkedBlock: {
    marginTop: spacing.sm,
  },
  parkedHeading: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  parkedList: {
    maxHeight: PARKED_LIST_MAX_HEIGHT,
  },
  parkedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
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
});
