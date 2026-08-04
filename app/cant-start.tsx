import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { AppModal } from '@/components/design-system/Modal';
import { TinyQuestCard } from '@/components/design-system/Cards';
import { stuckTypes } from '@/data/content';
import { getSupportiveMessage, getTinyQuests } from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { StuckType, StuckTypeOption } from '@/types';

const STUCK_GRID_COLUMNS = 2;
const STUCK_GRID_GAP = spacing.md;
const CONTEXT_MAX_WIDTH = 1000;
const TASK_TEXT_MAX = 100;

type TooBigStage = 'context' | 'quest';

type TaskContext =
  | 'screen'
  | 'physical-home'
  | 'message-call'
  | 'self-care'
  | 'going-somewhere'
  | 'other';

type TaskContextOption = {
  id: TaskContext;
  emoji: string;
  label: string;
  description: string;
};

const taskContextOptions: TaskContextOption[] = [
  {
    id: 'screen',
    emoji: '💻',
    label: 'Something on a screen',
    description: 'A file, presentation, website, form, or digital task.',
  },
  {
    id: 'physical-home',
    emoji: '🏠',
    label: 'A physical or home task',
    description: 'Cleaning, cooking, organizing, or moving something.',
  },
  {
    id: 'message-call',
    emoji: '💬',
    label: 'A message or call',
    description: 'A reply, email, phone call, or conversation.',
  },
  {
    id: 'self-care',
    emoji: '🫶',
    label: 'Body or self-care',
    description: 'Food, shower, teeth, medication, or getting dressed.',
  },
  {
    id: 'going-somewhere',
    emoji: '🚪',
    label: 'Going somewhere',
    description: 'Leaving home, an appointment, an errand, or a walk.',
  },
  {
    id: 'other',
    emoji: '✨',
    label: 'Something else',
    description: 'None of these quite fit.',
  },
];

const KEYWORD_GROUPS: { context: TaskContext; keywords: string[] }[] = [
  {
    context: 'screen',
    keywords: [
      'presentation',
      'slides',
      'powerpoint',
      'canva',
      'figma',
      'document',
      'file',
      'spreadsheet',
      'code',
      'website',
      'form',
      'project',
      'computer',
      'laptop',
      'screen',
    ],
  },
  {
    context: 'physical-home',
    keywords: [
      'cleaning',
      'clean',
      'dishes',
      'laundry',
      'room',
      'kitchen',
      'floor',
      'sweep',
      'vacuum',
      'cooking',
      'cook',
      'organize',
      'tidy',
    ],
  },
  {
    context: 'message-call',
    keywords: [
      'message',
      'reply',
      'email',
      'whatsapp',
      'text',
      'call',
      'answer',
      'respond',
      'contact',
    ],
  },
  {
    context: 'self-care',
    keywords: [
      'shower',
      'teeth',
      'brush',
      'eat',
      'food',
      'meal',
      'medication',
      'medicine',
      'meds',
      'dress',
      'clothes',
      'wash',
    ],
  },
  {
    context: 'going-somewhere',
    keywords: [
      'leave',
      'appointment',
      'doctor',
      'gym',
      'store',
      'shop',
      'outside',
      'errand',
      'walk',
      'go out',
    ],
  },
];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function suggestTaskContext(text: string): TaskContext | null {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  for (const group of KEYWORD_GROUPS) {
    for (const keyword of group.keywords) {
      if (normalized.includes(keyword)) {
        return group.context;
      }
    }
  }

  return null;
}

