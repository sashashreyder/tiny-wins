import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { AppModal } from '@/components/design-system/Modal';
import { TinyQuestCard } from '@/components/design-system/Cards';
import { TagPill } from '@/components/design-system/Tags';
import { GentleTimer } from '@/components/tools/GentleTimer';
import { stuckTypes } from '@/data/content';
import { TaskContext, taskFlowTemplates } from '@/data/cantStartFlows';
import {
  BOREDOM_COMPLETION_COPY,
  BOREDOM_METHODS,
  BORING_TAX_OPTIONS,
  BREAK_ACTIVITY_PRESETS,
  BoredomMethod,
  BoredomStage,
  BoringTaxOption,
  INTERESTING_PART_PRESETS,
  buildBoredomWinTitle,
  formatBoringTaxSummary,
  getBoredomChallengeById,
  inferBoredomTaskKind,
  pickBoredomChallenge,
} from '@/data/boredom';
import {
  PressureRuleState,
  VERSION_ZERO_MODES,
  VersionZeroMode,
  VersionZeroStage,
  buildVersionZeroWinTitle,
  getVersionZeroModeLabel,
  getVersionZeroPrompt,
  getVersionZeroTaskKindLabel,
  inferVersionZeroTaskKind,
  pickVersionZeroReminder,
} from '@/data/versionZero';
import { calculateXP, getSupportiveMessage, getTinyQuests } from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { StuckType, StuckTypeOption, TinyWinCategory } from '@/types';

const STUCK_GRID_COLUMNS = 2;
const STUCK_GRID_GAP = spacing.md;
const CONTENT_MAX_WIDTH = 1040;
const CHECKLIST_DESKTOP_MAX_WIDTH = 860;
const CHECKLIST_NARROW_BREAKPOINT = 900;
const SUCCESS_DESKTOP_MAX_WIDTH = 820;
const TASK_TEXT_MAX = 100;
const CHECKLIST_MAX = 6;
const STEP_XP = calculateXP('tiny-win');
const NO_BEGINNING_XP = calculateXP('tiny-win');
const VERSION_ZERO_XP = calculateXP('tiny-win');
const BOREDOM_XP = calculateXP('tiny-win');
const VERSION_ZERO_MENU_MAX_WIDTH = 960;
const VERSION_ZERO_ACTIVE_MAX_WIDTH = 880;
const VERSION_ZERO_COMPLETE_MAX_WIDTH = 790;
const BOREDOM_MENU_MAX_WIDTH = 1000;
const BOREDOM_ACTIVE_MAX_WIDTH = 880;
const BOREDOM_COMPLETE_MAX_WIDTH = 790;
const TIMER_PRESETS = [2, 5, 10] as const;
const CUE_DURATION_PRESETS = [2, 5, 10] as const;
const BREAK_DURATION_PRESETS = [5, 10, 15] as const;

const NO_BEGINNING_HEADLINES = [
  'You got moving!',
  'That was a real start.',
  'You made the way in easier.',
  'Tiny start, real progress.',
  'You gave the task a beginning.',
];

const NO_BEGINNING_SUPPORT = [
  'Starting counts, even if you stop here.',
  'You did not need to finish everything to make progress.',
  'One small move changed the task from waiting to started.',
];

const CUE_WHEN_EXAMPLES = [
  'I finish my coffee',
  'I sit at my desk',
  'Lunch is over',
  'This video ends',
  'It is 2:00 PM',
];

const BLOCKER_PRESETS = [
  'Close one unrelated tab or app',
  'Put my phone out of reach',
  'Bring what I need closer',
  'Clear one small working space',
  'Open only the file or tool I need',
  'Silence notifications for a few minutes',
  'Find the item or information I need',
  'Move one distracting thing out of sight',
  'Get the charger, cable, or tool I need',
  'Ask for the missing information',
  'Close one thing I am not using',
  'Put everything else into one temporary pile',
];

const ACTIVATION_METHODS = [
  {
    id: 'timer' as const,
    icon: '⏱',
    title: 'Try a tiny timer',
    description:
      'Give the task a few minutes. You are genuinely allowed to stop when time is up.',
  },
  {
    id: 'cue' as const,
    icon: '⚓',
    title: 'Set a start cue',
    description:
      'Attach the task to one clear moment so you do not have to keep deciding when to begin.',
  },
  {
    id: 'blocker' as const,
    icon: '🧹',
    title: 'Clear one blocker',
    description: 'Remove one small obstacle that is making the start harder.',
  },
];

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

type PressableFocusState = {
  pressed: boolean;
  focused?: boolean;
};

type TooBigStage = 'context' | 'checklist-active' | 'session-complete';

type NoBeginningMethod = 'timer' | 'cue' | 'blocker';

type TimerOrigin = 'timer-tool' | 'start-cue';

type NoBeginningStage =
  | 'menu'
  | 'timer-setup'
  | 'timer-running'
  | 'timer-result'
  | 'cue-setup'
  | 'cue-ready'
  | 'blocker-choice'
  | 'complete';

const METHOD_LABELS: Record<NoBeginningMethod, string> = {
  timer: 'Tiny timer',
  cue: 'Start cue',
  blocker: 'Clear the way',
};

type BlockerItem = {
  id: string;
  text: string;
  completed: boolean;
  rewarded: boolean;
  isCustom: boolean;
};

function makeBlockerItems(): BlockerItem[] {
  return BLOCKER_PRESETS.map((text, index) => ({
    id: `blocker-preset-${index}`,
    text,
    completed: false,
    rewarded: false,
    isCustom: false,
  }));
}

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

function inferTinyWinCategory(text: string, fallback: TinyWinCategory): TinyWinCategory {
  const context = suggestTaskContext(text);
  if (context) return taskFlowTemplates[context].category;
  return fallback;
}

function buildTimerWinTitle(taskText: string, duration: number): string {
  const trimmed = taskText.trim();
  if (trimmed) {
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return `Started: ${capitalized}`;
  }
  return `Spent ${duration} minutes getting started`;
}

function buildCueWinTitle(cueWill: string): string {
  const trimmed = cueWill.trim();
  if (trimmed) {
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return `Started with cue: ${capitalized}`;
  }
  return 'Started with a start cue';
}

function buildBlockerWinTitle(taskText: string, blocker: string): string {
  const task = taskText.trim();
  const blockerShort = blocker.slice(0, 40);
  if (task) return `Cleared blocker for ${task}: ${blockerShort}`;
  return `Cleared blocker: ${blockerShort}`;
}

function sanitizeCustomMinutesInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

function parseCustomMinutes(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const minutes = parseInt(trimmed, 10);
  if (minutes < 1 || minutes > 60) return null;
  return minutes;
}

