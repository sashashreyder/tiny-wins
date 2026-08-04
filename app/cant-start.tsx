import { useMemo, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { AppModal } from '@/components/design-system/Modal';
import { TinyQuestCard } from '@/components/design-system/Cards';
import { stuckTypes } from '@/data/content';
import { TaskContext, taskFlowTemplates } from '@/data/cantStartFlows';
import { calculateXP, getSupportiveMessage, getTinyQuests } from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { StuckType, StuckTypeOption } from '@/types';

const STUCK_GRID_COLUMNS = 2;
const STUCK_GRID_GAP = spacing.md;
const CONTENT_MAX_WIDTH = 1040;
const TASK_TEXT_MAX = 100;
const CHECKLIST_MIN = 1;
const CHECKLIST_MAX = 6;
const STEP_XP = calculateXP('tiny-win');

type TooBigStage =
  | 'context'
  | 'support-choice'
  | 'single-step'
  | 'checklist-setup'
  | 'checklist-active'
  | 'session-complete';

type SupportMode = 'single-step' | 'checklist';

type TaskContextOption = {
  id: TaskContext;
  emoji: string;
  label: string;
  description: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
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

function makeChecklistDraft(steps: string[]): string[] {
  return steps.map((step) => step);
}

function makeChecklistItems(steps: string[]): ChecklistItem[] {
  return steps.map((text, index) => ({
    id: `check-${index}-${Date.now()}`,
    text,
    completed: false,
  }));
}

function InternalBack({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.internalBack}>
      <Text style={[styles.internalBackText, { color: theme.textSecondary }]}>← {label}</Text>
    </Pressable>
  );
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
      style={({ pressed }) => [styles.stuckCardPressable, pressed && styles.pressed]}>
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
  suggested,
  onPress,
}: {
  option: TaskContextOption;
  suggested?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={suggested ? `${option.label}, suggested` : option.label}
      style={({ pressed }) => [styles.contextCardPressable, pressed && styles.pressed]}>
      <View
        style={[
          styles.contextCard,
          {
            backgroundColor: suggested ? theme.accentTertiary + 'CC' : theme.surface,
            borderColor: suggested ? theme.accent : theme.surfaceBorder,
            borderWidth: suggested ? 2 : 1,
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

function SupportChoiceCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.supportCardPressable, pressed && styles.pressed]}>
      <View
        style={[
          styles.supportCard,
          { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
        ]}>
        <Text style={styles.supportIcon}>{icon}</Text>
        <Text style={[styles.supportTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.supportDesc, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default function CantStartScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const completeQuest = useAppStore((s) => s.completeCantStartQuest);
  const addTinyWin = useAppStore((s) => s.addTinyWin);
  const markAchievementEvent = useAppStore((s) => s.markAchievementEvent);
  const profile = useAppStore((s) => s.userProfile);

  const [stuckType, setStuckType] = useState<StuckType | null>(null);
  const [tooBigStage, setTooBigStage] = useState<TooBigStage>('context');
  const [manualContext, setManualContext] = useState<TaskContext | null>(null);
  const [suggestedContext, setSuggestedContext] = useState<TaskContext | null>(null);
  const [taskText, setTaskText] = useState('');
  const [confirmedContext, setConfirmedContext] = useState<TaskContext | null>(null);
  const [confirmedTaskText, setConfirmedTaskText] = useState('');
  const [lastSupportMode, setLastSupportMode] = useState<SupportMode | null>(null);

  const [singleStepIndex, setSingleStepIndex] = useState(0);
  const [awardedSingleSteps, setAwardedSingleSteps] = useState<Record<number, boolean>>({});
  const [singleStepJustDone, setSingleStepJustDone] = useState(false);
  const singleStepLockRef = useRef(false);

  const [checklistDraft, setChecklistDraft] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistSetupError, setChecklistSetupError] = useState('');
  const [editingChecklist, setEditingChecklist] = useState(false);

  const [sessionCompletedSteps, setSessionCompletedSteps] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [hasMarkedCantStart, setHasMarkedCantStart] = useState(false);

  const [describeMode, setDescribeMode] = useState(false);
  const [questIndex, setQuestIndex] = useState(0);
  const [smallerMode, setSmallerMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const isTooBigFlow = stuckType === 'too-big';
  const showContextStage = isTooBigFlow && tooBigStage === 'context';
  const showOtherQuestStage = Boolean(stuckType) && !isTooBigFlow;
  const suggestedContextOption = taskContextOptions.find((o) => o.id === suggestedContext);

  const flowTemplate = confirmedContext ? taskFlowTemplates[confirmedContext] : null;
  const singleSteps = flowTemplate?.singleSteps ?? [];
  const winCategory = flowTemplate?.category ?? 'work-study';

  const contextColumns =
    viewportWidth >= 1024 ? 3 : viewportWidth >= 700 ? 3 : viewportWidth >= 350 ? 2 : 1;
  const contextGap = viewportWidth >= 1024 ? 16 : viewportWidth >= 350 ? 12 : 10;
  const supportStacked = viewportWidth < 640;

  const quests = useMemo(() => {
    if (!stuckType || stuckType === 'too-big') return [];
    return getTinyQuests(stuckType, profile?.energyLevel);
  }, [stuckType, profile?.energyLevel]);

  const selectedStuck = stuckTypes.find((s) => s.id === stuckType);
  const selectedContextOption = taskContextOptions.find((o) => o.id === confirmedContext);
  const quest = quests[questIndex] ?? '';
  const displayQuest = smallerMode
    ? quest.split('.')[0] + ". That's literally it."
    : quest;

  const checklistCompleteCount = checklistItems.filter((item) => item.completed).length;
  const nextIncompleteIndex = checklistItems.findIndex((item) => !item.completed);

  const awardStepWin = (title: string) => {
    addTinyWin(title.slice(0, 80) || 'Started while stuck', winCategory, false);
    setSessionCompletedSteps((n) => n + 1);
    setSessionXpEarned((xp) => xp + STEP_XP);
    if (!hasMarkedCantStart) {
      markAchievementEvent('cant-start-quest');
      setHasMarkedCantStart(true);
    }
  };

  const resetSessionProgress = () => {
    setSingleStepIndex(0);
    setAwardedSingleSteps({});
    setSingleStepJustDone(false);
    singleStepLockRef.current = false;
    setChecklistDraft([]);
    setChecklistItems([]);
    setChecklistSetupError('');
    setEditingChecklist(false);
    setSessionCompletedSteps(0);
    setSessionXpEarned(0);
    setHasMarkedCantStart(false);
    setLastSupportMode(null);
  };

  const resetTooBigLocalState = () => {
    setTooBigStage('context');
    setManualContext(null);
    setSuggestedContext(null);
    setConfirmedContext(null);
    setConfirmedTaskText('');
    setTaskText('');
    setDescribeMode(false);
    resetSessionProgress();
  };

  const selectStuckType = (type: StuckType) => {
    setStuckType(type);
    setQuestIndex(0);
    setSmallerMode(false);
    if (type === 'too-big') {
      resetTooBigLocalState();
    } else {
      setTooBigStage('context');
      setManualContext(null);
      setSuggestedContext(null);
      setConfirmedContext(null);
      setConfirmedTaskText('');
      setTaskText('');
      resetSessionProgress();
    }
  };

  const returnToStuckTypes = () => {
    setStuckType(null);
    resetTooBigLocalState();
  };

  const handleTaskTextChange = (value: string) => {
    const next = value.slice(0, TASK_TEXT_MAX);
    setTaskText(next);
    setSuggestedContext(suggestTaskContext(next));
  };

  const confirmContextAndContinue = (context: TaskContext) => {
    setManualContext(context);
    setConfirmedContext(context);
    setConfirmedTaskText(taskText.trim());
    setTooBigStage('support-choice');
  };

  const startSingleStepMode = () => {
    setLastSupportMode('single-step');
    setSingleStepIndex(0);
    setSingleStepJustDone(false);
    singleStepLockRef.current = false;
    setTooBigStage('single-step');
  };

  const startChecklistSetup = () => {
    if (!confirmedContext) return;
    setLastSupportMode('checklist');
    setChecklistDraft(makeChecklistDraft(taskFlowTemplates[confirmedContext].checklistSteps));
    setChecklistSetupError('');
    setEditingChecklist(false);
    setTooBigStage('checklist-setup');
  };

  const handleSingleStepDone = () => {
    if (singleStepJustDone || singleStepLockRef.current || awardedSingleSteps[singleStepIndex]) {
      return;
    }
    singleStepLockRef.current = true;
    setSingleStepJustDone(true);

    const stepText = singleSteps[singleStepIndex];
    if (stepText) {
      awardStepWin(stepText);
      setAwardedSingleSteps((prev) => ({ ...prev, [singleStepIndex]: true }));
    }
  };

  const handleSingleStepSkip = () => {
    singleStepLockRef.current = false;
    if (singleStepIndex >= singleSteps.length - 1) {
      setTooBigStage('session-complete');
      return;
    }
    setSingleStepIndex((i) => i + 1);
    setSingleStepJustDone(false);
  };

  const handleGiveNextStep = () => {
    singleStepLockRef.current = false;
    if (singleStepIndex >= singleSteps.length - 1) {
      setTooBigStage('session-complete');
      return;
    }
    setSingleStepIndex((i) => i + 1);
    setSingleStepJustDone(false);
  };

  const updateChecklistDraft = (index: number, value: string) => {
    setChecklistDraft((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const removeChecklistDraftStep = (index: number) => {
    setChecklistDraft((prev) => {
      if (prev.length <= CHECKLIST_MIN) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const addChecklistDraftStep = () => {
    setChecklistDraft((prev) => {
      if (prev.length >= CHECKLIST_MAX) return prev;
      return [...prev, ''];
    });
  };

  const resetChecklistExample = () => {
    if (!confirmedContext) return;
    setChecklistDraft(makeChecklistDraft(taskFlowTemplates[confirmedContext].checklistSteps));
    setChecklistSetupError('');
  };

  const useChecklistFromSteps = (steps: string[]) => {
    const cleaned = steps.map((step) => step.trim()).filter(Boolean);
    if (cleaned.length < CHECKLIST_MIN) {
      setChecklistSetupError('Add at least one step before starting.');
      return;
    }
    if (cleaned.length > CHECKLIST_MAX) {
      setChecklistSetupError(`Keep it to ${CHECKLIST_MAX} steps or fewer.`);
      return;
    }
    setChecklistSetupError('');
    setChecklistItems(makeChecklistItems(cleaned));
    setEditingChecklist(false);
    setTooBigStage('checklist-active');
  };

  const useThisChecklist = () => {
    if (!confirmedContext) return;
    useChecklistFromSteps(
      editingChecklist
        ? checklistDraft
        : taskFlowTemplates[confirmedContext].checklistSteps,
    );
  };

  const completeChecklistItem = (id: string) => {
    const item = checklistItems.find((row) => row.id === id);
    if (!item || item.completed) return;

    awardStepWin(item.text);

    const nextItems = checklistItems.map((row) =>
      row.id === id ? { ...row, completed: true } : row,
    );
    setChecklistItems(nextItems);

    if (nextItems.every((row) => row.completed)) {
      setTooBigStage('session-complete');
    }
  };

  const editOrRestartChecklist = () => {
    setChecklistDraft(
      checklistItems.length
        ? checklistItems.map((item) => item.text)
        : confirmedContext
          ? makeChecklistDraft(taskFlowTemplates[confirmedContext].checklistSteps)
          : [],
    );
    setChecklistSetupError('');
    setEditingChecklist(false);
    setTooBigStage('checklist-setup');
  };

  const keepWorkingHere = () => {
    if (lastSupportMode === 'checklist') {
      setTooBigStage(checklistItems.length ? 'checklist-active' : 'checklist-setup');
      return;
    }
    setTooBigStage('single-step');
    setSingleStepJustDone(false);
  };

  const handleOtherComplete = () => {
    completeQuest(quest, stuckType!);
    setMessage(getSupportiveMessage('start'));
    setShowSuccess(true);
  };

  const compactBtn = styles.compactBtn;

  return (
    <AppShell title="I Can't Start">
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {!stuckType ? (
            <View style={styles.selectionStage}>
              <Text style={[styles.headline, { color: theme.text }]}>Starting is a task too.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                No pressure. Pick what kind of stuck you're in.
              </Text>
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
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>TASK FEELS TOO BIG</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  What are you trying to start?
                </Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                  Tap the closest match. We’ll take you straight to a smaller way in.
                </Text>

                <ContextOptionsGrid columns={contextColumns} gap={contextGap}>
                  {taskContextOptions.map((option) => (
                    <TaskContextCard
                      key={option.id}
                      option={option}
                      suggested={describeMode && suggestedContext === option.id}
                      onPress={() => confirmContextAndContinue(option.id)}
                    />
                  ))}
                </ContextOptionsGrid>

                {!describeMode ? (
                  <Pressable
                    onPress={() => setDescribeMode(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Not sure? Describe it in a few words"
                    style={styles.quietAction}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      Not sure? Describe it in a few words
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.taskFieldBlock}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                      Describe it in a few words
                    </Text>
                    <TextInput
                      value={taskText}
                      onChangeText={handleTaskTextChange}
                      placeholder="e.g. presentation, shower, reply to Ana"
                      placeholderTextColor={theme.textMuted}
                      maxLength={TASK_TEXT_MAX}
                      accessibilityLabel="Describe it in a few words"
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

                    {suggestedContext && suggestedContextOption ? (
                      <>
                        <Text style={[styles.suggestionNote, { color: theme.textMuted }]}>
                          {suggestionNote(suggestedContext)}
                        </Text>
                        <View style={styles.continueWrap}>
                          <View style={styles.continueBtnOuter}>
                            <GradientButton
                              label={`Continue with ${suggestedContextOption.label}`}
                              onPress={() => confirmContextAndContinue(suggestedContext)}
                              small
                              style={styles.continueBtn}
                            />
                          </View>
                        </View>
                      </>
                    ) : taskText.trim() ? (
                      <Text style={[styles.suggestionNote, { color: theme.textMuted }]}>
                        We’re not sure yet. Pick the closest option above.
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'support-choice' ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <InternalBack
                  label="Back to task context"
                  onPress={() => setTooBigStage('context')}
                />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>TASK FEELS TOO BIG</Text>
                {confirmedTaskText ? (
                  <Text style={[styles.taskSummary, { color: theme.textSecondary }]}>
                    Working on: {confirmedTaskText}
                  </Text>
                ) : null}
                {selectedContextOption ? (
                  <Text style={[styles.taskSummary, { color: theme.textMuted }]}>
                    {selectedContextOption.emoji} {selectedContextOption.label}
                  </Text>
                ) : null}
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  How should we make this easier?
                </Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                  Choose the kind of help that feels manageable right now.
                </Text>

                <View
                  style={[
                    styles.supportRow,
                    supportStacked && styles.supportRowStacked,
                    { gap: supportStacked ? spacing.md : spacing.lg },
                  ]}>
                  <SupportChoiceCard
                    icon="→"
                    title="One step at a time"
                    description="Show me one small action, then let me decide what comes next."
                    onPress={startSingleStepMode}
                  />
                  <SupportChoiceCard
                    icon="✓"
                    title="Make a tiny checklist"
                    description="Give me a short example plan I can use or adjust."
                    onPress={startChecklistSetup}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'single-step' && flowTemplate ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <InternalBack
                  label="Back to help options"
                  onPress={() => {
                    setSingleStepJustDone(false);
                    setTooBigStage('support-choice');
                  }}
                />

                {selectedContextOption ? (
                  <Text style={[styles.taskSummary, { color: theme.textMuted }]}>
                    {selectedContextOption.emoji} {selectedContextOption.label}
                    {confirmedTaskText ? ` · ${confirmedTaskText}` : ''}
                  </Text>
                ) : null}

                {singleStepJustDone ? (
                  <GlassCard style={styles.panelCard}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>
                      That moved the task forward.
                    </Text>
                    <Text style={[styles.panelBody, { color: theme.textSecondary }]}>
                      Small progress is still real progress.
                    </Text>
                    <View style={styles.actionStack}>
                      {singleStepIndex < singleSteps.length - 1 ? (
                        <View style={compactBtn}>
                          <GradientButton
                            label="Give me the next step"
                            onPress={handleGiveNextStep}
                            small
                          />
                        </View>
                      ) : (
                        <View style={compactBtn}>
                          <GradientButton
                            label="That was enough for now"
                            onPress={() => setTooBigStage('session-complete')}
                            small
                          />
                        </View>
                      )}
                      <GradientButton
                        label="Build a checklist instead"
                        onPress={startChecklistSetup}
                        variant="secondary"
                        small
                        style={compactBtn}
                      />
                      {singleStepIndex < singleSteps.length - 1 ? (
                        <Pressable
                          onPress={() => setTooBigStage('session-complete')}
                          accessibilityRole="button"
                          style={styles.quietAction}>
                          <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                            That was enough for now
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </GlassCard>
                ) : (
                  <GlassCard style={styles.panelCard}>
                    <Text style={[styles.stepLabel, { color: theme.textMuted }]}>
                      YOUR NEXT TINY STEP
                    </Text>
                    <Text style={[styles.stepProgress, { color: theme.textSecondary }]}>
                      Step {singleStepIndex + 1} of {singleSteps.length}
                    </Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>
                      {singleSteps[singleStepIndex]}
                    </Text>

                    <View style={styles.actionStack}>
                      <View style={compactBtn}>
                        <GradientButton
                          label={`I did this · +${STEP_XP} XP`}
                          onPress={handleSingleStepDone}
                          small
                        />
                      </View>
                      <Pressable
                        onPress={handleSingleStepSkip}
                        accessibilityRole="button"
                        style={styles.quietAction}>
                        <Text style={[styles.quietActionText, { color: theme.textSecondary }]}>
                          This step doesn’t fit
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                )}
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'checklist-setup' && confirmedContext ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <InternalBack
                  label="Back to help options"
                  onPress={() => setTooBigStage('support-choice')}
                />
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  {editingChecklist ? 'Let’s make this smaller.' : 'Here’s a tiny example plan.'}
                </Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                  {editingChecklist
                    ? 'Change the steps so they fit your task.'
                    : 'You can use it as-is or change it to fit your task.'}
                </Text>
                {confirmedTaskText ? (
                  <Text style={[styles.taskSummary, { color: theme.textMuted }]}>
                    Working on: {confirmedTaskText}
                  </Text>
                ) : null}

                {!editingChecklist ? (
                  <View style={styles.checklistActive}>
                    {checklistDraft.map((step, index) => (
                      <View
                        key={`preview-${index}`}
                        style={[
                          styles.checkRow,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.surfaceBorder,
                          },
                        ]}>
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: theme.surfaceBorder, backgroundColor: 'transparent' },
                          ]}
                        />
                        <Text style={[styles.checkText, { color: theme.text }]}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <>
                    <View style={styles.checklistEditor}>
                      {checklistDraft.map((step, index) => (
                        <View key={`draft-${index}`} style={styles.draftRow}>
                          <TextInput
                            value={step}
                            onChangeText={(value) => updateChecklistDraft(index, value)}
                            placeholder={`Step ${index + 1}`}
                            placeholderTextColor={theme.textMuted}
                            accessibilityLabel={`Checklist step ${index + 1}`}
                            style={[
                              styles.draftInput,
                              {
                                color: theme.text,
                                backgroundColor: theme.surface,
                                borderColor: theme.surfaceBorder,
                              },
                            ]}
                          />
                          <Pressable
                            onPress={() => removeChecklistDraftStep(index)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete step ${index + 1}`}
                            disabled={checklistDraft.length <= CHECKLIST_MIN}
                            style={[
                              styles.deleteStepBtn,
                              checklistDraft.length <= CHECKLIST_MIN && { opacity: 0.35 },
                            ]}>
                            <Text style={{ color: theme.textMuted, fontWeight: '700' }}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>

                    {checklistDraft.length < CHECKLIST_MAX ? (
                      <Pressable
                        onPress={addChecklistDraftStep}
                        accessibilityRole="button"
                        style={styles.quietActionLeft}>
                        <Text style={[styles.quietActionText, { color: theme.accentSecondary }]}>
                          + Add another step
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                )}

                {checklistSetupError ? (
                  <Text style={[styles.setupError, { color: theme.accent }]}>
                    {checklistSetupError}
                  </Text>
                ) : null}

                <View style={styles.actionStack}>
                  <View style={compactBtn}>
                    <GradientButton
                      label={editingChecklist ? 'Use my checklist' : 'Use this checklist'}
                      onPress={useThisChecklist}
                      small
                    />
                  </View>
                  {!editingChecklist ? (
                    <GradientButton
                      label="Customize it"
                      onPress={() => setEditingChecklist(true)}
                      variant="secondary"
                      small
                      style={compactBtn}
                    />
                  ) : (
                    <GradientButton
                      label="Reset example"
                      onPress={resetChecklistExample}
                      variant="ghost"
                      small
                      style={compactBtn}
                    />
                  )}
                </View>
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'checklist-active' ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <InternalBack
                  label="Back to help options"
                  onPress={() => setTooBigStage('support-choice')}
                />
                <Text style={[styles.stageTitle, { color: theme.text }]}>Your tiny checklist</Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                  {checklistCompleteCount} of {checklistItems.length} complete
                </Text>

                <View style={styles.checklistActive}>
                  {checklistItems.map((item, index) => {
                    const isNext = index === nextIncompleteIndex;
                    const rowContent = (
                      <>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: item.completed
                                ? theme.accentSecondary
                                : theme.surfaceBorder,
                              backgroundColor: item.completed
                                ? theme.accentSecondary + '55'
                                : 'transparent',
                            },
                          ]}>
                          {item.completed ? (
                            <Text style={{ color: theme.text, fontWeight: '700' }}>✓</Text>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.checkText,
                            {
                              color: theme.text,
                              textDecorationLine: item.completed ? 'line-through' : 'none',
                            },
                          ]}>
                          {item.text}
                        </Text>
                        {!item.completed ? (
                          <Text style={[styles.rowXp, { color: theme.textMuted }]}>
                            +{STEP_XP} XP
                          </Text>
                        ) : null}
                      </>
                    );

                    if (item.completed) {
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.checkRow,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.surfaceBorder,
                              opacity: 0.72,
                            },
                          ]}>
                          {rowContent}
                        </View>
                      );
                    }

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => completeChecklistItem(item.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: false, disabled: false }}
                        accessibilityLabel={item.text}
                        style={({ pressed }) => [
                          styles.checkRow,
                          {
                            backgroundColor: theme.surface,
                            borderColor: isNext ? theme.accent : theme.surfaceBorder,
                            borderWidth: isNext ? 2 : 1,
                          },
                          pressed && styles.pressed,
                        ]}>
                        {rowContent}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.actionStack}>
                  <View style={compactBtn}>
                    <GradientButton
                      label="That’s enough for now"
                      onPress={() => setTooBigStage('session-complete')}
                      small
                    />
                  </View>
                  <GradientButton
                    label="Customize or restart"
                    onPress={editOrRestartChecklist}
                    variant="ghost"
                    small
                    style={compactBtn}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'session-complete' ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <GlassCard style={styles.panelCard}>
                  <Text style={[styles.panelTitle, { color: theme.text }]}>
                    {sessionCompletedSteps > 0
                      ? 'You moved the task forward.'
                      : 'That’s okay. You can come back later.'}
                  </Text>
                  <Text style={[styles.panelBody, { color: theme.textSecondary }]}>
                    {sessionCompletedSteps > 0
                      ? 'Small progress is still real progress.'
                      : 'Choosing to pause counts too.'}
                  </Text>
                  {sessionCompletedSteps > 0 ? (
                    <View style={styles.sessionStats}>
                      <Text style={[styles.sessionStat, { color: theme.text }]}>
                        {sessionCompletedSteps} step{sessionCompletedSteps === 1 ? '' : 's'}{' '}
                        completed
                      </Text>
                      <Text style={[styles.sessionStat, { color: theme.text }]}>
                        +{sessionXpEarned} XP earned
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.actionStack}>
                    <View style={compactBtn}>
                      <GradientButton
                        label="Back to dashboard"
                        onPress={() => router.push('/dashboard' as never)}
                        small
                      />
                    </View>
                    <GradientButton
                      label="Choose another stuck type"
                      onPress={returnToStuckTypes}
                      variant="secondary"
                      small
                      style={compactBtn}
                    />
                    <Pressable
                      onPress={keepWorkingHere}
                      accessibilityRole="button"
                      style={styles.quietAction}>
                      <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                        Keep working here
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {showOtherQuestStage ? (
            <>
              <Text style={[styles.headline, { color: theme.text }]}>Starting is a task too.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                No pressure. Pick what kind of stuck you're in.
              </Text>
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
              </GlassCard>

              <TinyQuestCard
                quest={displayQuest}
                onComplete={handleOtherComplete}
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
  pressed: {
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
  stageShell: {
    width: '100%',
    alignItems: 'center',
  },
  stageInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
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
  eyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  stageTitle: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  stageSupport: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  taskSummary: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
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
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
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
  supportRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  supportRowStacked: {
    flexDirection: 'column',
  },
  supportCardPressable: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  supportCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  supportIcon: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  supportTitle: {
    ...typography.h3,
  },
  supportDesc: {
    ...typography.bodySmall,
  },
  panelCard: {
    gap: spacing.sm,
  },
  panelTitle: {
    ...typography.h2,
  },
  panelBody: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  stepLabel: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  stepProgress: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  stepText: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  actionStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  compactBtn: {
    width: '100%',
    maxWidth: 280,
  },
  quietAction: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quietActionLeft: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  quietActionText: {
    ...typography.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  checklistEditor: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  draftInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'web' ? 12 : spacing.sm + 2,
    ...typography.body,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  deleteStepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupError: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  checklistActive: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 56,
    borderWidth: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkText: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
  },
  rowXp: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 0,
  },
  sessionStats: {
    gap: 4,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sessionStat: {
    ...typography.body,
    fontWeight: '600',
  },
});