function buildContextFirstQuest(context: TaskContext, taskText: string): string {
  const trimmed = taskText.trim();

  switch (context) {
    case 'screen':
      return trimmed
        ? `Open the file or app for “${trimmed}”.\nYou don’t have to work on it yet.`
        : 'Open the file, page, or app you need.\nYou don’t have to work on it yet.';
    case 'physical-home':
      return 'Go to the place where the task happens.\nYou don’t need to do anything yet.';
    case 'message-call':
      return 'Open the conversation or find the contact.\nYou don’t have to reply or call yet.';
    case 'self-care':
      return 'Bring one thing you need closer.\nThat is enough for this step.';
    case 'going-somewhere':
      return 'Put one thing you’ll need by the door.\nYou don’t have to leave yet.';
    case 'other':
      return 'Bring the task one small step closer.\nYou don’t have to begin the whole thing.';
  }
}

function suggestionNote(context: TaskContext): string {
  switch (context) {
    case 'screen':
      return 'This sounds like something on a screen.\nChange it if we guessed wrong.';
    case 'physical-home':
      return 'This sounds like a physical or home task.\nChange it if we guessed wrong.';
    case 'message-call':
      return 'This sounds like a message or call.\nChange it if we guessed wrong.';
    case 'self-care':
      return 'This sounds like body or self-care.\nChange it if we guessed wrong.';
    case 'going-somewhere':
      return 'This sounds like going somewhere.\nChange it if we guessed wrong.';
    case 'other':
      return 'Change it if we guessed wrong.';
  }
}