function customDurationError(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter a number of minutes.';
  if (!/^\d+$/.test(trimmed)) return 'Use whole minutes only.';
  const minutes = parseInt(trimmed, 10);
  if (minutes < 1) return 'Minimum is 1 minute.';
  if (minutes > 60) return 'Maximum is 60 minutes.';
  return null;
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

function ActivationMethodCard({
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
      style={({ pressed, focused }: PressableFocusState) => [
        styles.methodCardPressable,
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <View
        style={[
          styles.methodCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.surfaceBorder,
          },
        ]}>
        <Text style={styles.methodIcon}>{icon}</Text>
        <Text style={[styles.methodTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.methodDesc, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

function ActivationMethodsGrid({
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
    <View style={[styles.methodGrid, { gap }]}>
      {rows.map((row, rowIndex) => (
        <View key={`method-row-${rowIndex}`} style={[styles.methodRow, { gap }]}>
          {row.map((child, colIndex) => (
            <View key={`method-cell-${rowIndex}-${colIndex}`} style={styles.methodCell}>
              {child}
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`method-spacer-${rowIndex}-${i}`} style={styles.methodCell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function PressureRuleCard({
  ruleState,
  onCrumple,
  onThrowAway,
}: {
  ruleState: PressureRuleState;
  onCrumple: () => void;
  onThrowAway: () => void;
}) {
  const theme = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (ruleState === 'paper') {
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
      opacityAnim.setValue(1);
    }
  }, [ruleState, scaleAnim, rotateAnim, opacityAnim]);

  useEffect(() => {
    if (ruleState === 'crumpled') {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.82, duration: 220, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.92, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [ruleState, scaleAnim, rotateAnim, opacityAnim]);

  useEffect(() => {
    if (ruleState === 'trashed') {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.6, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.5, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [ruleState, scaleAnim, opacityAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-8deg'],
  });

  return (
    <View
      style={[
        styles.pressureRuleCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
        },
      ]}>
      <Text style={[styles.pressureRuleTitle, { color: theme.textSecondary }]}>
        One rule we can throw away
      </Text>

      {ruleState === 'paper' ? (
        <>
          <View
            style={[
              styles.pressurePaper,
              {
                backgroundColor: theme.background,
                borderColor: theme.surfaceBorder,
              },
            ]}>
            <Text style={[styles.pressurePaperText, { color: theme.text }]}>
              It has to be good on the first try.
            </Text>
          </View>
          <Pressable
            onPress={onCrumple}
            accessibilityRole="button"
            accessibilityLabel="Crumple this rule"
            style={({ pressed, focused }: PressableFocusState) => [
              styles.pressureActionBtn,
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.pressureActionText, { color: theme.accentSecondary }]}>
              Crumple this rule
            </Text>
          </Pressable>
        </>
      ) : null}

      {ruleState === 'crumpled' ? (
        <>
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
              opacity: opacityAnim,
            }}>
            <Text style={styles.pressureEmoji} accessibilityLabel="Crumpled paper">
              🗞️
            </Text>
          </Animated.View>
          <Text style={[styles.pressureStatusText, { color: theme.text }]}>
            Crushed. That rule was not helping.
          </Text>
          <Pressable
            onPress={onThrowAway}
            accessibilityRole="button"
            accessibilityLabel="Throw it away"
            style={({ pressed, focused }: PressableFocusState) => [
              styles.pressureActionBtn,
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.pressureActionText, { color: theme.accentSecondary }]}>
              Throw it away
            </Text>
          </Pressable>
        </>
      ) : null}

      {ruleState === 'trashed' ? (
        <>
          <Text style={styles.pressureEmoji} accessibilityLabel="Trash">
            🗑️
          </Text>
          <Text style={[styles.pressureStatusText, { color: theme.text }]}>
            Gone. Version Zero only has to exist.
          </Text>
        </>
      ) : null}
    </View>
  );
}

function VersionZeroReminderCard({
  reminder,
  onAnother,
}: {
  reminder: string;
  onAnother: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.vzReminderCard,
        {
          backgroundColor: theme.accentTertiary,
          borderColor: theme.accent,
        },
      ]}>
      <Text style={[styles.vzReminderText, { color: theme.text }]}>{reminder}</Text>
      <Pressable
        onPress={onAnother}
        accessibilityRole="button"
        accessibilityLabel="Another reminder"
        style={({ pressed, focused }: PressableFocusState) => [
          styles.vzReminderBtn,
          pressed && styles.pressed,
          focused && Platform.OS === 'web' ? styles.focusRing : null,
        ]}>
        <Text style={[styles.vzReminderBtnText, { color: theme.accentSecondary }]}>
          Another reminder ↻
        </Text>
      </Pressable>
    </View>
  );
}

function DurationChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <View
        style={[
          styles.durationChip,
          {
            backgroundColor: selected ? theme.accentTertiary : theme.surface,
            borderColor: selected ? theme.accent : theme.surfaceBorder,
          },
        ]}>
        <Text
          style={[
            styles.durationChipText,
            { color: selected ? theme.text : theme.textSecondary },
          ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function BoredomChallengeDice({ shuffleKey }: { shuffleKey: number }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shuffleKey === 0) return;
    rotateAnim.setValue(0);
    scaleAnim.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.12, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]),
    ]).start();
  }, [shuffleKey, rotateAnim, scaleAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '18deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.boredomDice,
        {
          transform: [{ rotate: rotation }, { scale: scaleAnim }],
        },
      ]}
      accessibilityLabel="Dice">
      🎲
    </Animated.Text>
  );
}

function BoringTaxRow({
  option,
  selected,
  onToggle,
  onDelete,
}: {
  option: BoringTaxOption;
  selected: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.boringTaxRow,
        {
          backgroundColor: selected ? theme.accentTertiary : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
      ]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={option.label}
        style={({ pressed, focused }: PressableFocusState) => [
          styles.boringTaxMain,
          pressed && styles.pressed,
          focused && Platform.OS === 'web' ? styles.focusRing : null,
        ]}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: selected ? theme.accent : theme.surfaceBorder,
              backgroundColor: selected ? theme.accent : 'transparent',
            },
          ]}>
          {selected ? <Text style={{ color: theme.text, fontWeight: '700' }}>✓</Text> : null}
        </View>
        <Text style={[styles.boringTaxLabel, { color: theme.text }]}>{option.label}</Text>
      </Pressable>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${option.label}`}
          hitSlop={8}
          style={({ pressed, focused }: PressableFocusState) => [
            styles.editCancelBtn,
            pressed && styles.pressed,
            focused && Platform.OS === 'web' ? styles.focusRing : null,
          ]}>
          <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BlockerChecklistRow({
  item,
  isEditing,
  editingText,
  onEditingTextChange,
  onToggleComplete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  stepXp,
}: {
  item: BlockerItem;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onToggleComplete: () => void;
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
          placeholder="Blocker text"
          placeholderTextColor={theme.textMuted}
          autoFocus
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onSaveEdit}
          accessibilityLabel={`Edit: ${item.text || 'new blocker'}`}
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
          accessibilityLabel="Save blocker"
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

  return (
    <View
      style={[
        styles.checkRow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          borderWidth: 1,
          opacity: item.completed ? 0.72 : 1,
        },
      ]}>
      <Pressable
        onPress={onToggleComplete}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        accessibilityLabel={
          item.completed ? `Uncheck: ${item.text}` : `Complete: ${item.text}`
        }
        style={({ pressed }) => [styles.checkRowMain, pressed && styles.pressed]}>
        <View
          style={[
            styles.checkbox,
            item.completed
              ? {
                  borderColor: theme.accentSecondary,
                  backgroundColor: theme.accentSecondary + '55',
                }
              : { borderColor: theme.surfaceBorder, backgroundColor: 'transparent' },
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
          <Text style={[styles.rowXp, { color: theme.textMuted }]}>+{stepXp} XP</Text>
        ) : null}
      </Pressable>
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

  const [noBeginningStage, setNoBeginningStage] = useState<NoBeginningStage>('menu');
  const [noBeginningTaskText, setNoBeginningTaskText] = useState('');
  const [timerDuration, setTimerDuration] = useState(5);
  const [timerRunKey, setTimerRunKey] = useState(0);
  const [timerOrigin, setTimerOrigin] = useState<TimerOrigin>('timer-tool');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [cueWhen, setCueWhen] = useState('');
  const [cueWill, setCueWill] = useState('');
  const [cueDuration, setCueDuration] = useState(5);
  const [isCueTimerCustom, setIsCueTimerCustom] = useState(false);
  const [cueTimerCustomInput, setCueTimerCustomInput] = useState('');
  const [blockerItems, setBlockerItems] = useState<BlockerItem[]>(makeBlockerItems);
  const [blockerEditingId, setBlockerEditingId] = useState<string | null>(null);
  const [blockerEditingText, setBlockerEditingText] = useState('');
  const [blockerSessionXp, setBlockerSessionXp] = useState(0);
  const [blockerCompletedCount, setBlockerCompletedCount] = useState(0);
  const [hasMarkedBlockerAchievement, setHasMarkedBlockerAchievement] = useState(false);
  const [customBlockerText, setCustomBlockerText] = useState('');
  const [showCustomBlocker, setShowCustomBlocker] = useState(false);
  const [completedMethod, setCompletedMethod] = useState<NoBeginningMethod | null>(null);
  const [methodRewarded, setMethodRewarded] = useState(false);
  const [noBeginningXpEarned, setNoBeginningXpEarned] = useState(0);
  const [noBeginningCompleteCopy, setNoBeginningCompleteCopy] = useState<{
    headline: string;
    support: string;
  } | null>(null);
  const [nbInputFocused, setNbInputFocused] = useState(false);

  const [versionZeroStage, setVersionZeroStage] = useState<VersionZeroStage>('menu');
  const [versionZeroTaskText, setVersionZeroTaskText] = useState('');
  const [versionZeroMode, setVersionZeroMode] = useState<VersionZeroMode | null>(null);
  const [versionZeroReminder, setVersionZeroReminder] = useState('');
  const [versionZeroRewarded, setVersionZeroRewarded] = useState(false);
  const [versionZeroXpEarned, setVersionZeroXpEarned] = useState(0);
  const [pressureRuleState, setPressureRuleState] = useState<PressureRuleState>('paper');
  const [vzInputFocused, setVzInputFocused] = useState(false);
  const [versionZeroEditingTask, setVersionZeroEditingTask] = useState(false);
  const versionZeroRewardingRef = useRef(false);

  const [boredomStage, setBoredomStage] = useState<BoredomStage>('menu');
  const [boredomMethod, setBoredomMethod] = useState<BoredomMethod | null>(null);
  const [boredomTaskText, setBoredomTaskText] = useState('');
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [challengeShuffleKey, setChallengeShuffleKey] = useState(0);
  const [interestingPartText, setInterestingPartText] = useState('');
  const [breakActivity, setBreakActivity] = useState('');
  const [breakReturnAction, setBreakReturnAction] = useState('');
  const [breakReturnPrefillDone, setBreakReturnPrefillDone] = useState(false);
  const [breakDuration, setBreakDuration] = useState(10);
  const [isBreakDurationCustom, setIsBreakDurationCustom] = useState(false);
  const [breakCustomMinutes, setBreakCustomMinutes] = useState('');
  const [breakRunKey, setBreakRunKey] = useState(0);
  const [selectedBoringTaxIds, setSelectedBoringTaxIds] = useState<string[]>([]);
  const [customBoringTaxText, setCustomBoringTaxText] = useState('');
  const [customBoringTaxOptions, setCustomBoringTaxOptions] = useState<BoringTaxOption[]>([]);
  const [showCustomBoringTax, setShowCustomBoringTax] = useState(false);
  const [boredomRewarded, setBoredomRewarded] = useState(false);
  const [boredomXpEarned, setBoredomXpEarned] = useState(0);
  const [bdInputFocused, setBdInputFocused] = useState(false);
  const boredomRewardingRef = useRef(false);
  const boredomStageRef = useRef<BoredomStage>('menu');

  const isTooBigFlow = stuckType === 'too-big';
  const isNoBeginningFlow = stuckType === 'no-beginning';
  const isVersionZeroFlow = stuckType === 'scared-bad';
  const isBoredomFlow = stuckType === 'bored';
  const showContextStage = isTooBigFlow && tooBigStage === 'context';
  const showLegacyQuestStage =
    Boolean(stuckType) &&
    !isTooBigFlow &&
    !isNoBeginningFlow &&
    !isVersionZeroFlow &&
    !isBoredomFlow;
  const suggestedContextOption = taskContextOptions.find((o) => o.id === suggestedContext);

  const flowTemplate = confirmedContext ? taskFlowTemplates[confirmedContext] : null;
  const winCategory = flowTemplate?.category ?? 'work-study';

  const contextColumns =
    viewportWidth >= 1024 ? 3 : viewportWidth >= 700 ? 3 : viewportWidth >= 350 ? 2 : 1;
  const contextGap = viewportWidth >= 1024 ? 16 : viewportWidth >= 350 ? 12 : 10;
  const isChecklistNarrow = viewportWidth >= CHECKLIST_NARROW_BREAKPOINT;
  const isSuccessNarrow = viewportWidth >= CHECKLIST_NARROW_BREAKPOINT;
  const isDesktopLayout = viewportWidth >= 768;
  const methodColumns = viewportWidth >= 768 ? 3 : 1;
  const boredomMethodColumns = viewportWidth >= 768 ? 2 : 1;
  const methodGap = viewportWidth >= 768 ? 16 : 12;
  const nbSectionGap = isDesktopLayout ? 32 : 22;
  const nbFieldGap = isDesktopLayout ? 26 : 20;
  const bdSectionGap = isDesktopLayout ? 32 : 22;
  const bdFieldGap = isDesktopLayout ? 26 : 20;
  const customDurationErrorText = isCustomDuration ? customDurationError(customDurationInput) : null;
  const resolvedCustomMinutes = parseCustomMinutes(customDurationInput);
  const canStartTimer = isCustomDuration
    ? resolvedCustomMinutes !== null
    : (TIMER_PRESETS as readonly number[]).includes(timerDuration);
  const cueTimerCustomError = isCueTimerCustom ? customDurationError(cueTimerCustomInput) : null;
  const resolvedCueTimerMinutes = isCueTimerCustom
    ? parseCustomMinutes(cueTimerCustomInput)
    : cueDuration;
  const canStartCueTimer = isCueTimerCustom ? resolvedCueTimerMinutes !== null : true;
  const breakCustomErrorText = isBreakDurationCustom
    ? customDurationError(breakCustomMinutes)
    : null;
  const resolvedBreakMinutes = isBreakDurationCustom
    ? parseCustomMinutes(breakCustomMinutes)
    : breakDuration;
  const canStartBreak =
    breakActivity.trim().length > 0 &&
    breakReturnAction.trim().length > 0 &&
    (isBreakDurationCustom
      ? resolvedBreakMinutes !== null
      : (BREAK_DURATION_PRESETS as readonly number[]).includes(breakDuration));
  const timerDisplayTitle =
    timerOrigin === 'start-cue' ? cueWill.trim() : noBeginningTaskText.trim();
  const cueReadyGap = isDesktopLayout ? 28 : 22;
  const cueReadySmallGap = isDesktopLayout ? 22 : 18;
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

  const vzSectionGap = isDesktopLayout ? 32 : 22;
  const versionZeroTaskKind = useMemo(
    () => inferVersionZeroTaskKind(versionZeroTaskText),
    [versionZeroTaskText],
  );
  const versionZeroPrompt =
    versionZeroMode !== null
      ? getVersionZeroPrompt(versionZeroTaskKind, versionZeroMode)
      : '';

  const boredomTaskKind = useMemo(
    () => inferBoredomTaskKind(boredomTaskText),
    [boredomTaskText],
  );
  const currentChallenge = useMemo(
    () => getBoredomChallengeById(currentChallengeId),
    [currentChallengeId],
  );
  const allBoringTaxOptions = useMemo(
    () => [...BORING_TAX_OPTIONS, ...customBoringTaxOptions],
    [customBoringTaxOptions],
  );
  const selectedBoringTaxLabels = useMemo(
    () =>
      allBoringTaxOptions
        .filter((option) => selectedBoringTaxIds.includes(option.id))
        .map((option) => option.label),
    [allBoringTaxOptions, selectedBoringTaxIds],
  );
  const boringTaxSummary = formatBoringTaxSummary(selectedBoringTaxLabels);
  const boredomCompletionCopy =
    boredomMethod !== null ? BOREDOM_COMPLETION_COPY[boredomMethod] : null;

  boredomStageRef.current = boredomStage;

  const quests = useMemo(() => {
    if (
      !stuckType ||
      stuckType === 'too-big' ||
      stuckType === 'scared-bad' ||
      stuckType === 'bored'
    ) {
      return [];
    }
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

  const resetBlockerSession = () => {
    setBlockerItems(makeBlockerItems());
    setBlockerEditingId(null);
    setBlockerEditingText('');
    setBlockerSessionXp(0);
    setBlockerCompletedCount(0);
    setHasMarkedBlockerAchievement(false);
    setCustomBlockerText('');
    setShowCustomBlocker(false);
  };

  const resetNoBeginningState = () => {
    setNoBeginningStage('menu');
    setNoBeginningTaskText('');
    setTimerDuration(5);
    setTimerRunKey(0);
    setTimerOrigin('timer-tool');
    setIsCustomDuration(false);
    setCustomDurationInput('');
    setCueWhen('');
    setCueWill('');
    setCueDuration(5);
    setIsCueTimerCustom(false);
    setCueTimerCustomInput('');
    resetBlockerSession();
    setCompletedMethod(null);
    setMethodRewarded(false);
    setNoBeginningXpEarned(0);
    setNoBeginningCompleteCopy(null);
  };

  const resetVersionZeroState = () => {
    setVersionZeroStage('menu');
    setVersionZeroTaskText('');
    setVersionZeroMode(null);
    setVersionZeroReminder('');
    setVersionZeroRewarded(false);
    setVersionZeroXpEarned(0);
    setPressureRuleState('paper');
    setVersionZeroEditingTask(false);
    versionZeroRewardingRef.current = false;
  };

  const resetBoredomState = () => {
    setBoredomStage('menu');
    setBoredomMethod(null);
    setBoredomTaskText('');
    setCurrentChallengeId(null);
    setChallengeStarted(false);
    setChallengeShuffleKey(0);
    setInterestingPartText('');
    setBreakActivity('');
    setBreakReturnAction('');
    setBreakReturnPrefillDone(false);
    setBreakDuration(10);
    setIsBreakDurationCustom(false);
    setBreakCustomMinutes('');
    setBreakRunKey(0);
    setSelectedBoringTaxIds([]);
    setCustomBoringTaxText('');
    setCustomBoringTaxOptions([]);
    setShowCustomBoringTax(false);
    setBoredomRewarded(false);
    setBoredomXpEarned(0);
    boredomRewardingRef.current = false;
  };

  const returnToBoredomMenu = () => {
    setBoredomStage('menu');
    setBoredomMethod(null);
    setChallengeStarted(false);
  };

  const tryAnotherBoredomTool = () => {
    setBoredomRewarded(false);
    setBoredomXpEarned(0);
    boredomRewardingRef.current = false;
    setBoredomMethod(null);
    setChallengeStarted(false);
    setCurrentChallengeId(null);
    setChallengeShuffleKey(0);
    setInterestingPartText('');
    setBreakActivity('');
    setBreakReturnAction('');
    setBreakReturnPrefillDone(false);
    setBreakDuration(10);
    setIsBreakDurationCustom(false);
    setBreakCustomMinutes('');
    setBreakRunKey(0);
    setSelectedBoringTaxIds([]);
    setCustomBoringTaxText('');
    setCustomBoringTaxOptions([]);
    setShowCustomBoringTax(false);
    setBoredomStage('menu');
  };

  const selectBoredomMethod = (method: BoredomMethod) => {
    setBoredomMethod(method);
    if (method === 'challenge') {
      const challenge = pickBoredomChallenge(boredomTaskKind);
      setCurrentChallengeId(challenge.id);
      setChallengeStarted(false);
      setChallengeShuffleKey(0);
      setBoredomStage('challenge');
      return;
    }
    if (method === 'interesting-part') {
      setBoredomStage('interesting-part');
      return;
    }
    if (method === 'fun-break') {
      if (!breakReturnPrefillDone && boredomTaskText.trim()) {
        setBreakReturnAction(`Return to: ${boredomTaskText.trim()}`);
        setBreakReturnPrefillDone(true);
      }
      setBoredomStage('break-setup');
      return;
    }
    setBoredomStage('boring-tax');
  };

  const rollBoredomChallenge = () => {
    const next = pickBoredomChallenge(boredomTaskKind, currentChallengeId ?? undefined);
    setCurrentChallengeId(next.id);
    setChallengeStarted(false);
    setChallengeShuffleKey((key) => key + 1);
  };

  const awardBoredomWin = (title: string, category: TinyWinCategory) => {
    if (boredomRewarded || boredomRewardingRef.current) return;
    boredomRewardingRef.current = true;
    addTinyWin(title.slice(0, 80), category, false);
    markAchievementEvent('cant-start-quest');
    setBoredomRewarded(true);
    setBoredomXpEarned(BOREDOM_XP);
    setBoredomStage('complete');
  };

  const completeChallengeWin = () => {
    if (!currentChallenge) return;
    const title = buildBoredomWinTitle({
      method: 'challenge',
      challengeText: currentChallenge.text,
    });
    const category = inferTinyWinCategory(boredomTaskText, 'creative');
    awardBoredomWin(title, category);
  };

  const completeInterestingPartWin = () => {
    const part = interestingPartText.trim();
    if (!part) return;
    const title = buildBoredomWinTitle({
      method: 'interesting-part',
      interestingPart: part,
    });
    const category = inferTinyWinCategory(boredomTaskText || part, 'creative');
    awardBoredomWin(title, category);
  };

  const completeBreakWin = () => {
    const title = buildBoredomWinTitle({
      method: 'fun-break',
      taskText: boredomTaskText,
    });
    const category = inferTinyWinCategory(boredomTaskText, 'body-reset');
    awardBoredomWin(title, category);
  };

  const completeBoringTaxWin = () => {
    if (selectedBoringTaxLabels.length === 0) return;
    const title = buildBoredomWinTitle({
      method: 'boring-tax',
      boringTaxLabel: selectedBoringTaxLabels[0],
    });
    const category = inferTinyWinCategory(boredomTaskText, 'work-study');
    awardBoredomWin(title, category);
  };

  const startIntentionalBreak = () => {
    if (!canStartBreak || resolvedBreakMinutes === null) return;
    if (isBreakDurationCustom) {
      setBreakDuration(resolvedBreakMinutes);
    }
    setBreakRunKey((key) => key + 1);
    setBoredomStage('break-running');
  };

  const addExtraBreakMinutes = () => {
    setBreakDuration(5);
    setIsBreakDurationCustom(false);
    setBreakCustomMinutes('');
    setBreakRunKey((key) => key + 1);
    setBoredomStage('break-running');
  };

  const toggleBoringTaxOption = (id: string) => {
    setSelectedBoringTaxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const submitCustomBoringTax = () => {
    const trimmed = customBoringTaxText.trim();
    if (!trimmed) return;
    const id = `custom-tax-${Date.now()}`;
    const option: BoringTaxOption = { id, label: trimmed.slice(0, TASK_TEXT_MAX) };
    setCustomBoringTaxOptions((prev) => [...prev, option]);
    setSelectedBoringTaxIds((prev) => [...prev, id]);
    setCustomBoringTaxText('');
    setShowCustomBoringTax(false);
  };

  const deleteCustomBoringTax = (id: string) => {
    setCustomBoringTaxOptions((prev) => prev.filter((option) => option.id !== id));
    setSelectedBoringTaxIds((prev) => prev.filter((item) => item !== id));
  };

  const backFromBoredomComplete = () => {
    if (boredomMethod === 'challenge') {
      setBoredomStage('challenge');
      return;
    }
    if (boredomMethod === 'interesting-part') {
      setBoredomStage('interesting-part');
      return;
    }
    if (boredomMethod === 'fun-break') {
      setBoredomStage('break-result');
      return;
    }
    setBoredomStage('boring-tax');
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (boredomStageRef.current === 'break-running') {
          setBoredomStage('break-setup');
          setBreakRunKey((key) => key + 1);
        }
      };
    }, []),
  );

  const selectVersionZeroMode = (mode: VersionZeroMode) => {
    setVersionZeroMode(mode);
    setVersionZeroReminder(pickVersionZeroReminder());
    setPressureRuleState('paper');
    setVersionZeroEditingTask(false);
    setVersionZeroStage('active');
  };

  const returnToVersionZeroMenu = () => {
    setVersionZeroStage('menu');
    setVersionZeroMode(null);
    setPressureRuleState('paper');
    setVersionZeroEditingTask(false);
  };

  const awardVersionZeroWin = () => {
    if (versionZeroRewarded || versionZeroRewardingRef.current) return;
    versionZeroRewardingRef.current = true;
    const title = buildVersionZeroWinTitle(versionZeroTaskText, versionZeroTaskKind);
    const category = inferTinyWinCategory(versionZeroTaskText, 'creative');
    addTinyWin(title.slice(0, 80), category, false);
    markAchievementEvent('cant-start-quest');
    setVersionZeroRewarded(true);
    setVersionZeroXpEarned(VERSION_ZERO_XP);
    setVersionZeroStage('complete');
  };

  const cycleVersionZeroReminder = () => {
    setVersionZeroReminder((current) => pickVersionZeroReminder(current));
  };

  const goToNoBeginningComplete = (method: NoBeginningMethod) => {
    setCompletedMethod(method);
    setNoBeginningCompleteCopy({
      headline: pickRandom(NO_BEGINNING_HEADLINES),
      support: pickRandom(NO_BEGINNING_SUPPORT),
    });
    setNoBeginningStage('complete');
  };

  const awardNoBeginningWin = (title: string, category: TinyWinCategory) => {
    if (methodRewarded) return;
    addTinyWin(title.slice(0, 80), category, false);
    markAchievementEvent('cant-start-quest');
    setMethodRewarded(true);
    setNoBeginningXpEarned(NO_BEGINNING_XP);
  };

  const selectStuckType = (type: StuckType) => {
    setStuckType(type);
    setQuestIndex(0);
    setSmallerMode(false);
    if (type === 'too-big') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
    } else if (type === 'no-beginning') {
      resetTooBigLocalState();
      resetVersionZeroState();
      resetNoBeginningState();
      resetBoredomState();
    } else if (type === 'scared-bad') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
    } else if (type === 'bored') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
    } else {
      setTooBigStage('context');
      setManualContext(null);
      setSuggestedContext(null);
      setConfirmedContext(null);
      setConfirmedTaskText('');
      setTaskText('');
      resetSessionProgress();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
    }
  };

  const returnToStuckTypes = () => {
    setStuckType(null);
    resetTooBigLocalState();
    resetNoBeginningState();
    resetVersionZeroState();
    resetBoredomState();
  };

  const returnToActivationMenu = () => {
    setNoBeginningStage('menu');
  };

  const tryAnotherStartTool = () => {
    setMethodRewarded(false);
    setNoBeginningXpEarned(0);
    setNoBeginningCompleteCopy(null);
    setCompletedMethod(null);
    setNoBeginningStage('menu');
  };

  const saveTimerWin = () => {
    if (methodRewarded) return;
    const title = buildTimerWinTitle(noBeginningTaskText, timerDuration);
    const category = inferTinyWinCategory(noBeginningTaskText, 'work-study');
    awardNoBeginningWin(title, category);
    goToNoBeginningComplete('timer');
  };

  const saveCueWin = () => {
    if (methodRewarded) return;
    const title = buildCueWinTitle(cueWill);
    const category = inferTinyWinCategory(cueWill || noBeginningTaskText, 'work-study');
    awardNoBeginningWin(title, category);
    goToNoBeginningComplete('cue');
  };

  const finishBlockerSession = () => {
    setNoBeginningXpEarned(blockerSessionXp);
    goToNoBeginningComplete('blocker');
  };

  const toggleBlockerComplete = (id: string) => {
    const item = blockerItems.find((row) => row.id === id);
    if (!item || !item.text.trim()) return;

    if (item.completed) {
      setBlockerItems((prev) =>
        prev.map((row) => (row.id === id ? { ...row, completed: false } : row)),
      );
      setBlockerCompletedCount((n) => Math.max(0, n - 1));
      return;
    }

    if (!item.rewarded) {
      const title = buildBlockerWinTitle(noBeginningTaskText, item.text);
      const category = inferTinyWinCategory(noBeginningTaskText, 'body-reset');
      addTinyWin(title.slice(0, 80), category, false);
      if (!hasMarkedBlockerAchievement) {
        markAchievementEvent('cant-start-quest');
        setHasMarkedBlockerAchievement(true);
      }
      setBlockerSessionXp((xp) => xp + NO_BEGINNING_XP);
    }

    setBlockerItems((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, completed: true, rewarded: true } : row,
      ),
    );
    setBlockerCompletedCount((n) => n + 1);
  };

  const startBlockerEdit = (id: string) => {
    const item = blockerItems.find((row) => row.id === id);
    if (!item) return;
    setBlockerEditingId(id);
    setBlockerEditingText(item.text);
  };

  const saveBlockerEdit = (id: string) => {
    const trimmed = blockerEditingText.trim();
    const item = blockerItems.find((row) => row.id === id);
    if (!trimmed) {
      if (item && !item.text.trim()) {
        if (item.completed) setBlockerCompletedCount((n) => Math.max(0, n - 1));
        setBlockerItems((prev) => prev.filter((row) => row.id !== id));
      }
      setBlockerEditingId(null);
      setBlockerEditingText('');
      return;
    }
    setBlockerItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, text: trimmed } : row)),
    );
    setBlockerEditingId(null);
    setBlockerEditingText('');
  };

  const cancelBlockerEdit = (id: string) => {
    const item = blockerItems.find((row) => row.id === id);
    if (item && !item.text.trim()) {
      if (item.completed) setBlockerCompletedCount((n) => Math.max(0, n - 1));
      setBlockerItems((prev) => prev.filter((row) => row.id !== id));
    }
    setBlockerEditingId(null);
    setBlockerEditingText('');
  };

  const deleteBlockerItem = (id: string) => {
    const item = blockerItems.find((row) => row.id === id);
    if (item?.completed) setBlockerCompletedCount((n) => Math.max(0, n - 1));
    if (blockerEditingId === id) {
      setBlockerEditingId(null);
      setBlockerEditingText('');
    }
    setBlockerItems((prev) => prev.filter((row) => row.id !== id));
  };

  const submitCustomBlocker = () => {
    const trimmed = customBlockerText.trim();
    if (!trimmed) return;
    setBlockerItems((prev) => [
      ...prev,
      {
        id: `blocker-custom-${Date.now()}`,
        text: trimmed,
        completed: false,
        rewarded: false,
        isCustom: true,
      },
    ]);
    setCustomBlockerText('');
    setShowCustomBlocker(false);
  };

  const startTinyTimer = () => {
    const duration = isCustomDuration ? resolvedCustomMinutes : timerDuration;
    if (!duration) return;
    setTimerDuration(duration);
    setTimerOrigin('timer-tool');
    setTimerRunKey((k) => k + 1);
    setNoBeginningStage('timer-running');
  };

  const startCueTimer = () => {
    const duration = isCueTimerCustom ? resolvedCueTimerMinutes : cueDuration;
    if (!duration) return;
    setTimerDuration(duration);
    setTimerOrigin('start-cue');
    setTimerRunKey((k) => k + 1);
    setNoBeginningStage('timer-running');
  };

  const saveTimerResultWin = () => {
    if (timerOrigin === 'start-cue') {
      saveCueWin();
    } else {
      saveTimerWin();
    }
  };

  const backFromTimerRunning = () => {
    if (timerOrigin === 'start-cue') {
      setNoBeginningStage('cue-ready');
    } else {
      setNoBeginningStage('timer-setup');
    }
  };

  const backFromTimerResult = () => {
    if (timerOrigin === 'start-cue') {
      setNoBeginningStage('cue-ready');
    } else {
      setNoBeginningStage('timer-setup');
    }
  };

  const backFromComplete = () => {
    if (completedMethod === 'timer') setNoBeginningStage('timer-result');
    else if (completedMethod === 'cue') setNoBeginningStage('cue-ready');
    else if (completedMethod === 'blocker') setNoBeginningStage('blocker-choice');
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

          {isNoBeginningFlow && noBeginningStage === 'menu' ? (
            <View style={styles.stageShell}>
              <View style={styles.stageInner}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                  I DON&apos;T KNOW HOW TO START
                </Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  What could help you get moving?
                </Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary, marginBottom: nbSectionGap }]}>
                  You may already know what the task is. Choose one way to make starting easier.
                  You do not have to commit to finishing.
                </Text>

                <View style={[styles.taskFieldBlock, { marginBottom: nbSectionGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What are you trying to begin?
                  </Text>
                  <TextInput
                    value={noBeginningTaskText}
                    onChangeText={(v) => setNoBeginningTaskText(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. presentation, kitchen, reply to Ana"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What are you trying to begin?"
                    onFocus={() => setNbInputFocused(true)}
                    onBlur={() => setNbInputFocused(false)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: nbInputFocused ? theme.accent : theme.surfaceBorder,
                      },
                      nbInputFocused && styles.taskInputFocused,
                    ]}
                  />
                </View>

                <View style={{ marginBottom: nbSectionGap }}>
                <ActivationMethodsGrid columns={methodColumns} gap={methodGap}>
                  {ACTIVATION_METHODS.map((method) => (
                    <ActivationMethodCard
                      key={method.id}
                      icon={method.icon}
                      title={method.title}
                      description={method.description}
                      onPress={() => {
                        if (method.id === 'timer') {
                          setNoBeginningStage('timer-setup');
                        } else if (method.id === 'cue') {
                          setCueWill(noBeginningTaskText);
                          setNoBeginningStage('cue-setup');
                        } else {
                          resetBlockerSession();
                          setNoBeginningStage('blocker-choice');
                        }
                      }}
                    />
                  ))}
                </ActivationMethodsGrid>
                </View>
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'timer-setup' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.formInner]}>
                <InternalBack label="Back to start tools" onPress={returnToActivationMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>TINY TIMER</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>Give it a few minutes.</Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary, marginBottom: nbFieldGap }]}>
                  You are allowed to stop when the timer ends. Starting is the whole goal.
                </Text>

                <View style={[styles.taskFieldBlock, { marginBottom: nbFieldGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What will you touch first?
                  </Text>
                  <TextInput
                    value={noBeginningTaskText}
                    onChangeText={(v) => setNoBeginningTaskText(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="Open the presentation, wash one dish..."
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What will you touch first?"
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  Duration
                </Text>
                <View style={styles.durationRow}>
                  {TIMER_PRESETS.map((mins) => (
                    <DurationChip
                      key={mins}
                      label={`${mins} min`}
                      selected={!isCustomDuration && timerDuration === mins}
                      onPress={() => {
                        setIsCustomDuration(false);
                        setTimerDuration(mins);
                      }}
                    />
                  ))}
                  <DurationChip
                    label="Custom"
                    selected={isCustomDuration}
                    onPress={() => setIsCustomDuration(true)}
                  />
                </View>

                {isCustomDuration ? (
                  <View style={[styles.taskFieldBlock, { marginBottom: nbFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Custom minutes</Text>
                    <TextInput
                      value={customDurationInput}
                      onChangeText={(v) => setCustomDurationInput(sanitizeCustomMinutesInput(v))}
                      placeholder="e.g. 7"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                      accessibilityLabel="Custom minutes"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (canStartTimer) startTinyTimer();
                      }}
                      style={[
                        styles.taskInput,
                        styles.customDurationInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: customDurationErrorText ? theme.accent : theme.surfaceBorder,
                        },
                      ]}
                    />
                    {customDurationErrorText ? (
                      <Text style={[styles.validationText, { color: theme.accent }]}>
                        {customDurationErrorText}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.actionStack}>
                  <View style={[styles.compactBtn, !canStartTimer && styles.continueDisabled]}>
                    <GradientButton
                      label="Start tiny timer"
                      onPress={() => {
                        if (!canStartTimer) return;
                        startTinyTimer();
                      }}
                      small
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'timer-running' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.timerRunningInner]}>
                <InternalBack
                  label={timerOrigin === 'start-cue' ? 'Back to my cue' : 'Back to timer setup'}
                  onPress={backFromTimerRunning}
                />
                <GentleTimer
                  key={`nb-timer-${timerRunKey}-${timerDuration}`}
                  durationMinutes={timerDuration}
                  title={timerDisplayTitle || undefined}
                  compact
                  onFinish={() => setNoBeginningStage('timer-result')}
                />
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'timer-result' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, isSuccessNarrow && styles.successInnerDesktop]}>
                <InternalBack
                  label={timerOrigin === 'start-cue' ? 'Back to my cue' : 'Back to timer setup'}
                  onPress={backFromTimerResult}
                />
                <GlassCard style={styles.successCard}>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    {timerOrigin === 'start-cue' ? 'Your cue got you moving.' : 'You showed up.'}
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    {timerOrigin === 'start-cue'
                      ? 'You gave the task the time you planned. You can save the start or stop here.'
                      : 'You gave the task some real time. You can stop here or choose what comes next.'}
                  </Text>
                  <View style={styles.successActions}>
                    <View style={styles.successBtn}>
                      <GradientButton
                        label={
                          timerOrigin === 'start-cue'
                            ? `Save this start +${NO_BEGINNING_XP} XP`
                            : `Save this as a tiny win +${NO_BEGINNING_XP} XP`
                        }
                        onPress={saveTimerResultWin}
                        small
                      />
                    </View>
                    <GradientButton
                      label={`Keep going for ${timerDuration} more`}
                      onPress={() => {
                        setTimerRunKey((k) => k + 1);
                        setNoBeginningStage('timer-running');
                      }}
                      variant="secondary"
                      small
                      style={styles.successBtn}
                    />
                    {timerOrigin === 'start-cue' ? (
                      <Pressable
                        onPress={() => setNoBeginningStage('cue-ready')}
                        accessibilityRole="button"
                        accessibilityLabel="Back to my cue"
                        style={({ pressed }) => [styles.quietAction, pressed && styles.pressed]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Back to my cue
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={returnToActivationMenu}
                        accessibilityRole="button"
                        accessibilityLabel="Try another way to start"
                        style={({ pressed }) => [styles.quietAction, pressed && styles.pressed]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Try another way to start
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'cue-setup' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.formInner]}>
                <InternalBack label="Back to start tools" onPress={returnToActivationMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>START CUE</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>Give the task a clear moment to begin.</Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary, marginBottom: nbFieldGap }]}>
                  Connect the task to something that is already going to happen. Your brain gets a
                  cue instead of another decision.
                </Text>

                <View style={[styles.taskFieldBlock, { marginBottom: nbFieldGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>When...</Text>
                  <TextInput
                    value={cueWhen}
                    onChangeText={setCueWhen}
                    placeholder="I finish my coffee"
                    placeholderTextColor={theme.textMuted}
                    accessibilityLabel="When"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                  />
                  <View style={styles.exampleRow}>
                    {CUE_WHEN_EXAMPLES.map((example) => (
                      <TagPill
                        key={example}
                        label={example}
                        onPress={() => setCueWhen(example)}
                      />
                    ))}
                  </View>
                </View>

                <View style={[styles.taskFieldBlock, { marginBottom: nbFieldGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>I will...</Text>
                  <TextInput
                    value={cueWill}
                    onChangeText={setCueWill}
                    placeholder="open the presentation"
                    placeholderTextColor={theme.textMuted}
                    accessibilityLabel="I will"
                    returnKeyType="done"
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  For...
                </Text>
                <View style={[styles.durationRow, { marginBottom: nbFieldGap }]}>
                  {CUE_DURATION_PRESETS.map((mins) => (
                    <DurationChip
                      key={mins}
                      label={`${mins} minutes`}
                      selected={cueDuration === mins}
                      onPress={() => setCueDuration(mins)}
                    />
                  ))}
                </View>

                <View style={styles.actionStack}>
                  <View
                    style={[
                      styles.compactBtn,
                      (!cueWhen.trim() || !cueWill.trim()) && styles.continueDisabled,
                    ]}>
                    <GradientButton
                      label="Create my start cue"
                      onPress={() => {
                        if (!cueWhen.trim() || !cueWill.trim()) return;
                        setNoBeginningStage('cue-ready');
                      }}
                      small
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'cue-ready' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.cueReadyInner]}>
                <InternalBack
                  label="Back to edit cue"
                  onPress={() => setNoBeginningStage('cue-setup')}
                />
                <GlassCard style={[styles.cueStatementCard, { marginBottom: cueReadySmallGap }]}>
                  <Text style={[styles.cueStatementText, { color: theme.text }]}>
                    When {cueWhen.trim()}, I&apos;ll {cueWill.trim()} for {cueDuration} minutes.
                  </Text>
                </GlassCard>
                <Text
                  style={[
                    styles.cueSupportText,
                    { color: theme.textSecondary, marginBottom: cueReadyGap },
                  ]}>
                  You do not have to finish. This is only your way into the task.
                </Text>

                <View
                  style={[
                    styles.cueTimerHelperPanel,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.surfaceBorder,
                      marginBottom: cueReadyGap,
                    },
                  ]}>
                  <Text style={[styles.cueTimerHelperTitle, { color: theme.text }]}>
                    Need a little help beginning?
                  </Text>
                  <Text style={[styles.cueTimerHelperBody, { color: theme.textSecondary }]}>
                    Use a short timer, or start without one.
                  </Text>
                  <View style={styles.cueTimerControlsRow}>
                    <DurationChip
                      label={`${cueDuration} min`}
                      selected={!isCueTimerCustom}
                      onPress={() => setIsCueTimerCustom(false)}
                    />
                    <DurationChip
                      label="Custom"
                      selected={isCueTimerCustom}
                      onPress={() => setIsCueTimerCustom(true)}
                    />
                    <View style={[styles.cueStartTimerBtn, !canStartCueTimer && styles.continueDisabled]}>
                      <GradientButton
                        label="Start timer"
                        onPress={() => {
                          if (!canStartCueTimer) return;
                          startCueTimer();
                        }}
                        variant="secondary"
                        small
                      />
                    </View>
                  </View>
                  {isCueTimerCustom ? (
                    <View style={styles.cueTimerCustomField}>
                      <TextInput
                        value={cueTimerCustomInput}
                        onChangeText={(v) => setCueTimerCustomInput(sanitizeCustomMinutesInput(v))}
                        placeholder="e.g. 7"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="number-pad"
                        accessibilityLabel="Custom timer minutes"
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (canStartCueTimer) startCueTimer();
                        }}
                        style={[
                          styles.taskInput,
                          styles.customDurationInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: cueTimerCustomError ? theme.accent : theme.surfaceBorder,
                          },
                        ]}
                      />
                      {cueTimerCustomError ? (
                        <Text style={[styles.validationText, { color: theme.accent }]}>
                          {cueTimerCustomError}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={[styles.cuePrimaryAction, { marginBottom: cueReadySmallGap }]}>
                  <GradientButton
                    label={`I started with this cue +${NO_BEGINNING_XP} XP`}
                    onPress={saveCueWin}
                    small
                  />
                </View>

                <Pressable
                  onPress={returnToActivationMenu}
                  accessibilityRole="button"
                  accessibilityLabel="Try another way to start"
                  style={({ pressed }) => [styles.quietAction, pressed && styles.pressed]}>
                  <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                    Try another way to start
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'blocker-choice' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.formInner]}>
                <InternalBack label="Back to start tools" onPress={returnToActivationMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>CLEAR THE WAY</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  What is making the start harder?
                </Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary, marginBottom: nbFieldGap }]}>
                  Clear one blocker or a few. Every small obstacle you remove makes starting
                  easier.
                </Text>

                <View style={styles.blockerList}>
                  {blockerItems.map((item) => (
                    <BlockerChecklistRow
                      key={item.id}
                      item={item}
                      isEditing={blockerEditingId === item.id}
                      editingText={blockerEditingText}
                      onEditingTextChange={setBlockerEditingText}
                      onToggleComplete={() => toggleBlockerComplete(item.id)}
                      onStartEdit={() => startBlockerEdit(item.id)}
                      onSaveEdit={() => saveBlockerEdit(item.id)}
                      onCancelEdit={() => cancelBlockerEdit(item.id)}
                      onDelete={() => deleteBlockerItem(item.id)}
                      stepXp={NO_BEGINNING_XP}
                    />
                  ))}
                  {!showCustomBlocker ? (
                    <Pressable
                      onPress={() => setShowCustomBlocker(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Write my own blocker"
                      style={({ pressed }) => [styles.customBlockerBtn, pressed && styles.pressed]}>
                      <Text style={[styles.addStepText, { color: theme.accentSecondary }]}>
                        + Write my own blocker
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.customBlockerInputRow}>
                      <TextInput
                        value={customBlockerText}
                        onChangeText={setCustomBlockerText}
                        placeholder="Describe one small blocker..."
                        placeholderTextColor={theme.textMuted}
                        accessibilityLabel="Custom blocker"
                        returnKeyType="done"
                        onSubmitEditing={submitCustomBlocker}
                        autoFocus
                        style={[
                          styles.taskInput,
                          styles.customBlockerInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.surface,
                            borderColor: theme.surfaceBorder,
                          },
                        ]}
                      />
                      <View style={styles.customBlockerInputActions}>
                        <Pressable
                          onPress={submitCustomBlocker}
                          accessibilityRole="button"
                          accessibilityLabel="Add blocker"
                          style={[styles.editSaveBtn, { backgroundColor: theme.accentSecondary + '44' }]}>
                          <Text style={[styles.editSaveText, { color: theme.text }]}>Add</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setShowCustomBlocker(false);
                            setCustomBlockerText('');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel custom blocker"
                          hitSlop={8}
                          style={styles.editCancelBtn}>
                          <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>

                {blockerCompletedCount > 0 ? (
                  <View style={[styles.actionStack, { marginTop: nbFieldGap }]}>
                    <View style={styles.compactBtn}>
                      <GradientButton
                        label="That's enough for now"
                        onPress={finishBlockerSession}
                        small
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {isNoBeginningFlow && noBeginningStage === 'complete' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, isSuccessNarrow && styles.successInnerDesktop]}>
                <InternalBack
                  label={
                    completedMethod === 'timer'
                      ? 'Back to timer result'
                      : completedMethod === 'cue'
                        ? 'Back to my cue'
                        : 'Back to my blocker'
                  }
                  onPress={backFromComplete}
                />
                <GlassCard style={styles.successCard}>
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
                    {noBeginningCompleteCopy?.headline ?? NO_BEGINNING_HEADLINES[0]}
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    {noBeginningCompleteCopy?.support ?? NO_BEGINNING_SUPPORT[0]}
                  </Text>
                  <View style={styles.sessionStats}>
                    {completedMethod === 'blocker' ? (
                      <>
                        <Text style={[styles.sessionStat, { color: theme.text }]}>
                          {blockerCompletedCount} blocker{blockerCompletedCount === 1 ? '' : 's'}{' '}
                          cleared
                        </Text>
                        <Text style={[styles.sessionStat, { color: theme.text }]}>
                          +{noBeginningXpEarned} XP earned
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.sessionStat, { color: theme.text }]}>
                          Method completed: {completedMethod ? METHOD_LABELS[completedMethod] : ''}
                        </Text>
                        <Text style={[styles.sessionStat, { color: theme.text }]}>
                          +{noBeginningXpEarned} XP earned
                        </Text>
                      </>
                    )}
                    <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                      Your garden grows from tiny starts too.
                    </Text>
                  </View>
                  <View style={styles.successActions}>
                    <View style={styles.successBtn}>
                      <GradientButton
                        label="Back to dashboard"
                        onPress={() => router.push('/dashboard' as never)}
                        small
                      />
                    </View>
                    <GradientButton
                      label="Try another start tool"
                      onPress={tryAnotherStartTool}
                      variant="secondary"
                      small
                      style={styles.successBtn}
                    />
                  </View>
                  <View style={styles.successLinks}>
                    <Pressable
                      onPress={() => router.push('/garden' as never)}
                      accessibilityRole="link"
                      accessibilityLabel="Check out your garden"
                      style={({ pressed }) => [styles.successLink, pressed && styles.pressed]}>
                      <Text style={[styles.successLinkText, { color: theme.accentSecondary }]}>
                        Check out your garden
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={returnToStuckTypes}
                      accessibilityRole="button"
                      accessibilityLabel="Choose another stuck type"
                      style={({ pressed }) => [styles.successLink, pressed && styles.pressed]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Choose another stuck type
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {isVersionZeroFlow && versionZeroStage === 'menu' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.vzMenuInner]}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                  I&apos;M SCARED IT WON&apos;T BE GOOD
                </Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  It doesn&apos;t need to be good yet.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: vzSectionGap },
                  ]}>
                  You are not making the final version. You are making something you can return to,
                  change, and improve.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: vzSectionGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.text }]}>
                    The first version only has one job: exist.
                  </Text>
                </GlassCard>

                <View style={[styles.taskFieldBlock, { marginBottom: vzSectionGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What are you making?
                  </Text>
                  <TextInput
                    value={versionZeroTaskText}
                    onChangeText={(v) => setVersionZeroTaskText(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. a presentation, message, design, report"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What are you making?"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={() => {}}
                    onFocus={() => setVzInputFocused(true)}
                    onBlur={() => setVzInputFocused(false)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: vzInputFocused ? theme.accent : theme.surfaceBorder,
                      },
                      vzInputFocused && styles.taskInputFocused,
                    ]}
                  />
                  <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                    We&apos;ll use this to suggest a safer first version.
                  </Text>
                </View>

                <ActivationMethodsGrid columns={methodColumns} gap={methodGap}>
                  {VERSION_ZERO_MODES.map((mode) => (
                    <ActivationMethodCard
                      key={mode.id}
                      icon={mode.icon}
                      title={mode.title}
                      description={mode.description}
                      onPress={() => selectVersionZeroMode(mode.id)}
                    />
                  ))}
                </ActivationMethodsGrid>
              </View>
            </View>
          ) : null}

          {isVersionZeroFlow && versionZeroStage === 'active' && versionZeroMode ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.vzActiveInner]}>
                <InternalBack
                  label="Choose a different Version Zero"
                  onPress={returnToVersionZeroMenu}
                />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>VERSION ZERO</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Make something editable.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  This is raw material, not a final result. It can be incomplete, awkward, or wrong.
                </Text>

                {versionZeroTaskText.trim() ? (
                  <View style={styles.vzTaskSummaryRow}>
                    {versionZeroEditingTask ? (
                      <TextInput
                        value={versionZeroTaskText}
                        onChangeText={(v) => setVersionZeroTaskText(v.slice(0, TASK_TEXT_MAX))}
                        maxLength={TASK_TEXT_MAX}
                        accessibilityLabel="Edit what you are making"
                        autoFocus
                        onBlur={() => setVersionZeroEditingTask(false)}
                        style={[
                          styles.vzTaskEditInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.surface,
                            borderColor: theme.surfaceBorder,
                          },
                        ]}
                      />
                    ) : (
                      <>
                        <Text style={[styles.vzTaskSummary, { color: theme.textSecondary }]}>
                          You&apos;re making:{' '}
                          <Text style={{ color: theme.text, fontWeight: '600' }}>
                            {versionZeroTaskKind !== 'general'
                              ? getVersionZeroTaskKindLabel(versionZeroTaskKind)
                              : versionZeroTaskText.trim().charAt(0).toUpperCase() +
                                versionZeroTaskText.trim().slice(1)}
                          </Text>
                        </Text>
                        <Pressable
                          onPress={() => setVersionZeroEditingTask(true)}
                          accessibilityRole="button"
                          accessibilityLabel="Edit task"
                          style={({ pressed, focused }: PressableFocusState) => [
                            styles.vzEditBtn,
                            pressed && styles.pressed,
                            focused && Platform.OS === 'web' ? styles.focusRing : null,
                          ]}>
                          <Text style={[styles.vzEditBtnText, { color: theme.textMuted }]}>
                            Edit
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                ) : null}

                <GlassCard
                  style={[
                    styles.vzInstructionCard,
                    {
                      borderColor: theme.accent,
                      marginBottom: spacing.lg,
                    },
                  ]}>
                  <Text style={[styles.vzModeLabel, { color: theme.textMuted }]}>
                    {getVersionZeroModeLabel(versionZeroMode)}
                  </Text>
                  <Text style={[styles.vzInstructionText, { color: theme.text }]}>
                    {versionZeroPrompt}
                  </Text>
                  <Text style={[styles.vzInstructionSupport, { color: theme.textSecondary }]}>
                    Stop as soon as this version exists.
                  </Text>
                </GlassCard>

                {versionZeroReminder ? (
                  <VersionZeroReminderCard
                    reminder={versionZeroReminder}
                    onAnother={cycleVersionZeroReminder}
                  />
                ) : null}

                <PressureRuleCard
                  ruleState={pressureRuleState}
                  onCrumple={() => setPressureRuleState('crumpled')}
                  onThrowAway={() => setPressureRuleState('trashed')}
                />

                <View style={styles.actionStack}>
                  {versionZeroRewarded ? (
                    <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                      <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                        Version Zero saved ✓
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.compactBtn}>
                      <GradientButton
                        label={`I made Version Zero +${VERSION_ZERO_XP} XP`}
                        onPress={awardVersionZeroWin}
                        small
                      />
                    </View>
                  )}
                  <Pressable
                    onPress={returnToVersionZeroMenu}
                    accessibilityRole="button"
                    accessibilityLabel="This version doesn't fit"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.quietAction,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      This version doesn&apos;t fit
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.vzSafetyCopy, { color: theme.textMuted }]}>
                  You are allowed to stop after Version Zero.
                </Text>
              </View>
            </View>
          ) : null}

          {isVersionZeroFlow && versionZeroStage === 'complete' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.vzCompleteInner]}>
                <InternalBack
                  label="Back to Version Zero"
                  onPress={() => setVersionZeroStage('active')}
                />
                <GlassCard style={styles.successCard}>
                  <Text style={styles.vzCompleteBadge} accessibilityLabel="Celebration">
                    ✨
                  </Text>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    You made something editable!
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    The blank page is gone. You do not have to improve it right now.
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      1 Version Zero created
                    </Text>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      +{versionZeroXpEarned} XP earned
                    </Text>
                    <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                      Your garden grows from imperfect starts too.
                    </Text>
                  </View>
                  <View style={styles.successActions}>
                    <View style={styles.successBtn}>
                      <GradientButton
                        label="Back to dashboard"
                        onPress={() => router.push('/dashboard' as never)}
                        small
                      />
                    </View>
                  </View>
                  <View style={styles.successLinks}>
                    <Pressable
                      onPress={() => setVersionZeroStage('active')}
                      accessibilityRole="button"
                      accessibilityLabel="Keep working on Version Zero"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Keep working on Version Zero
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/garden' as never)}
                      accessibilityRole="link"
                      accessibilityLabel="Check out your garden"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.accentSecondary }]}>
                        Check out your garden
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={returnToStuckTypes}
                      accessibilityRole="button"
                      accessibilityLabel="Choose another stuck type"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Choose another stuck type
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'menu' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomMenuInner]}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>I&apos;M BORED</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Let&apos;s make this less boring.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: bdSectionGap },
                  ]}>
                  Boredom does not always mean you are lazy or doing the wrong thing. The task may
                  need novelty, a different entry point, or a real break.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: bdSectionGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.text }]}>
                    The task is allowed to be boring. The way you enter it doesn&apos;t have to be.
                  </Text>
                </GlassCard>

                <View style={[styles.taskFieldBlock, { marginBottom: bdSectionGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What are you trying to do?
                  </Text>
                  <TextInput
                    value={boredomTaskText}
                    onChangeText={(v) => setBoredomTaskText(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. clean the kitchen, finish a report, answer emails"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What are you trying to do?"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={() => {}}
                    onFocus={() => setBdInputFocused(true)}
                    onBlur={() => setBdInputFocused(false)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: bdInputFocused ? theme.accent : theme.surfaceBorder,
                      },
                      bdInputFocused && styles.taskInputFocused,
                    ]}
                  />
                  <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                    We&apos;ll use this to make the suggestions a little more relevant.
                  </Text>
                </View>

                <ActivationMethodsGrid columns={boredomMethodColumns} gap={methodGap}>
                  {BOREDOM_METHODS.map((method) => (
                    <ActivationMethodCard
                      key={method.id}
                      icon={method.icon}
                      title={method.title}
                      description={method.description}
                      onPress={() => selectBoredomMethod(method.id)}
                    />
                  ))}
                </ActivationMethodsGrid>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'challenge' && currentChallenge ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomActiveInner]}>
                <InternalBack label="Back to boredom tools" onPress={returnToBoredomMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>ROLL A CHALLENGE</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Let&apos;s give the task a weird little rule.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  You are not committing to the whole task. Try one playful constraint and see
                  whether your brain wakes up.
                </Text>

                {boredomTaskText.trim() ? (
                  <Text style={[styles.taskSummary, { color: theme.textSecondary }]}>
                    You&apos;re trying to:{' '}
                    <Text style={{ color: theme.text, fontWeight: '600' }}>
                      {boredomTaskText.trim().charAt(0).toUpperCase() +
                        boredomTaskText.trim().slice(1)}
                    </Text>
                  </Text>
                ) : null}

                <GlassCard
                  style={[
                    styles.boredomChallengeCard,
                    {
                      borderColor: theme.accent,
                      marginBottom: spacing.lg,
                    },
                  ]}>
                  <BoredomChallengeDice shuffleKey={challengeShuffleKey} />
                  <Text style={[styles.vzModeLabel, { color: theme.textMuted }]}>
                    {currentChallenge.categoryLabel}
                  </Text>
                  <Text style={[styles.vzInstructionText, { color: theme.text }]}>
                    {currentChallenge.text}
                  </Text>
                  {currentChallenge.explanation ? (
                    <Text style={[styles.vzInstructionSupport, { color: theme.textSecondary }]}>
                      {currentChallenge.explanation}
                    </Text>
                  ) : null}
                </GlassCard>

                <View style={styles.actionStack}>
                  {boredomRewarded ? (
                    <>
                      <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                        <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                          Tiny win saved ✓
                        </Text>
                      </View>
                      <Pressable
                        onPress={returnToBoredomMenu}
                        accessibilityRole="button"
                        accessibilityLabel="Choose a different approach"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Choose a different approach
                        </Text>
                      </Pressable>
                    </>
                  ) : !challengeStarted ? (
                    <>
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label="Try this challenge"
                          onPress={() => setChallengeStarted(true)}
                          small
                        />
                      </View>
                      <Pressable
                        onPress={rollBoredomChallenge}
                        accessibilityRole="button"
                        accessibilityLabel="Roll again"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Roll again ↻
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label={`I tried it +${BOREDOM_XP} XP`}
                          onPress={completeChallengeWin}
                          small
                        />
                      </View>
                      <Pressable
                        onPress={rollBoredomChallenge}
                        accessibilityRole="button"
                        accessibilityLabel="Pick a different challenge"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Pick a different challenge
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'interesting-part' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomActiveInner]}>
                <InternalBack label="Back to boredom tools" onPress={returnToBoredomMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                  START SOMEWHERE INTERESTING
                </Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You are allowed to work out of order.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: bdFieldGap },
                  ]}>
                  The correct first step is not always the best first step. Begin with the part that
                  gives your brain something to care about.
                </Text>

                {boredomTaskText.trim() ? (
                  <Text style={[styles.taskSummary, { color: theme.textSecondary }]}>
                    You&apos;re trying to:{' '}
                    <Text style={{ color: theme.text, fontWeight: '600' }}>
                      {boredomTaskText.trim().charAt(0).toUpperCase() +
                        boredomTaskText.trim().slice(1)}
                    </Text>
                  </Text>
                ) : null}

                <View style={[styles.taskFieldBlock, { marginBottom: bdFieldGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    Which part feels least boring?
                  </Text>
                  <TextInput
                    value={interestingPartText}
                    onChangeText={(v) => setInterestingPartText(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. choosing the images, styling the last slide, organizing one shelf"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="Which part feels least boring?"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={() => {}}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                  />
                  <View style={styles.exampleRow}>
                    {INTERESTING_PART_PRESETS.map((preset) => (
                      <TagPill
                        key={preset}
                        label={preset}
                        onPress={() => setInterestingPartText(preset.slice(0, TASK_TEXT_MAX))}
                      />
                    ))}
                  </View>
                </View>

                {interestingPartText.trim() ? (
                  <GlassCard
                    style={[
                      styles.vzStatementCard,
                      {
                        backgroundColor: theme.accentTertiary,
                        borderColor: theme.accent,
                        marginBottom: bdFieldGap,
                      },
                    ]}>
                    <Text style={[styles.vzStatementText, { color: theme.text }]}>
                      Start with: {interestingPartText.trim()}
                    </Text>
                    <Text
                      style={[
                        styles.cueSupportText,
                        { color: theme.textSecondary, marginTop: spacing.sm },
                      ]}>
                      You can return to the &quot;correct&quot; order later.
                    </Text>
                  </GlassCard>
                ) : null}

                <View style={styles.actionStack}>
                  {boredomRewarded ? (
                    <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                      <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                        Tiny win saved ✓
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.compactBtn,
                        !interestingPartText.trim() && styles.continueDisabled,
                      ]}>
                      <GradientButton
                        label={`I started with this part +${BOREDOM_XP} XP`}
                        onPress={completeInterestingPartWin}
                        small
                      />
                    </View>
                  )}
                  <Pressable
                    onPress={returnToBoredomMenu}
                    accessibilityRole="button"
                    accessibilityLabel="Choose a different approach"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.quietAction,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      Choose a different approach
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'break-setup' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomActiveInner]}>
                <InternalBack label="Back to boredom tools" onPress={returnToBoredomMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>INTENTIONAL BREAK</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Take a break with an ending.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: bdFieldGap },
                  ]}>
                  Sometimes boredom means your brain needs a real switch. Choose something pleasant,
                  give it a limit, and leave yourself one gentle step back.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: bdFieldGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.text }]}>
                    A break can be a tool when it has an ending and a way back.
                  </Text>
                </GlassCard>

                <View style={[styles.taskFieldBlock, { marginBottom: bdFieldGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What would feel good right now?
                  </Text>
                  <TextInput
                    value={breakActivity}
                    onChangeText={(v) => setBreakActivity(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. make coffee, watch one video, play one round"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What would feel good right now?"
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                  />
                  <View style={styles.exampleRow}>
                    {BREAK_ACTIVITY_PRESETS.map((preset) => (
                      <TagPill
                        key={preset}
                        label={preset}
                        onPress={() => setBreakActivity(preset.slice(0, TASK_TEXT_MAX))}
                      />
                    ))}
                  </View>
                </View>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  Duration
                </Text>
                <View style={styles.durationRow}>
                  {BREAK_DURATION_PRESETS.map((mins) => (
                    <DurationChip
                      key={mins}
                      label={`${mins} min`}
                      selected={!isBreakDurationCustom && breakDuration === mins}
                      onPress={() => {
                        setIsBreakDurationCustom(false);
                        setBreakDuration(mins);
                      }}
                    />
                  ))}
                  <DurationChip
                    label="Custom"
                    selected={isBreakDurationCustom}
                    onPress={() => setIsBreakDurationCustom(true)}
                  />
                </View>

                {isBreakDurationCustom ? (
                  <View style={[styles.taskFieldBlock, { marginBottom: bdFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Custom minutes</Text>
                    <TextInput
                      value={breakCustomMinutes}
                      onChangeText={(v) => setBreakCustomMinutes(sanitizeCustomMinutesInput(v))}
                      placeholder="e.g. 7"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                      accessibilityLabel="Custom break minutes"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (canStartBreak) startIntentionalBreak();
                      }}
                      style={[
                        styles.taskInput,
                        styles.customDurationInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: breakCustomErrorText ? theme.accent : theme.surfaceBorder,
                        },
                      ]}
                    />
                    {breakCustomErrorText ? (
                      <Text style={[styles.validationText, { color: theme.accent }]}>
                        {breakCustomErrorText}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={[styles.taskFieldBlock, { marginBottom: bdFieldGap }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What will you come back to?
                  </Text>
                  <TextInput
                    value={breakReturnAction}
                    onChangeText={(v) => setBreakReturnAction(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. open the document and write one sentence"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What will you come back to?"
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                  />
                </View>

                <View style={styles.actionStack}>
                  <View style={[styles.compactBtn, !canStartBreak && styles.continueDisabled]}>
                    <GradientButton
                      label="Start my intentional break"
                      onPress={startIntentionalBreak}
                      small
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'break-running' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.timerRunningInner]}>
                <InternalBack
                  label="Back to break setup"
                  onPress={() => {
                    setBreakRunKey((key) => key + 1);
                    setBoredomStage('break-setup');
                  }}
                />
                <GentleTimer
                  key={`boredom-break-${breakRunKey}-${breakDuration}`}
                  durationMinutes={breakDuration}
                  title={`Break: ${breakActivity.trim() || 'fun break'}`}
                  compact
                  onFinish={() => setBoredomStage('break-result')}
                />
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'break-result' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomActiveInner]}>
                <InternalBack
                  label="Back to break setup"
                  onPress={() => setBoredomStage('break-setup')}
                />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>YOUR WAY BACK</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  The break had an ending.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: bdFieldGap },
                  ]}>
                  You can stop here, or return for one tiny round. No need to finish the whole task.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: bdFieldGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.text }]}>
                    Come back to: {breakReturnAction.trim()}
                  </Text>
                </GlassCard>

                <View style={styles.actionStack}>
                  {boredomRewarded ? (
                    <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                      <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                        Tiny win saved ✓
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.compactBtn}>
                      <GradientButton
                        label={`I'm back at the task +${BOREDOM_XP} XP`}
                        onPress={completeBreakWin}
                        small
                      />
                    </View>
                  )}
                  <GradientButton
                    label="Add 5 more minutes"
                    onPress={addExtraBreakMinutes}
                    variant="secondary"
                    small
                    style={styles.compactBtn}
                  />
                  <Pressable
                    onPress={returnToBoredomMenu}
                    accessibilityRole="button"
                    accessibilityLabel="Choose another boredom tool"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.quietAction,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      Choose another boredom tool
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'boring-tax' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomActiveInner]}>
                <InternalBack label="Back to boredom tools" onPress={returnToBoredomMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                  REMOVE THE BORING TAX
                </Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You do not have to do every part the hard way.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: bdFieldGap },
                  ]}>
                  Pick one shortcut or a few. Simplifying the process is still doing the task.
                </Text>

                <View style={styles.blockerList}>
                  {allBoringTaxOptions.map((option) => (
                    <BoringTaxRow
                      key={option.id}
                      option={option}
                      selected={selectedBoringTaxIds.includes(option.id)}
                      onToggle={() => toggleBoringTaxOption(option.id)}
                      onDelete={
                        option.id.startsWith('custom-tax-')
                          ? () => deleteCustomBoringTax(option.id)
                          : undefined
                      }
                    />
                  ))}
                  {!showCustomBoringTax ? (
                    <Pressable
                      onPress={() => setShowCustomBoringTax(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Write my own shortcut"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.customBlockerBtn,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.addStepText, { color: theme.accentSecondary }]}>
                        + Write my own shortcut
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.customBlockerInputRow}>
                      <TextInput
                        value={customBoringTaxText}
                        onChangeText={(v) => setCustomBoringTaxText(v.slice(0, TASK_TEXT_MAX))}
                        placeholder="Describe one shortcut..."
                        placeholderTextColor={theme.textMuted}
                        maxLength={TASK_TEXT_MAX}
                        accessibilityLabel="Custom shortcut"
                        returnKeyType="done"
                        onSubmitEditing={submitCustomBoringTax}
                        autoFocus
                        style={[
                          styles.taskInput,
                          styles.customBlockerInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.surface,
                            borderColor: theme.surfaceBorder,
                          },
                        ]}
                      />
                      <View style={styles.customBlockerInputActions}>
                        <Pressable
                          onPress={submitCustomBoringTax}
                          accessibilityRole="button"
                          accessibilityLabel="Add shortcut"
                          style={[
                            styles.editSaveBtn,
                            { backgroundColor: theme.accentSecondary + '44' },
                          ]}>
                          <Text style={[styles.editSaveText, { color: theme.text }]}>Add</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setShowCustomBoringTax(false);
                            setCustomBoringTaxText('');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel custom shortcut"
                          hitSlop={8}
                          style={styles.editCancelBtn}>
                          <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>

                {selectedBoringTaxLabels.length > 0 ? (
                  <GlassCard style={[styles.boredomSummaryCard, { marginTop: bdFieldGap }]}>
                    <Text style={[styles.vzModeLabel, { color: theme.textMuted }]}>
                      Your shortcut plan
                    </Text>
                    <Text style={[styles.boredomSummaryText, { color: theme.text }]}>
                      {boringTaxSummary}
                    </Text>
                  </GlassCard>
                ) : null}

                <View style={[styles.actionStack, { marginTop: bdFieldGap }]}>
                  {boredomRewarded ? (
                    <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                      <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                        Tiny win saved ✓
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.compactBtn,
                        selectedBoringTaxLabels.length === 0 && styles.continueDisabled,
                      ]}>
                      <GradientButton
                        label={`I used this shortcut +${BOREDOM_XP} XP`}
                        onPress={completeBoringTaxWin}
                        small
                      />
                    </View>
                  )}
                  <Pressable
                    onPress={() => setSelectedBoringTaxIds([])}
                    accessibilityRole="button"
                    accessibilityLabel="Clear my choices"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.quietAction,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      Clear my choices
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {isBoredomFlow && boredomStage === 'complete' && boredomCompletionCopy ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.boredomCompleteInner]}>
                <InternalBack label="Back to my boredom tool" onPress={backFromBoredomComplete} />
                <GlassCard style={styles.successCard}>
                  <Text style={styles.vzCompleteBadge} accessibilityLabel="Celebration">
                    ✨
                  </Text>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    {boredomCompletionCopy.headline}
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    {boredomCompletionCopy.body}
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      1 boredom strategy used
                    </Text>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      +{boredomXpEarned} XP earned
                    </Text>
                    <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                      Your garden grows from creative starts too.
                    </Text>
                  </View>
                  <View style={styles.successActions}>
                    <View style={styles.successBtn}>
                      <GradientButton
                        label="Back to dashboard"
                        onPress={() => router.push('/dashboard' as never)}
                        small
                      />
                    </View>
                  </View>
                  <View style={styles.successLinks}>
                    <Pressable
                      onPress={tryAnotherBoredomTool}
                      accessibilityRole="button"
                      accessibilityLabel="Try another boredom tool"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Try another boredom tool
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/garden' as never)}
                      accessibilityRole="link"
                      accessibilityLabel="Check out your garden"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.accentSecondary }]}>
                        Check out your garden
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={returnToStuckTypes}
                      accessibilityRole="button"
                      accessibilityLabel="Choose another stuck type"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Choose another stuck type
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {showLegacyQuestStage ? (
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
  methodGrid: {
    width: '100%',
  },
  methodRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  methodCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  methodCardPressable: {
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
  },
  methodCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  methodIcon: {
    fontSize: 32,
    lineHeight: 36,
  },
  methodTitle: {
    ...typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  methodDesc: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formInner: {
    maxWidth: 860,
    alignSelf: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  durationChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationChipText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  customDurationInput: {
    maxWidth: 160,
  },
  validationText: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  exampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  timerRunningInner: {
    maxWidth: 480,
    alignItems: 'center',
  },
  cueCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    width: '100%',
  },
  cueCardText: {
    ...typography.h3,
    textAlign: 'center',
    lineHeight: 28,
  },
  cueReadyInner: {
    maxWidth: 820,
    alignSelf: 'center',
  },
  cueStatementCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  cueStatementText: {
    ...typography.h2,
    textAlign: 'center',
    lineHeight: 32,
  },
  cueSupportText: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    lineHeight: 24,
  },
  cueTimerHelperPanel: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cueTimerHelperTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  cueTimerHelperBody: {
    ...typography.caption,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  cueTimerControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cueStartTimerBtn: {
    maxWidth: 200,
    minWidth: 140,
  },
  cueTimerCustomField: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  cuePrimaryAction: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    alignItems: 'center',
  },
  blockerList: {
    gap: spacing.sm,
    width: '100%',
  },
  customBlockerBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  customBlockerInputRow: {
    gap: spacing.sm,
    width: '100%',
  },
  customBlockerInput: {
    width: '100%',
  },
  customBlockerInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  focusRing: {
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'solid',
          outlineWidth: 2,
          outlineColor: 'rgba(255, 138, 122, 0.55)',
          outlineOffset: 2,
        } as object)
      : null),
  },
  vzMenuInner: {
    maxWidth: VERSION_ZERO_MENU_MAX_WIDTH,
    alignSelf: 'center',
  },
  vzActiveInner: {
    maxWidth: VERSION_ZERO_ACTIVE_MAX_WIDTH,
    alignSelf: 'center',
  },
  vzCompleteInner: {
    maxWidth: VERSION_ZERO_COMPLETE_MAX_WIDTH,
    alignSelf: 'center',
  },
  vzStatementCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  vzStatementText: {
    ...typography.h2,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '700',
  },
  vzFieldHelper: {
    ...typography.caption,
    lineHeight: 18,
  },
  vzTaskSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  vzTaskSummary: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
  },
  vzEditBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  vzEditBtnText: {
    ...typography.caption,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  vzTaskEditInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'web' ? 8 : spacing.xs,
    ...typography.bodySmall,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  vzInstructionCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    width: '100%',
    borderWidth: 1.5,
  },
  vzModeLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  vzInstructionText: {
    ...typography.h3,
    lineHeight: 28,
    fontWeight: '700',
  },
  vzInstructionSupport: {
    ...typography.bodySmall,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  vzReminderCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    width: '100%',
  },
  vzReminderText: {
    ...typography.body,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  vzReminderBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  vzReminderBtnText: {
    ...typography.caption,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pressureRuleCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  pressureRuleTitle: {
    ...typography.caption,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  pressurePaper: {
    width: '100%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    borderStyle: 'dashed',
  },
  pressurePaperText: {
    ...typography.bodySmall,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pressureEmoji: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  pressureStatusText: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 22,
  },
  pressureActionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pressureActionText: {
    ...typography.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  vzCompletedBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  vzCompletedText: {
    ...typography.body,
    fontWeight: '600',
  },
  vzSafetyCopy: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  vzCompleteBadge: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  boredomMenuInner: {
    maxWidth: BOREDOM_MENU_MAX_WIDTH,
    alignSelf: 'center',
  },
  boredomActiveInner: {
    maxWidth: BOREDOM_ACTIVE_MAX_WIDTH,
    alignSelf: 'center',
  },
  boredomCompleteInner: {
    maxWidth: BOREDOM_COMPLETE_MAX_WIDTH,
    alignSelf: 'center',
  },
  boredomChallengeCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    width: '100%',
    borderWidth: 1.5,
    alignItems: 'center',
  },
  boredomDice: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  boredomSummaryCard: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.sm,
  },
  boredomSummaryText: {
    ...typography.body,
    lineHeight: 24,
    fontWeight: '600',
  },
  boringTaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 56,
    borderWidth: 1,
    width: '100%',
  },
  boringTaxMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  boringTaxLabel: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
});
