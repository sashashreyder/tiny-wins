import { useEffect, useMemo, useState } from 'react';
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
const CHECKLIST_DESKTOP_MAX_WIDTH = 860;
const CHECKLIST_NARROW_BREAKPOINT = 900;
const SUCCESS_DESKTOP_MAX_WIDTH = 820;
const TASK_TEXT_MAX = 100;
const CHECKLIST_MAX = 6;
const STEP_XP = calculateXP('tiny-win');

const COMPLETION_HEADLINES = [
  'You did it!',
  'Nice job — that counts.',
  'You moved the task forward!',
  'Small step, real progress.',
  'You showed up — that matters.',
  'That was a real win.',
];

const COMPLETION_SUPPORT_LINES = [
  'Small progress is still real progress.',
  'You didn’t have to finish everything to make it count.',
  'Tiny effort still moves your day forward.',
];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

type TooBigStage = 'context' | 'checklist-active' | 'session-complete';

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

function ChecklistRow({
  item,
  isNext,
  isEditing,
  editingText,
  onEditingTextChange,
  onComplete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  stepXp,
}: {
  item: ChecklistItem;
  isNext: boolean;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onComplete: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  stepXp: number;
}) {
  const theme = useAppTheme();

  if (isEditing) {
    return (
      <View
        style={[
          styles.checkRow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.accent,
            borderWidth: 2,
          },
        ]}>
        <TextInput
          value={editingText}
          onChangeText={onEditingTextChange}
          placeholder="Step text"
          placeholderTextColor={theme.textMuted}
          autoFocus
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onSaveEdit}
          accessibilityLabel={`Edit step: ${item.text || 'new step'}`}
          style={[
            styles.editInput,
            {
              color: theme.text,
              backgroundColor: theme.background,
              borderColor: theme.surfaceBorder,
            },
          ]}
        />
        <Pressable
          onPress={onSaveEdit}
          accessibilityRole="button"
          accessibilityLabel="Save step"
          style={[styles.editSaveBtn, { backgroundColor: theme.accentSecondary + '44' }]}>
          <Text style={[styles.editSaveText, { color: theme.text }]}>Save</Text>
        </Pressable>
        <Pressable
          onPress={onCancelEdit}
          accessibilityRole="button"
          accessibilityLabel="Cancel edit"
          hitSlop={8}
          style={styles.editCancelBtn}>
          <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
        </Pressable>
      </View>
    );
  }

  const rowBorder = item.completed
    ? theme.surfaceBorder
    : isNext
      ? theme.accent
      : theme.surfaceBorder;

  return (
    <View
      style={[
        styles.checkRow,
        {
          backgroundColor: theme.surface,
          borderColor: rowBorder,
          borderWidth: !item.completed && isNext ? 2 : 1,
          opacity: item.completed ? 0.72 : 1,
        },
      ]}>
      {item.completed ? (
        <View style={styles.checkRowMain} accessibilityRole="text">
          <View
            style={[
              styles.checkbox,
              {
                borderColor: theme.accentSecondary,
                backgroundColor: theme.accentSecondary + '55',
              },
            ]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>✓</Text>
          </View>
          <Text
            style={[
              styles.checkText,
              { color: theme.text, textDecorationLine: 'line-through' },
            ]}>
            {item.text}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={onComplete}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: false }}
          accessibilityLabel={`Complete: ${item.text}`}
          style={({ pressed }) => [styles.checkRowMain, pressed && styles.pressed]}>
          <View
            style={[
              styles.checkbox,
              { borderColor: theme.surfaceBorder, backgroundColor: 'transparent' },
            ]}
          />
          <Text style={[styles.checkText, { color: theme.text }]}>{item.text}</Text>
          <Text style={[styles.rowXp, { color: theme.textMuted }]}>+{stepXp} XP</Text>
        </Pressable>
      )}
      <View style={styles.rowActions}>
        <Pressable
          onPress={onStartEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit: ${item.text}`}
          style={({ pressed }) => [
            styles.rowIconBtn,
            { backgroundColor: theme.accentSecondary + '22' },
            pressed && styles.rowIconBtnPressed,
          ]}>
          <Text style={[styles.rowEditIcon, { color: theme.accentSecondary }]}>✎</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete: ${item.text}`}
          style={({ pressed }) => [
            styles.rowIconBtn,
            { backgroundColor: theme.accent + '18' },
            pressed && styles.rowIconBtnPressed,
          ]}>
          <Text style={[styles.rowDeleteIcon, { color: theme.accent }]}>🗑</Text>
        </Pressable>
      </View>
    </View>
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

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [sessionCompletedSteps, setSessionCompletedSteps] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [hasMarkedCantStart, setHasMarkedCantStart] = useState(false);
  const [sessionCompleteCopy, setSessionCompleteCopy] = useState<{
    headline: string;
    support: string;
  } | null>(null);

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
  const winCategory = flowTemplate?.category ?? 'work-study';

  const contextColumns =
    viewportWidth >= 1024 ? 3 : viewportWidth >= 700 ? 3 : viewportWidth >= 350 ? 2 : 1;
  const contextGap = viewportWidth >= 1024 ? 16 : viewportWidth >= 350 ? 12 : 10;
  const isChecklistNarrow = viewportWidth >= CHECKLIST_NARROW_BREAKPOINT;
  const isSuccessNarrow = viewportWidth >= CHECKLIST_NARROW_BREAKPOINT;
  const isDesktopLayout = viewportWidth >= 768;
  const checklistTitleStyle = {
    fontSize: isDesktopLayout ? 40 : 32,
    lineHeight: isDesktopLayout ? 46 : 38,
    fontWeight: '700' as const,
  };
  const checklistSupportStyle = {
    fontSize: isDesktopLayout ? 19 : 17,
    lineHeight: isDesktopLayout ? 28 : 24,
    fontWeight: '400' as const,
  };

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

  useEffect(() => {
    if (tooBigStage !== 'session-complete' || sessionCompletedSteps <= 0 || sessionCompleteCopy) {
      return;
    }
    setSessionCompleteCopy({
      headline: pickRandom(COMPLETION_HEADLINES),
      support: pickRandom(COMPLETION_SUPPORT_LINES),
    });
  }, [tooBigStage, sessionCompletedSteps, sessionCompleteCopy]);

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
    setChecklistItems([]);
    setEditingItemId(null);
    setEditingText('');
    setSessionCompletedSteps(0);
    setSessionXpEarned(0);
    setHasMarkedCantStart(false);
    setSessionCompleteCopy(null);
  };

  const resetTooBigLocalState = () => {
    setTooBigStage('context');
    setManualContext(null);
    setSuggestedContext(null);
    setConfirmedContext(null);
    setConfirmedTaskText('');
    setTaskText('');
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

  const confirmContextAndOpenChecklist = (context: TaskContext) => {
    setManualContext(context);
    setConfirmedContext(context);
    setConfirmedTaskText(taskText.trim());
    setEditingItemId(null);
    setEditingText('');
    setSessionCompletedSteps(0);
    setSessionXpEarned(0);
    setHasMarkedCantStart(false);
    setSessionCompleteCopy(null);
    setChecklistItems(makeChecklistItems(taskFlowTemplates[context].checklistSteps));
    setTooBigStage('checklist-active');
  };

  const returnToTaskContext = () => {
    setTooBigStage('context');
    setChecklistItems([]);
    setEditingItemId(null);
    setEditingText('');
    setConfirmedContext(null);
  };

  const completeChecklistItem = (id: string) => {
    const item = checklistItems.find((row) => row.id === id);
    if (!item || item.completed || !item.text.trim()) return;

    awardStepWin(item.text);

    const nextItems = checklistItems.map((row) =>
      row.id === id ? { ...row, completed: true } : row,
    );
    setChecklistItems(nextItems);

    if (nextItems.every((row) => row.completed)) {
      setTooBigStage('session-complete');
    }
  };

  const startEditItem = (id: string) => {
    const item = checklistItems.find((row) => row.id === id);
    if (!item) return;
    setEditingItemId(id);
    setEditingText(item.text);
  };

  const saveItemEdit = (id: string) => {
    const trimmed = editingText.trim();
    const item = checklistItems.find((row) => row.id === id);
    if (!trimmed) {
      if (item && !item.text.trim()) {
        setChecklistItems((prev) => prev.filter((row) => row.id !== id));
      }
      setEditingItemId(null);
      setEditingText('');
      return;
    }
    setChecklistItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, text: trimmed } : row)),
    );
    setEditingItemId(null);
    setEditingText('');
  };

  const cancelItemEdit = (id: string) => {
    const item = checklistItems.find((row) => row.id === id);
    if (item && !item.text.trim()) {
      setChecklistItems((prev) => prev.filter((row) => row.id !== id));
    }
    setEditingItemId(null);
    setEditingText('');
  };

  const addChecklistStep = () => {
    if (checklistItems.length >= CHECKLIST_MAX || editingItemId) return;
    const newId = `check-new-${Date.now()}`;
    setChecklistItems((prev) => [...prev, { id: newId, text: '', completed: false }]);
    setEditingItemId(newId);
    setEditingText('');
  };

  const deleteChecklistItem = (id: string) => {
    if (editingItemId === id) {
      setEditingItemId(null);
      setEditingText('');
    }
    setChecklistItems((prev) => prev.filter((row) => row.id !== id));
  };

  const keepWorkingHere = () => {
    setTooBigStage('checklist-active');
  };

  const backToChecklist = () => {
    setTooBigStage('checklist-active');
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
                      suggested={
                        Boolean(suggestedContext && taskText.trim() && suggestedContext === option.id)
                      }
                      onPress={() => confirmContextAndOpenChecklist(option.id)}
                    />
                  ))}
                </ContextOptionsGrid>

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

                  {suggestedContext && suggestedContextOption ? (
                    <>
                      <Text style={[styles.suggestionNote, { color: theme.textMuted }]}>
                        {suggestionNote(suggestedContext)}
                      </Text>
                      <View style={styles.continueWrap}>
                        <View style={styles.continueBtnOuter}>
                          <GradientButton
                            label={`Continue with ${suggestedContextOption.label}`}
                            onPress={() => confirmContextAndOpenChecklist(suggestedContext)}
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
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'checklist-active' ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <View
                  style={[
                    styles.checklistInner,
                    isChecklistNarrow && styles.checklistInnerDesktop,
                  ]}>
                  <Pressable
                    onPress={returnToTaskContext}
                    accessibilityRole="button"
                    accessibilityLabel="Back to task context"
                    style={styles.checklistBack}>
                    <Text
                      style={[
                        styles.checklistBackText,
                        isChecklistNarrow
                          ? styles.checklistBackTextDesktop
                          : styles.checklistBackTextMobile,
                        { color: theme.textSecondary },
                      ]}>
                      ← Back to task context
                    </Text>
                  </Pressable>
                  <Text
                    style={[
                      styles.checklistEyebrow,
                      isChecklistNarrow
                        ? styles.checklistEyebrowDesktop
                        : styles.checklistEyebrowMobile,
                      { color: theme.textMuted },
                    ]}>
                    TASK FEELS TOO BIG
                  </Text>
                  {selectedContextOption ? (
                    <Text
                      style={[
                        styles.checklistContextSummary,
                        isChecklistNarrow
                          ? styles.checklistContextSummaryDesktop
                          : styles.checklistContextSummaryMobile,
                        { color: theme.text },
                      ]}>
                      {selectedContextOption.emoji} {selectedContextOption.label}
                    </Text>
                  ) : null}
                  {confirmedTaskText ? (
                    <Text style={[styles.checklistTaskNote, { color: theme.textSecondary }]}>
                      {confirmedTaskText}
                    </Text>
                  ) : null}
                  <Text style={[checklistTitleStyle, { color: theme.text, marginBottom: spacing.sm }]}>
                    Let&apos;s make this smaller.
                  </Text>
                  <Text
                    style={[
                      checklistSupportStyle,
                      { color: theme.textSecondary, marginBottom: spacing.lg },
                    ]}>
                    We turned the task into a few tiny steps. Tap a step when it&apos;s done to earn
                    +{STEP_XP} XP. You can change the steps, add your own, or stop at any time.
                  </Text>
                  <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                    {checklistCompleteCount} of {checklistItems.length} complete
                  </Text>

                  {checklistItems.length === 0 ? (
                    <Text style={[styles.checklistEmpty, { color: theme.textMuted }]}>
                      No steps yet. Add one tiny step when you&apos;re ready.
                    </Text>
                  ) : (
                    <View style={styles.checklistActive}>
                      {checklistItems.map((item, index) => (
                        <ChecklistRow
                          key={item.id}
                          item={item}
                          isNext={index === nextIncompleteIndex}
                          isEditing={editingItemId === item.id}
                          editingText={editingText}
                          onEditingTextChange={setEditingText}
                          onComplete={() => completeChecklistItem(item.id)}
                          onStartEdit={() => startEditItem(item.id)}
                          onSaveEdit={() => saveItemEdit(item.id)}
                          onCancelEdit={() => cancelItemEdit(item.id)}
                          onDelete={() => deleteChecklistItem(item.id)}
                          stepXp={STEP_XP}
                        />
                      ))}
                    </View>
                  )}

                  {checklistItems.length < CHECKLIST_MAX && !editingItemId ? (
                    <Pressable
                      onPress={addChecklistStep}
                      accessibilityRole="button"
                      accessibilityLabel="Add a step"
                      style={({ pressed }) => [
                        styles.addStepBtn,
                        pressed && styles.addStepBtnPressed,
                      ]}>
                      <Text style={[styles.addStepText, { color: theme.accentSecondary }]}>
                        + Add a step
                      </Text>
                    </Pressable>
                  ) : null}

                  <View style={styles.actionStack}>
                    <View style={compactBtn}>
                      <GradientButton
                        label="That’s enough for now"
                        onPress={() => setTooBigStage('session-complete')}
                        small
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isTooBigFlow && tooBigStage === 'session-complete' ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <View
                  style={[
                    styles.successInner,
                    isSuccessNarrow && styles.successInnerDesktop,
                  ]}>
                  <Pressable
                    onPress={backToChecklist}
                    accessibilityRole="button"
                    accessibilityLabel="Back to checklist"
                    style={styles.checklistBack}>
                    <Text
                      style={[
                        styles.checklistBackText,
                        isSuccessNarrow
                          ? styles.checklistBackTextDesktop
                          : styles.checklistBackTextMobile,
                        { color: theme.textSecondary },
                      ]}>
                      ← Back to checklist
                    </Text>
                  </Pressable>

                  <GlassCard style={styles.successCard}>
                    {sessionCompletedSteps > 0 ? (
                      <>
                        <View
                          style={[
                            styles.successBadge,
                            { backgroundColor: theme.accentSecondary + '28' },
                          ]}>
                          <Text style={[styles.successBadgeText, { color: theme.accentSecondary }]}>
                            ✨ Tiny win recorded
                          </Text>
                        </View>
                        <Text style={[styles.successTitle, { color: theme.text }]}>
                          {sessionCompleteCopy?.headline ?? COMPLETION_HEADLINES[0]}
                        </Text>
                        <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                          {sessionCompleteCopy?.support ?? COMPLETION_SUPPORT_LINES[0]}
                        </Text>
                        <View style={styles.sessionStats}>
                          <Text style={[styles.sessionStat, { color: theme.text }]}>
                            {sessionCompletedSteps} step{sessionCompletedSteps === 1 ? '' : 's'}{' '}
                            completed
                          </Text>
                          <Text style={[styles.sessionStat, { color: theme.text }]}>
                            +{sessionXpEarned} XP earned
                          </Text>
                          <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                            Your garden grows with every tiny step.
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.successTitle, { color: theme.text }]}>
                          That’s okay. You can come back later.
                        </Text>
                        <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                          Choosing to pause counts too.
                        </Text>
                      </>
                    )}

                    <View style={styles.successActions}>
                      <View style={styles.successBtn}>
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
                        style={styles.successBtn}
                      />
                    </View>

                    <View style={styles.successLinks}>
                      {sessionCompletedSteps > 0 ? (
                        <Pressable
                          onPress={() => router.push('/garden' as never)}
                          accessibilityRole="link"
                          accessibilityLabel="Check out your garden"
                          style={({ pressed }) => [styles.successLink, pressed && styles.pressed]}>
                          <Text style={[styles.successLinkText, { color: theme.accentSecondary }]}>
                            Check out your garden
                          </Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={keepWorkingHere}
                        accessibilityRole="button"
                        accessibilityLabel="Keep working here"
                        style={({ pressed }) => [styles.successLink, pressed && styles.pressed]}>
                        <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                          Keep working here
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                </View>
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
  checklistInner: {
    width: '100%',
  },
  checklistInnerDesktop: {
    maxWidth: CHECKLIST_DESKTOP_MAX_WIDTH,
    alignSelf: 'center',
  },
  checklistBack: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  checklistBackText: {
    fontWeight: '600',
  },
  checklistBackTextDesktop: {
    fontSize: 17,
    lineHeight: 24,
  },
  checklistBackTextMobile: {
    fontSize: 15,
    lineHeight: 22,
  },
  checklistEyebrow: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  checklistEyebrowDesktop: {
    fontSize: 14,
    lineHeight: 18,
  },
  checklistEyebrowMobile: {
    fontSize: 12,
    lineHeight: 16,
  },
  checklistContextSummary: {
    marginBottom: spacing.xs,
  },
  checklistContextSummaryDesktop: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600',
  },
  checklistContextSummaryMobile: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  checklistTaskNote: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  checklistEmpty: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 24,
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
  panelCard: {
    gap: spacing.sm,
  },
  successInner: {
    width: '100%',
  },
  successInnerDesktop: {
    maxWidth: SUCCESS_DESKTOP_MAX_WIDTH,
    alignSelf: 'center',
  },
  successCard: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  successBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  successBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  successTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successBody: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
    maxWidth: 480,
  },
  successActions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  successBtn: {
    width: '100%',
    maxWidth: 320,
  },
  successLinks: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  successLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  successLinkText: {
    ...typography.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  panelTitle: {
    ...typography.h2,
  },
  panelBody: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
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
  addStepBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  addStepBtnPressed: {
    opacity: 0.82,
  },
  addStepText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  quietActionText: {
    ...typography.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  checkRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  rowIconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconBtnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  rowEditIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  rowDeleteIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  editInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'web' ? 10 : spacing.xs + 2,
    ...typography.body,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  editSaveBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    flexShrink: 0,
  },
  editSaveText: {
    ...typography.caption,
    fontWeight: '700',
  },
  editCancelBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sessionStats: {
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    width: '100%',
  },
  sessionStat: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  gardenNote: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 360,
  },
});