function StuckOptionsGrid({ children }: { children: React.ReactNode[] }) {
  const rows = chunk(children, STUCK_GRID_COLUMNS);

  return (
    <View style={styles.stuckGrid}>
      {rows.map((row, rowIndex) => (
        <View key={`stuck-row-${rowIndex}`} style={styles.stuckRow}>
          {row.map((child, colIndex) => (
            <View key={`stuck-cell-${rowIndex}-${colIndex}`} style={styles.stuckCell}>
              {child}
            </View>
          ))}
          {row.length < STUCK_GRID_COLUMNS
            ? Array.from({ length: STUCK_GRID_COLUMNS - row.length }).map((_, i) => (
                <View key={`stuck-spacer-${rowIndex}-${i}`} style={styles.stuckCell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function StuckOptionCard({
  option,
  onPress,
}: {
  option: StuckTypeOption;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      style={({ pressed }) => [styles.stuckCardPressable, pressed && styles.stuckCardPressed]}>
      <View
        style={[
          styles.stuckCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.surfaceBorder,
          },
        ]}>
        <Text style={styles.stuckEmoji}>{option.emoji}</Text>
        <Text style={[styles.stuckLabel, { color: theme.text }]} numberOfLines={2}>
          {option.label}
        </Text>
        <Text style={[styles.stuckHint, { color: theme.textSecondary }]} numberOfLines={2}>
          {option.hint}
        </Text>
      </View>
    </Pressable>
  );
}

function TaskContextCard({
  option,
  selected,
  suggested,
  onPress,
}: {
  option: TaskContextOption;
  selected: boolean;
  suggested: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        suggested ? `${option.label}, suggested` : option.label
      }
      style={({ pressed }) => [
        styles.contextCardPressable,
        pressed && styles.stuckCardPressed,
      ]}>
      <View
        style={[
          styles.contextCard,
          {
            backgroundColor: selected ? theme.accentTertiary + 'CC' : theme.surface,
            borderColor: selected ? theme.accent : theme.surfaceBorder,
            borderWidth: selected ? 2 : 1,
          },
        ]}>
        {suggested ? (
          <View style={[styles.suggestedBadge, { backgroundColor: theme.accentSecondary + '33' }]}>
            <Text style={[styles.suggestedBadgeText, { color: theme.accentSecondary }]}>
              Suggested
            </Text>
          </View>
        ) : null}
        <Text style={styles.contextEmoji}>{option.emoji}</Text>
        <Text style={[styles.contextLabel, { color: theme.text }]} numberOfLines={2}>
          {option.label}
        </Text>
        <Text style={[styles.contextDesc, { color: theme.textSecondary }]} numberOfLines={3}>
          {option.description}
        </Text>
      </View>
    </Pressable>
  );
}

function ContextOptionsGrid({
  columns,
  gap,
  children,
}: {
  columns: number;
  gap: number;
  children: React.ReactNode[];
}) {
  const rows = chunk(children, columns);

  return (
    <View style={[styles.contextGrid, { gap }]}>
      {rows.map((row, rowIndex) => (
        <View key={`ctx-row-${rowIndex}`} style={[styles.contextRow, { gap }]}>
          {row.map((child, colIndex) => (
            <View key={`ctx-cell-${rowIndex}-${colIndex}`} style={styles.contextCell}>
              {child}
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`ctx-spacer-${rowIndex}-${i}`} style={styles.contextCell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

export default function CantStartScreen() {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const completeQuest = useAppStore((s) => s.completeCantStartQuest);
  const profile = useAppStore((s) => s.userProfile);

  const [stuckType, setStuckType] = useState<StuckType | null>(null);
  const [tooBigStage, setTooBigStage] = useState<TooBigStage>('context');
  const [manualContext, setManualContext] = useState<TaskContext | null>(null);
  const [suggestedContext, setSuggestedContext] = useState<TaskContext | null>(null);
  const [taskText, setTaskText] = useState('');
  const [confirmedContext, setConfirmedContext] = useState<TaskContext | null>(null);
  const [confirmedTaskText, setConfirmedTaskText] = useState('');
  const [questIndex, setQuestIndex] = useState(0);
  const [smallerMode, setSmallerMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const effectiveContext = manualContext ?? suggestedContext;
  const isTooBigFlow = stuckType === 'too-big';
  const showContextStage = isTooBigFlow && tooBigStage === 'context';
  const showQuestStage = Boolean(stuckType) && (!isTooBigFlow || tooBigStage === 'quest');

  const contextColumns =
    viewportWidth >= 1024 ? 3 : viewportWidth >= 700 ? 3 : viewportWidth >= 350 ? 2 : 1;
  const contextGap = viewportWidth >= 1024 ? 16 : viewportWidth >= 350 ? 12 : 10;

  const quests = useMemo(() => {
    if (!stuckType) return [];
    const base = getTinyQuests(stuckType, profile?.energyLevel);
    if (stuckType === 'too-big' && confirmedContext) {
      return [buildContextFirstQuest(confirmedContext, confirmedTaskText), ...base];
    }
    return base;
  }, [stuckType, profile?.energyLevel, confirmedContext, confirmedTaskText]);

  const selectedStuck = stuckTypes.find((s) => s.id === stuckType);
  const selectedContextOption = taskContextOptions.find((o) => o.id === confirmedContext);
  const quest = quests[questIndex] ?? '';
  const displayQuest = smallerMode
    ? quest.split('.')[0] + ". That's literally it."
    : quest;

  const handleComplete = () => {
    completeQuest(quest, stuckType!);
    setMessage(getSupportiveMessage('start'));
    setShowSuccess(true);
  };

  const resetTooBigLocalState = (keepTaskText = false) => {
    setTooBigStage('context');
    setManualContext(null);
    setSuggestedContext(null);
    setConfirmedContext(null);
    setConfirmedTaskText('');
    if (!keepTaskText) setTaskText('');
    setQuestIndex(0);
    setSmallerMode(false);
  };

  const selectStuckType = (type: StuckType) => {
    setStuckType(type);
    setQuestIndex(0);
    setSmallerMode(false);
    if (type === 'too-big') {
      resetTooBigLocalState();
    } else {
      setTooBigStage('quest');
      setManualContext(null);
      setSuggestedContext(null);
      setConfirmedContext(null);
      setConfirmedTaskText('');
      setTaskText('');
    }
  };

  const returnToStuckTypes = () => {
    setStuckType(null);
    resetTooBigLocalState();
  };

  const handleTaskTextChange = (value: string) => {
    const next = value.slice(0, TASK_TEXT_MAX);
    setTaskText(next);
    const suggestion = suggestTaskContext(next);
    setSuggestedContext(suggestion);
  };

  const handleContinueToQuest = () => {
    if (!effectiveContext) return;
    setConfirmedContext(effectiveContext);
    setConfirmedTaskText(taskText.trim());
    setQuestIndex(0);
    setSmallerMode(false);
    setTooBigStage('quest');
  };

  const handleChangeTaskContext = () => {
    setTooBigStage('context');
    setQuestIndex(0);
    setSmallerMode(false);
    // Preserve typed task text; keep manual/suggested so cards stay selected.
  };

  return (
    <AppShell title="I Can't Start">
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {!showContextStage ? (
            <>
              <Text style={[styles.headline, { color: theme.text }]}>Starting is a task too.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                No pressure. Pick what kind of stuck you're in.
              </Text>
            </>
          ) : null}

          {!stuckType ? (
            <View style={styles.selectionStage}>
              <SectionHeader
                title="What kind of stuck is it?"
                subtitle="Choose the one that fits best. We'll give you one tiny next step."
              />
              <StuckOptionsGrid>
                {stuckTypes.map((type) => (
                  <StuckOptionCard
                    key={type.id}
                    option={type}
                    onPress={() => selectStuckType(type.id)}
                  />
                ))}
              </StuckOptionsGrid>
            </View>
          ) : null}

          {showContextStage ? (
            <View style={styles.contextStage}>
              <View style={styles.contextInner}>
                <Text style={[styles.contextEyebrow, { color: theme.textMuted }]}>
                  TASK FEELS TOO BIG
                </Text>
                <Text style={[styles.contextTitle, { color: theme.text }]}>
                  What are you trying to start?
                </Text>
                <Text style={[styles.contextSupport, { color: theme.textSecondary }]}>
                  Pick the closest match, or describe it in a few words. We'll use it to suggest a
                  smaller first step.
                </Text>

                <ContextOptionsGrid columns={contextColumns} gap={contextGap}>
                  {taskContextOptions.map((option) => {
                    const selected = effectiveContext === option.id;
                    const isSuggestedOnly =
                      !manualContext &&
                      suggestedContext === option.id &&
                      selected;
                    return (
                      <TaskContextCard
                        key={option.id}
                        option={option}
                        selected={selected}
                        suggested={isSuggestedOnly}
                        onPress={() => setManualContext(option.id)}
                      />
                    );
                  })}
                </ContextOptionsGrid>

                {!manualContext && suggestedContext ? (
                  <Text style={[styles.suggestionNote, { color: theme.textMuted }]}>
                    {suggestionNote(suggestedContext)}
                  </Text>
                ) : null}

                <View style={styles.taskFieldBlock}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    Or describe it in a few words
                  </Text>
                  <TextInput
                    value={taskText}
                    onChangeText={handleTaskTextChange}
                    placeholder="e.g. presentation, shower, reply to Ana"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="Or describe it in a few words"
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: inputFocused ? theme.accent : theme.surfaceBorder,
                      },
                      inputFocused && styles.taskInputFocused,
                    ]}
                  />
                </View>

                <View style={styles.continueWrap}>
                  <View
                    style={[
                      styles.continueBtnOuter,
                      !effectiveContext && styles.continueDisabled,
                    ]}
                    accessibilityState={{ disabled: !effectiveContext }}>
                    <GradientButton
                      label="Find my starting point"
                      onPress={() => {
                        if (!effectiveContext) return;
                        handleContinueToQuest();
                      }}
                      small
                      style={styles.continueBtn}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={returnToStuckTypes}
                  accessibilityRole="button"
                  accessibilityLabel="Choose a different stuck type"
                  style={styles.quietAction}>
                  <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                    Choose a different stuck type
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {showQuestStage ? (
            <>
              <GlassCard style={styles.stuckSelected}>
                <Text style={{ color: theme.textSecondary, ...typography.caption }}>Stuck type</Text>
                <View style={styles.stuckSelectedRow}>
                  <Text style={styles.stuckSelectedEmoji}>{selectedStuck?.emoji}</Text>
                  <Text
                    style={{
                      color: theme.text,
                      ...typography.body,
                      fontWeight: '600',
                      flex: 1,
                    }}>
                    {selectedStuck?.label}
                  </Text>
                </View>

                {isTooBigFlow && selectedContextOption ? (
                  <View style={styles.contextSummary}>
                    <Text style={[styles.contextSummaryLine, { color: theme.text }]}>
                      {selectedContextOption.emoji} {selectedContextOption.label}
                    </Text>
                    {confirmedTaskText ? (
                      <Text
                        style={[styles.contextSummaryTask, { color: theme.textSecondary }]}
                        numberOfLines={2}>
                        {confirmedTaskText}
                      </Text>
                    ) : null}
                    <Pressable
                      onPress={handleChangeTaskContext}
                      accessibilityRole="button"
                      accessibilityLabel="Change task context"
                      hitSlop={8}
                      style={styles.changeContextBtn}>
                      <Text style={[styles.changeContextText, { color: theme.accentSecondary }]}>
                        Change task context
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </GlassCard>

              <TinyQuestCard
                quest={displayQuest}
                onComplete={handleComplete}
                onSmaller={() => setSmallerMode(true)}
                onAnother={() => setQuestIndex((i) => (i + 1) % quests.length)}
              />

              <SupportiveMessage message="Your only job is the next tiny step. Not the whole thing." />

              <Pressable
                onPress={returnToStuckTypes}
                accessibilityRole="button"
                accessibilityLabel="Choose a different stuck type"
                style={styles.quietAction}>
                <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                  Choose a different stuck type
                </Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>

        <AppModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="That counts."
          message={message}
          primaryAction={{
            label: 'Log another win',
            onPress: () => {
              setShowSuccess(false);
              setStuckType(null);
              resetTooBigLocalState();
            },
          }}
        />
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  selectionStage: {
    width: '100%',
  },
  stuckGrid: {
    width: '100%',
    gap: STUCK_GRID_GAP,
  },
  stuckRow: {
    flexDirection: 'row',
    width: '100%',
    gap: STUCK_GRID_GAP,
    alignItems: 'stretch',
  },
  stuckCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  stuckCardPressable: {
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
  },
  stuckCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  stuckCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  stuckEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  stuckLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  stuckHint: {
    ...typography.caption,
    lineHeight: 17,
  },
  stuckSelected: { marginBottom: spacing.md },
  stuckSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stuckSelectedEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  contextStage: {
    width: '100%',
    alignItems: 'center',
  },
  contextInner: {
    width: '100%',
    maxWidth: CONTEXT_MAX_WIDTH,
    alignSelf: 'center',
  },
  contextEyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  contextTitle: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  contextSupport: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  contextGrid: {
    width: '100%',
  },
  contextRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  contextCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  contextCardPressable: {
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
  },
  contextCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
    justifyContent: 'center',
  },
  suggestedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginBottom: 2,
  },
  suggestedBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  contextEmoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  contextLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  contextDesc: {
    ...typography.caption,
    lineHeight: 16,
  },
  suggestionNote: {
    ...typography.caption,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  taskFieldBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  taskFieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  taskInput: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'web' ? 12 : spacing.sm + 2,
    ...typography.body,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none' } as object)
      : null),
  },
  taskInputFocused: {
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 3px rgba(255, 138, 122, 0.28)',
        } as object)
      : null),
  },
  continueWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  continueBtnOuter: {
    width: '100%',
    maxWidth: 280,
  },
  continueBtn: {
    width: '100%',
  },
  continueDisabled: {
    opacity: 0.45,
  },
  quietAction: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quietActionText: {
    ...typography.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  contextSummary: {
    marginTop: spacing.sm,
    gap: 4,
  },
  contextSummaryLine: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  contextSummaryTask: {
    ...typography.caption,
  },
  changeContextBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  changeContextText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
