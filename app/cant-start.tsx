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
import { GentleStopwatch } from '@/components/tools/GentleStopwatch';
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
  ENERGY_PROTECTION_CTA,
  ENERGY_PROTECTION_OPTIONS,
  EnergyProtectionChoice,
  LATE_REPLY_ACTIONS,
  LATE_REPLY_OPENERS,
  LateReplyAction,
  LateReplyOpener,
  MESSAGE_LOOP_COMPLETION_COPY,
  MESSAGE_LOOP_METHODS,
  MessageLoopMethod,
  MessageLoopStage,
  QUICK_CLOSE_GOAL_PRESETS,
  REPLY_INTENTS,
  ReplyIntent,
  buildBoundaryDraft,
  buildLateReplyDraft,
  buildMessageWinTitle,
  buildReplyDraft,
  formatStopwatchTime,
} from '@/data/messageLoop';
import {
  ATTENTION_DEADLINE_MAX,
  ATTENTION_ITEM_CHAR_MAX,
  ATTENTION_PRIORITIES,
  AttentionPriority,
  AttentionTask,
  QUICK_RESET_ITEMS,
  buildAttentionWinTitle,
  canAddAttentionTask,
  makeAttentionTask,
} from '@/data/attentionReset';
import {
  THREAD_CONTEXT_MAX,
  THREAD_CONTEXT_OPTIONS,
  THREAD_MEMORY_MAX,
  THREAD_NOTE_MAX,
  THREAD_TEXT_MAX,
  ThreadContextKind,
  buildFutureNoteDraft,
  buildThreadWinTitle,
  formatComebackTimestamp,
  getThreadContextLabel,
  getThreadSuggestions,
} from '@/data/threadRecovery';
import {
  LOW_ENERGY_DURATION_PRESETS,
  LOW_ENERGY_ENOUGH_PRESETS,
  PAUSE_DURATION_PRESETS,
  PAUSE_OPTIONS,
  RECHARGE_COMPLETION_COPY,
  RECHARGE_METHODS,
  RechargeChecklistItem,
  RechargeMethod,
  RechargeOption,
  RechargeStage,
  TIRED_FEELING_OPTIONS,
  TiredFeeling,
  buildRechargeWinTitle,
  formatSmallerDaySummary,
  getPauseOptionLabel,
  getSuggestedRechargeMethod,
  makeBodyResetItems,
  makeSmallerDayItems,
} from '@/data/recharge';
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
const MESSAGE_CONTEXT_MAX = 60;
const CHECKLIST_MAX = 6;
const REPLY_DRAFT_MAX = 1000;
const UNSENT_DRAFT_MAX = 2000;
const QUICK_CLOSE_CUSTOM_PRESET = 'Write my own finish line';
const STEP_XP = calculateXP('tiny-win');
const NO_BEGINNING_XP = calculateXP('tiny-win');
const VERSION_ZERO_XP = calculateXP('tiny-win');
const BOREDOM_XP = calculateXP('tiny-win');
const RECHARGE_XP = calculateXP('tiny-win');
const MESSAGE_LOOP_XP = calculateXP('tiny-win');
const ATTENTION_RESET_XP = calculateXP('tiny-win');
const THREAD_XP = calculateXP('tiny-win');
const VERSION_ZERO_MENU_MAX_WIDTH = 960;
const VERSION_ZERO_ACTIVE_MAX_WIDTH = 880;
const VERSION_ZERO_COMPLETE_MAX_WIDTH = 790;
const BOREDOM_MENU_MAX_WIDTH = 1000;
const BOREDOM_ACTIVE_MAX_WIDTH = 880;
const BOREDOM_COMPLETE_MAX_WIDTH = 790;
const RECHARGE_MENU_MAX_WIDTH = 1000;
const RECHARGE_ACTIVE_MAX_WIDTH = 880;
const RECHARGE_COMPLETE_MAX_WIDTH = 790;
const MESSAGE_LOOP_MENU_MAX_WIDTH = 1000;
const MESSAGE_LOOP_ACTIVE_MAX_WIDTH = 960;
const MESSAGE_LOOP_COMPLETE_MAX_WIDTH = 790;
const ATTENTION_RESET_MAX_WIDTH = 860;
const ATTENTION_RESET_COMPLETE_MAX_WIDTH = 790;
const THREAD_RECOVERY_MAX_WIDTH = 860;
const THREAD_RECOVERY_COMPLETE_MAX_WIDTH = 790;
const MESSAGE_LOOP_STOPWATCH_BTN_MAX = 320;
const TIMER_PRESETS = [2, 5, 10] as const;
const CUE_DURATION_PRESETS = [2, 5, 10] as const;
const BREAK_DURATION_PRESETS = [5, 10, 15] as const;
const LOW_ENERGY_ENOUGH_MAX = 120;
const MESSAGE_LOOP_WIN_CATEGORY: TinyWinCategory = 'social-admin';

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
  return customDurationErrorMax(input, 60);
}

function sanitizeCustomMinutesInputMax(value: string, maxDigits: number): string {
  return value.replace(/\D/g, '').slice(0, maxDigits);
}

function parseCustomMinutesMax(input: string, max: number): number | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const minutes = parseInt(trimmed, 10);
  if (minutes < 1 || minutes > max) return null;
  return minutes;
}

function customDurationErrorMax(input: string, max: number): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter a number of minutes.';
  if (!/^\d+$/.test(trimmed)) return 'Use whole minutes only.';
  const minutes = parseInt(trimmed, 10);
  if (minutes < 1) return 'Minimum is 1 minute.';
  if (minutes > max) return `Maximum is ${max} minutes.`;
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

function RechargeMethodCard({
  icon,
  title,
  description,
  suggested,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  suggested?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={suggested ? `${title}, suggested` : title}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.methodCardPressable,
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <View
        style={[
          styles.methodCard,
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
        <Text style={styles.methodIcon}>{icon}</Text>
        <Text style={[styles.methodTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.methodDesc, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

function PauseTypeRow({
  option,
  selected,
  onSelect,
}: {
  option: RechargeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.boringTaxRow,
        {
          backgroundColor: selected ? theme.accentTertiary : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <View style={styles.boringTaxMain}>
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
      </View>
    </Pressable>
  );
}

function MessageChoiceCard({
  title,
  description,
  selected,
  onPress,
  wide,
}: {
  title: string;
  description: string;
  selected?: boolean;
  onPress: () => void;
  wide?: boolean;
}) {
  const theme = useAppTheme();
  const isSelected = Boolean(selected);
  const titleColor = isSelected ? theme.selectedForeground : theme.text;
  const descColor = isSelected ? theme.selectedForegroundMuted : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={title}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.methodCardPressable,
        wide ? styles.messageChoiceWide : null,
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <View
        style={[
          styles.messageChoiceCard,
          {
            backgroundColor: isSelected ? theme.accentTertiary : theme.surface,
            borderColor: isSelected ? theme.accent : theme.surfaceBorder,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}>
        <View style={styles.messageChoiceHeader}>
          <Text style={[styles.messageChoiceTitle, { color: titleColor, flex: 1 }]}>{title}</Text>
          {isSelected ? (
            <Text
              style={[styles.messageChoiceCheck, { color: theme.selectedForeground }]}
              accessibilityLabel="Selected">
              ✓
            </Text>
          ) : null}
        </View>
        <Text style={[styles.messageChoiceDesc, { color: descColor }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

function MessageOptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const labelColor = selected ? theme.selectedForeground : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.durationChip,
        {
          backgroundColor: selected ? theme.accentTertiary : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
          borderWidth: selected ? 2 : 1.5,
        },
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <Text style={[styles.durationChipText, { color: labelColor }]}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

function AttentionTaskList({ children }: { children: React.ReactNode }) {
  return <View style={styles.attentionTaskList}>{children}</View>;
}

function AttentionPriorityChips({
  value,
  onChange,
  compact,
}: {
  value: AttentionPriority;
  onChange: (priority: AttentionPriority) => void;
  compact?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.attentionPriorityRow}>
      {ATTENTION_PRIORITIES.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} priority`}
            style={({ pressed, focused }: PressableFocusState) => [
              compact ? styles.attentionPriorityChipSm : styles.attentionPriorityChip,
              {
                backgroundColor: selected ? theme.accentTertiary : theme.surface,
                borderColor: selected ? theme.accent : theme.surfaceBorder,
                borderWidth: selected ? 2 : 1,
              },
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text
              style={[
                compact ? styles.attentionPriorityChipSmText : styles.attentionPriorityChipText,
                { color: selected ? theme.selectedForeground : theme.textSecondary },
              ]}>
              {selected ? `✓ ${option.label}` : option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AttentionPriorityBadge({
  priority,
  onPress,
}: {
  priority: AttentionPriority;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const label = ATTENTION_PRIORITIES.find((option) => option.id === priority)?.label ?? priority;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${label} priority`}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.attentionPriorityBadge,
        {
          backgroundColor: theme.accentTertiary,
          borderColor: theme.accent,
        },
        pressed && onPress ? styles.pressed : null,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <Text style={[styles.attentionPriorityBadgeText, { color: theme.selectedForeground }]}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function AttentionTaskCard({
  task,
  active,
  editing,
  editTitle,
  editDeadline,
  onEditTitleChange,
  onEditDeadlineChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onPriorityChange,
  onMakeActive,
  onMarkDone,
  onRestore,
  onDelete,
}: {
  task: AttentionTask;
  active: boolean;
  editing: boolean;
  editTitle: string;
  editDeadline: string;
  onEditTitleChange: (value: string) => void;
  onEditDeadlineChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onPriorityChange: (priority: AttentionPriority) => void;
  onMakeActive: () => void;
  onMarkDone: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const [pickingPriority, setPickingPriority] = useState(false);
  const titleColor = active ? theme.selectedForeground : task.completed ? theme.textMuted : theme.text;
  const actionColor = active ? theme.selectedForeground : theme.accent;
  const showPriorityPicker = pickingPriority || editing;

  return (
    <View
      style={[
        styles.attentionTaskRow,
        {
          backgroundColor: active ? theme.accentTertiary : theme.surface,
          borderColor: active ? theme.accent : theme.surfaceBorder,
          borderWidth: active ? 2 : 1,
          opacity: task.completed ? 0.78 : 1,
        },
      ]}>
      <View style={styles.attentionTaskMain}>
        {active ? (
          <Text style={[styles.attentionActiveBadge, { color: theme.selectedForeground }]}>
            ★ STARTING HERE
          </Text>
        ) : null}
        {task.completed ? (
          <Text style={[styles.attentionDoneBadge, { color: theme.textMuted }]}>✓ DONE</Text>
        ) : null}

        {editing && !task.completed ? (
          <View style={styles.attentionTaskEdit}>
            <TextInput
              value={editTitle}
              onChangeText={onEditTitleChange}
              placeholder="Task name"
              placeholderTextColor={theme.textMuted}
              maxLength={ATTENTION_ITEM_CHAR_MAX}
              accessibilityLabel="Edit task name"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={onSaveEdit}
              style={[
                styles.taskInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.accent,
                },
              ]}
            />
            <TextInput
              value={editDeadline}
              onChangeText={onEditDeadlineChange}
              placeholder="Deadline (optional)"
              placeholderTextColor={theme.textMuted}
              maxLength={ATTENTION_DEADLINE_MAX}
              accessibilityLabel="Edit deadline"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={onSaveEdit}
              style={[
                styles.taskInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.surfaceBorder,
                },
              ]}
            />
            <View style={styles.attentionTaskEditActions}>
              <Pressable
                onPress={onSaveEdit}
                accessibilityRole="button"
                accessibilityLabel="Save task edits"
                style={({ pressed, focused }: PressableFocusState) => [
                  styles.editSaveBtn,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                  focused && Platform.OS === 'web' ? styles.focusRing : null,
                ]}>
                <Text style={[styles.editSaveText, { color: theme.text }]}>Save</Text>
              </Pressable>
              <Pressable
                onPress={onCancelEdit}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
                style={({ pressed, focused }: PressableFocusState) => [
                  styles.editCancelBtn,
                  pressed && styles.pressed,
                  focused && Platform.OS === 'web' ? styles.focusRing : null,
                ]}>
                <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={task.completed || active ? undefined : onMakeActive}
            accessibilityRole={task.completed || active ? 'none' : 'button'}
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              task.completed
                ? task.title
                : active
                  ? `${task.title}, starting here`
                  : `Start with this: ${task.title}`
            }
            disabled={task.completed || active}>
            <Text
              style={[
                styles.attentionTaskTitle,
                {
                  color: titleColor,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}>
              {task.completed ? `✓ ${task.title}` : task.title}
            </Text>
          </Pressable>
        )}

        {!task.completed ? (
          <View style={styles.attentionTaskMeta}>
            {showPriorityPicker ? (
              <AttentionPriorityChips
                value={task.priority}
                compact
                onChange={(priority) => {
                  onPriorityChange(priority);
                  setPickingPriority(false);
                }}
              />
            ) : (
              <AttentionPriorityBadge
                priority={task.priority}
                onPress={() => setPickingPriority(true)}
              />
            )}
            {task.deadline && !editing ? (
              <Text
                style={[
                  styles.attentionMetaText,
                  { color: active ? theme.selectedForegroundMuted : theme.textMuted },
                ]}>
                Deadline: {task.deadline}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.attentionMetaText, { color: theme.textMuted }]}>
            {ATTENTION_PRIORITIES.find((option) => option.id === task.priority)?.label}
            {task.deadline ? ` · Deadline: ${task.deadline}` : ''}
          </Text>
        )}

        {active && !editing ? (
          <Text style={[styles.attentionActiveSupport, { color: theme.selectedForegroundMuted }]}>
            Give this one your attention first. The others can wait for now.
          </Text>
        ) : null}
      </View>

      <View style={styles.attentionTaskActions}>
        {task.completed ? (
          <Pressable
            onPress={onRestore}
            accessibilityRole="button"
            accessibilityLabel={`Restore: ${task.title}`}
            style={({ pressed, focused }: PressableFocusState) => [
              styles.attentionKeepActive,
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.attentionKeepText, { color: theme.textMuted }]}>Restore</Text>
          </Pressable>
        ) : active ? (
          <Pressable
            onPress={onMarkDone}
            accessibilityRole="button"
            accessibilityLabel={`Done: ${task.title}`}
            style={({ pressed, focused }: PressableFocusState) => [
              styles.attentionMarkDone,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.attentionMarkDoneText, { color: theme.text }]}>✓ Done</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onMakeActive}
            accessibilityRole="button"
            accessibilityLabel={`Start with this: ${task.title}`}
            style={({ pressed, focused }: PressableFocusState) => [
              styles.attentionKeepActive,
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.attentionKeepText, { color: actionColor }]}>Start with this</Text>
          </Pressable>
        )}
        {!task.completed ? (
          <Pressable
            onPress={onStartEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit: ${task.title}`}
            hitSlop={8}
            style={({ pressed, focused }: PressableFocusState) => [
              styles.rowIconBtn,
              { backgroundColor: theme.accent + '18' },
              pressed && styles.rowIconBtnPressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.rowEditIcon, { color: theme.accent }]}>✎</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete: ${task.title}`}
          hitSlop={8}
          style={({ pressed, focused }: PressableFocusState) => [
            styles.rowIconBtn,
            { backgroundColor: theme.accent + '18' },
            pressed && styles.rowIconBtnPressed,
            focused && Platform.OS === 'web' ? styles.focusRing : null,
          ]}>
          <Text style={[styles.rowDeleteIcon, { color: theme.accent }]}>🗑</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AttentionComposer({
  title,
  onTitleChange,
  priority,
  onPriorityChange,
  deadline,
  onDeadlineChange,
  onSubmit,
  inputRef,
  titleFocused,
  deadlineFocused,
  onTitleFocus,
  onDeadlineFocus,
  onBlur,
  feedback,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  priority: AttentionPriority;
  onPriorityChange: (priority: AttentionPriority) => void;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<TextInput | null>;
  titleFocused: boolean;
  deadlineFocused: boolean;
  onTitleFocus: () => void;
  onDeadlineFocus: () => void;
  onBlur: () => void;
  feedback: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.attentionComposer}>
      <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Task</Text>
      <View style={styles.attentionComposerRow}>
        <TextInput
          ref={inputRef}
          value={title}
          onChangeText={onTitleChange}
          placeholder="e.g. Finish presentation"
          placeholderTextColor={theme.textMuted}
          maxLength={ATTENTION_ITEM_CHAR_MAX}
          accessibilityLabel="Task"
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onSubmit}
          onFocus={onTitleFocus}
          onBlur={onBlur}
          style={[
            styles.taskInput,
            styles.attentionComposerInput,
            {
              color: theme.text,
              backgroundColor: theme.surface,
              borderColor: titleFocused ? theme.accent : theme.surfaceBorder,
            },
            titleFocused && styles.taskInputFocused,
          ]}
          {...(Platform.OS === 'web'
            ? ({
                onKeyDown: (event: {
                  key: string;
                  shiftKey?: boolean;
                  preventDefault: () => void;
                }) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSubmit();
                  }
                },
              } as object)
            : null)}
        />
      </View>

      <Text style={[styles.taskFieldLabel, { color: theme.text, marginTop: spacing.xs }]}>
        Priority
      </Text>
      <AttentionPriorityChips value={priority} onChange={onPriorityChange} />

      <Text style={[styles.taskFieldLabel, { color: theme.text, marginTop: spacing.xs }]}>
        Deadline (optional)
      </Text>
      <TextInput
        value={deadline}
        onChangeText={onDeadlineChange}
        placeholder="e.g. today, Friday, Aug 28"
        placeholderTextColor={theme.textMuted}
        maxLength={ATTENTION_DEADLINE_MAX}
        accessibilityLabel="Deadline (optional)"
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={onSubmit}
        onFocus={onDeadlineFocus}
        onBlur={onBlur}
        style={[
          styles.taskInput,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: deadlineFocused ? theme.accent : theme.surfaceBorder,
          },
          deadlineFocused && styles.taskInputFocused,
        ]}
      />

      <View style={[styles.attentionComposerRow, { marginTop: spacing.xs }]}>
        <Pressable
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Add task"
          style={({ pressed, focused }: PressableFocusState) => [
            styles.attentionAddBtn,
            {
              backgroundColor: theme.accentTertiary,
              borderColor: theme.accent,
            },
            pressed && styles.pressed,
            focused && Platform.OS === 'web' ? styles.focusRing : null,
          ]}>
          <Text style={[styles.attentionAddBtnText, { color: theme.onLightAccent }]}>Add task</Text>
        </Pressable>
      </View>
      {feedback ? (
        <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>{feedback}</Text>
      ) : null}
    </View>
  );
}

function AttentionBrainDumpSave({
  parkedCount,
  needsSave,
  status,
  onSave,
}: {
  parkedCount: number;
  needsSave: boolean;
  status: 'idle' | 'saved' | 'already';
  onSave: () => void;
}) {
  const theme = useAppTheme();
  if (parkedCount === 0) return null;

  return (
    <View style={styles.attentionBrainDumpSave}>
      {needsSave || status === 'idle' ? (
        <>
          <Pressable
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="Save these for later"
            style={({ pressed, focused }: PressableFocusState) => [
              styles.attentionBrainDumpBtn,
              pressed && styles.pressed,
              focused && Platform.OS === 'web' ? styles.focusRing : null,
            ]}>
            <Text style={[styles.attentionBrainDumpBtnText, { color: theme.textMuted }]}>
              Save these for later
            </Text>
          </Pressable>
          <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
            Adds the parked tasks to Brain Dump so they won’t disappear when you leave.
          </Text>
        </>
      ) : (
        <Text style={[styles.attentionBrainDumpConfirm, { color: theme.textSecondary }]}>
          {status === 'already' ? 'Already saved in Brain Dump ✓' : '✓ Saved to Brain Dump'}
        </Text>
      )}
    </View>
  );
}

function QuietCheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const theme = useAppTheme();
  const labelColor = checked ? theme.selectedForeground : theme.text;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.boringTaxRow,
        {
          backgroundColor: checked ? theme.accentTertiary : theme.surface,
          borderColor: checked ? theme.accent : theme.surfaceBorder,
        },
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <View style={styles.boringTaxMain}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: checked ? theme.accent : theme.surfaceBorder,
              backgroundColor: checked ? theme.accent : 'transparent',
            },
          ]}>
          {checked ? (
            <Text style={{ color: theme.selectedForeground, fontWeight: '700' }}>✓</Text>
          ) : null}
        </View>
        <Text style={[styles.boringTaxLabel, { color: labelColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ThreadContextChip({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const labelColor = selected ? theme.selectedForeground : theme.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed, focused }: PressableFocusState) => [
        styles.threadContextChip,
        {
          backgroundColor: selected ? theme.accentTertiary : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
          borderWidth: selected ? 2 : 1,
        },
        pressed && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
      ]}>
      <Text style={styles.threadContextEmoji}>{emoji}</Text>
      <Text style={[styles.threadContextChipText, { color: labelColor }]}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

function RechargeBodyRow({
  item,
  isEditing,
  editingText,
  onEditingTextChange,
  onToggleComplete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  item: RechargeChecklistItem;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onToggleComplete: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
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
          placeholder="What my body needs"
          placeholderTextColor={theme.textMuted}
          autoFocus
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onSaveEdit}
          maxLength={TASK_TEXT_MAX}
          accessibilityLabel={`Edit: ${item.text || 'body care item'}`}
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
          accessibilityLabel="Save item"
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
          opacity: item.completed ? 0.78 : 1,
        },
      ]}>
      <Pressable
        onPress={onToggleComplete}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        accessibilityLabel={
          item.completed ? `Uncheck: ${item.text}` : `Complete: ${item.text}`
        }
        style={({ pressed, focused }: PressableFocusState) => [
          styles.checkRowMain,
          pressed && styles.pressed,
          focused && Platform.OS === 'web' ? styles.focusRing : null,
        ]}>
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

function RechargePermissionRow({
  item,
  isEditing,
  editingText,
  onEditingTextChange,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  item: RechargeChecklistItem;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
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
          placeholder="Permission text"
          placeholderTextColor={theme.textMuted}
          autoFocus
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onSaveEdit}
          maxLength={TASK_TEXT_MAX}
          accessibilityLabel={`Edit: ${item.text || 'permission'}`}
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
          accessibilityLabel="Save permission"
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
        styles.boringTaxRow,
        {
          backgroundColor: item.completed ? theme.accentTertiary : theme.surface,
          borderColor: item.completed ? theme.accent : theme.surfaceBorder,
        },
      ]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        accessibilityLabel={item.text}
        style={({ pressed, focused }: PressableFocusState) => [
          styles.boringTaxMain,
          pressed && styles.pressed,
          focused && Platform.OS === 'web' ? styles.focusRing : null,
        ]}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: item.completed ? theme.accent : theme.surfaceBorder,
              backgroundColor: item.completed ? theme.accent : 'transparent',
            },
          ]}>
          {item.completed ? (
            <Text style={{ color: theme.text, fontWeight: '700' }}>✓</Text>
          ) : null}
        </View>
        <Text style={[styles.boringTaxLabel, { color: theme.text }]}>{item.text}</Text>
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
  const addParkedThoughts = useAppStore((s) => s.addParkedThoughts);
  const latestComebackNote = useAppStore((s) => s.latestComebackNote);
  const setComebackNote = useAppStore((s) => s.setComebackNote);
  const clearComebackNote = useAppStore((s) => s.clearComebackNote);
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

  const [rechargeStage, setRechargeStage] = useState<RechargeStage>('menu');
  const [rechargeMethod, setRechargeMethod] = useState<RechargeMethod | null>(null);
  const [tiredFeeling, setTiredFeeling] = useState<TiredFeeling | null>(null);
  const [selectedPauseId, setSelectedPauseId] = useState<string | null>(null);
  const [customPauseText, setCustomPauseText] = useState('');
  const [pauseDuration, setPauseDuration] = useState(20);
  const [pauseHasTimer, setPauseHasTimer] = useState(true);
  const [pauseDurationCustom, setPauseDurationCustom] = useState(false);
  const [pauseCustomMinutes, setPauseCustomMinutes] = useState('');
  const [pauseRunKey, setPauseRunKey] = useState(0);
  const [bodyResetItems, setBodyResetItems] = useState<RechargeChecklistItem[]>(makeBodyResetItems);
  const [bodyEditingId, setBodyEditingId] = useState<string | null>(null);
  const [bodyEditingText, setBodyEditingText] = useState('');
  const [showCustomBodyItem, setShowCustomBodyItem] = useState(false);
  const [customBodyText, setCustomBodyText] = useState('');
  const [smallerDayItems, setSmallerDayItems] =
    useState<RechargeChecklistItem[]>(makeSmallerDayItems);
  const [smallerEditingId, setSmallerEditingId] = useState<string | null>(null);
  const [smallerEditingText, setSmallerEditingText] = useState('');
  const [showCustomPermission, setShowCustomPermission] = useState(false);
  const [customPermissionText, setCustomPermissionText] = useState('');
  const [lowEnergyTask, setLowEnergyTask] = useState('');
  const [lowEnergyEnough, setLowEnergyEnough] = useState('');
  const [lowEnergyDuration, setLowEnergyDuration] = useState(10);
  const [lowEnergyHasTimer, setLowEnergyHasTimer] = useState(true);
  const [lowEnergyDurationCustom, setLowEnergyDurationCustom] = useState(false);
  const [lowEnergyCustomMinutes, setLowEnergyCustomMinutes] = useState('');
  const [lowEnergyRunKey, setLowEnergyRunKey] = useState(0);
  const [rechargeRewarded, setRechargeRewarded] = useState(false);
  const [rechargeXpEarned, setRechargeXpEarned] = useState(0);
  const [rcInputFocused, setRcInputFocused] = useState(false);
  const rechargeRewardingRef = useRef(false);
  const rechargeStageRef = useRef<RechargeStage>('menu');

  const [messageStage, setMessageStage] = useState<MessageLoopStage>('menu');
  const [messageMethod, setMessageMethod] = useState<MessageLoopMethod | null>(null);
  const [messageContextDraft, setMessageContextDraft] = useState('');
  const [messageContext, setMessageContext] = useState('');
  const [messageContextConfirmed, setMessageContextConfirmed] = useState(false);
  const [quickClosePreset, setQuickClosePreset] = useState<string | null>(null);
  const [quickCloseCustomGoal, setQuickCloseCustomGoal] = useState('');
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [stopwatchRunKey, setStopwatchRunKey] = useState(0);
  const [replyIntent, setReplyIntent] = useState<ReplyIntent | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [lateOpener, setLateOpener] = useState<LateReplyOpener | null>(null);
  const [lateAction, setLateAction] = useState<LateReplyAction | null>(null);
  const [lateDraft, setLateDraft] = useState('');
  const [energyChoice, setEnergyChoice] = useState<EnergyProtectionChoice | null>(null);
  const [unsentDraft, setUnsentDraft] = useState('');
  const [usefulCoreDraft, setUsefulCoreDraft] = useState('');
  const [unsentDraftCrumpled, setUnsentDraftCrumpled] = useState(false);
  const [energyDraft, setEnergyDraft] = useState('');
  const [messageRewarded, setMessageRewarded] = useState(false);
  const [messageXpEarned, setMessageXpEarned] = useState(0);
  const [mlInputFocused, setMlInputFocused] = useState(false);
  const messageRewardingRef = useRef(false);
  const messageStageRef = useRef<MessageLoopStage>('menu');
  const cantStartScrollRef = useRef<ScrollView>(null);
  const threadSectionYRef = useRef(0);

  const [attentionStage, setAttentionStage] = useState<'reset' | 'complete'>('reset');
  const [attentionTasks, setAttentionTasks] = useState<AttentionTask[]>([]);
  const [attentionActiveId, setAttentionActiveId] = useState<string | null>(null);
  const [attentionTitle, setAttentionTitle] = useState('');
  const [attentionPriority, setAttentionPriority] = useState<AttentionPriority>('medium');
  const [attentionDeadline, setAttentionDeadline] = useState('');
  const [attentionFeedback, setAttentionFeedback] = useState('');
  const [attentionEditingId, setAttentionEditingId] = useState<string | null>(null);
  const [attentionEditTitle, setAttentionEditTitle] = useState('');
  const [attentionEditDeadline, setAttentionEditDeadline] = useState('');
  const [attentionJustFinished, setAttentionJustFinished] = useState(false);
  const [savedParkedKeys, setSavedParkedKeys] = useState<string[]>([]);
  const [brainDumpSaveStatus, setBrainDumpSaveStatus] = useState<'idle' | 'saved' | 'already'>('idle');
  const [brainDumpSaved, setBrainDumpSaved] = useState(false);
  const [showQuickReset, setShowQuickReset] = useState(false);
  const [quickResetChecked, setQuickResetChecked] = useState<boolean[]>(() =>
    QUICK_RESET_ITEMS.map(() => false),
  );
  const [attentionRewarded, setAttentionRewarded] = useState(false);
  const [attentionXpEarned, setAttentionXpEarned] = useState(0);
  const [arFocusedField, setArFocusedField] = useState<'title' | 'deadline' | null>(null);
  const attentionRewardingRef = useRef(false);
  const attentionInputRef = useRef<TextInput>(null);

  const [threadStage, setThreadStage] = useState<'find' | 'complete'>('find');
  const [threadContextKind, setThreadContextKind] = useState<ThreadContextKind | null>(null);
  const [threadContextText, setThreadContextText] = useState('');
  const [threadLastMemory, setThreadLastMemory] = useState('');
  const [threadIntent, setThreadIntent] = useState('');
  const [threadText, setThreadText] = useState('');
  const [futureNoteDraft, setFutureNoteDraft] = useState('');
  const [clueSaved, setClueSaved] = useState(false);
  const [futureNoteSkipped, setFutureNoteSkipped] = useState(false);
  const [threadRewarded, setThreadRewarded] = useState(false);
  const [threadXpEarned, setThreadXpEarned] = useState(0);
  const [trFocusedField, setTrFocusedField] = useState<string | null>(null);
  const threadRewardingRef = useRef(false);
  const threadInputRef = useRef<TextInput>(null);

  const isTooBigFlow = stuckType === 'too-big';
  const isNoBeginningFlow = stuckType === 'no-beginning';
  const isVersionZeroFlow = stuckType === 'scared-bad';
  const isBoredomFlow = stuckType === 'bored';
  const isRechargeFlow = stuckType === 'tired';
  const isMessageLoopFlow = stuckType === 'avoiding-message';
  const isAttentionResetFlow = stuckType === 'opened-everything';
  const isThreadRecoveryFlow = stuckType === 'forgot-what';
  const showContextStage = isTooBigFlow && tooBigStage === 'context';
  const showLegacyQuestStage =
    Boolean(stuckType) &&
    !isTooBigFlow &&
    !isNoBeginningFlow &&
    !isVersionZeroFlow &&
    !isBoredomFlow &&
    !isRechargeFlow &&
    !isMessageLoopFlow &&
    !isAttentionResetFlow &&
    !isThreadRecoveryFlow;
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
  const rechargeMethodColumns = viewportWidth >= 768 ? 2 : 1;
  const messageMethodColumns = viewportWidth >= 768 ? 2 : 1;
  const methodGap = viewportWidth >= 768 ? 16 : 12;
  const nbSectionGap = isDesktopLayout ? 32 : 22;
  const nbFieldGap = isDesktopLayout ? 26 : 20;
  const bdSectionGap = isDesktopLayout ? 32 : 22;
  const bdFieldGap = isDesktopLayout ? 26 : 20;
  const rcSectionGap = isDesktopLayout ? 32 : 22;
  const rcFieldGap = isDesktopLayout ? 26 : 20;
  const mlSectionGap = isDesktopLayout ? 32 : 22;
  const mlFieldGap = isDesktopLayout ? 26 : 20;
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
  rechargeStageRef.current = rechargeStage;
  messageStageRef.current = messageStage;

  const quickCloseGoal =
    quickClosePreset === QUICK_CLOSE_CUSTOM_PRESET
      ? quickCloseCustomGoal
      : quickClosePreset ?? '';
  const canStartQuickClose =
    quickClosePreset === QUICK_CLOSE_CUSTOM_PRESET
      ? quickCloseCustomGoal.trim().length > 0
      : Boolean(quickClosePreset);
  const messageCompletionCopy =
    messageMethod !== null ? MESSAGE_LOOP_COMPLETION_COPY[messageMethod] : null;
  const energyCtaLabel =
    energyChoice !== null ? ENERGY_PROTECTION_CTA[energyChoice] : 'I did it';
  const standardReplyIntents = REPLY_INTENTS.filter((intent) => intent.id !== 'custom');
  const customReplyIntent = REPLY_INTENTS.find((intent) => intent.id === 'custom');

  const attentionActiveTask =
    attentionActiveId !== null
      ? attentionTasks.find((task) => task.id === attentionActiveId && !task.completed) ?? null
      : null;
  const attentionOpenTasks = attentionTasks.filter((task) => !task.completed);
  const attentionParkedTasks = attentionOpenTasks.filter((task) => task.id !== attentionActiveId);
  const attentionCompletedTasks = attentionTasks.filter((task) => task.completed);
  const attentionHasActive = attentionActiveTask !== null;
  const parkedNeedsSave = attentionParkedTasks.some((task) => {
    const key = task.title.trim().toLowerCase();
    return key.length > 0 && !savedParkedKeys.includes(key);
  });
  const quickResetCount = quickResetChecked.filter(Boolean).length;
  const threadContextLabel =
    threadContextText.trim() || getThreadContextLabel(threadContextKind);
  const threadSuggestions = getThreadSuggestions(threadContextKind);
  const threadHasText = threadText.trim().length > 0;
  const comebackTimestamp = latestComebackNote
    ? formatComebackTimestamp(latestComebackNote.createdAt)
    : '';

  const suggestedRechargeMethod = getSuggestedRechargeMethod(tiredFeeling);
  const pauseLabel = getPauseOptionLabel(selectedPauseId, customPauseText);
  const canUseCustomPause =
    selectedPauseId !== 'custom' || customPauseText.trim().length > 0;
  const pauseCustomErrorText = pauseDurationCustom
    ? customDurationErrorMax(pauseCustomMinutes, 120)
    : null;
  const resolvedPauseMinutes = pauseDurationCustom
    ? parseCustomMinutesMax(pauseCustomMinutes, 120)
    : pauseDuration;
  const canStartPause =
    Boolean(selectedPauseId) &&
    canUseCustomPause &&
    (!pauseHasTimer ||
      (pauseDurationCustom
        ? resolvedPauseMinutes !== null
        : (PAUSE_DURATION_PRESETS as readonly number[]).includes(pauseDuration)));
  const bodyCompletedItems = bodyResetItems.filter((item) => item.completed);
  const bodyCompletedCount = bodyCompletedItems.length;
  const selectedSmallerLabels = smallerDayItems
    .filter((item) => item.completed)
    .map((item) => item.text);
  const smallerDaySummary = formatSmallerDaySummary(selectedSmallerLabels);
  const lowEnergyCustomErrorText = lowEnergyDurationCustom
    ? customDurationError(lowEnergyCustomMinutes)
    : null;
  const resolvedLowEnergyMinutes = lowEnergyDurationCustom
    ? parseCustomMinutes(lowEnergyCustomMinutes)
    : lowEnergyDuration;
  const canStartLowEnergy =
    lowEnergyTask.trim().length > 0 &&
    lowEnergyEnough.trim().length > 0 &&
    (!lowEnergyHasTimer ||
      (lowEnergyDurationCustom
        ? resolvedLowEnergyMinutes !== null
        : (LOW_ENERGY_DURATION_PRESETS as readonly number[]).includes(lowEnergyDuration)));
  const rechargeCompletionCopy =
    rechargeMethod !== null ? RECHARGE_COMPLETION_COPY[rechargeMethod] : null;

  const quests = useMemo(() => {
    if (
      !stuckType ||
      stuckType === 'too-big' ||
      stuckType === 'scared-bad' ||
      stuckType === 'bored' ||
      stuckType === 'tired' ||
      stuckType === 'avoiding-message' ||
      stuckType === 'opened-everything' ||
      stuckType === 'forgot-what'
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

  const resetRechargeState = () => {
    setRechargeStage('menu');
    setRechargeMethod(null);
    setTiredFeeling(null);
    setSelectedPauseId(null);
    setCustomPauseText('');
    setPauseDuration(20);
    setPauseHasTimer(true);
    setPauseDurationCustom(false);
    setPauseCustomMinutes('');
    setPauseRunKey(0);
    setBodyResetItems(makeBodyResetItems());
    setBodyEditingId(null);
    setBodyEditingText('');
    setShowCustomBodyItem(false);
    setCustomBodyText('');
    setSmallerDayItems(makeSmallerDayItems());
    setSmallerEditingId(null);
    setSmallerEditingText('');
    setShowCustomPermission(false);
    setCustomPermissionText('');
    setLowEnergyTask('');
    setLowEnergyEnough('');
    setLowEnergyDuration(10);
    setLowEnergyHasTimer(true);
    setLowEnergyDurationCustom(false);
    setLowEnergyCustomMinutes('');
    setLowEnergyRunKey(0);
    setRechargeRewarded(false);
    setRechargeXpEarned(0);
    setRcInputFocused(false);
    rechargeRewardingRef.current = false;
  };

  const resetMessageLoopState = () => {
    setMessageStage('menu');
    setMessageMethod(null);
    setMessageContextDraft('');
    setMessageContext('');
    setMessageContextConfirmed(false);
    setQuickClosePreset(null);
    setQuickCloseCustomGoal('');
    setStopwatchElapsed(0);
    setStopwatchRunKey((key) => key + 1);
    setReplyIntent(null);
    setReplyDraft('');
    setLateOpener(null);
    setLateAction(null);
    setLateDraft('');
    setEnergyChoice(null);
    setUnsentDraft('');
    setUsefulCoreDraft('');
    setUnsentDraftCrumpled(false);
    setEnergyDraft('');
    setMessageRewarded(false);
    setMessageXpEarned(0);
    setMlInputFocused(false);
    messageRewardingRef.current = false;
  };

  const resetAttentionResetState = () => {
    setAttentionStage('reset');
    setAttentionTasks([]);
    setAttentionActiveId(null);
    setAttentionTitle('');
    setAttentionPriority('medium');
    setAttentionDeadline('');
    setAttentionFeedback('');
    setAttentionEditingId(null);
    setAttentionEditTitle('');
    setAttentionEditDeadline('');
    setAttentionJustFinished(false);
    setSavedParkedKeys([]);
    setBrainDumpSaveStatus('idle');
    setBrainDumpSaved(false);
    setShowQuickReset(false);
    setQuickResetChecked(QUICK_RESET_ITEMS.map(() => false));
    setAttentionRewarded(false);
    setAttentionXpEarned(0);
    setArFocusedField(null);
    attentionRewardingRef.current = false;
  };

  const resetThreadRecoveryState = () => {
    setThreadStage('find');
    setThreadContextKind(null);
    setThreadContextText('');
    setThreadLastMemory('');
    setThreadIntent('');
    setThreadText('');
    setFutureNoteDraft('');
    setClueSaved(false);
    setFutureNoteSkipped(false);
    setThreadRewarded(false);
    setThreadXpEarned(0);
    setTrFocusedField(null);
    threadRewardingRef.current = false;
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
        if (rechargeStageRef.current === 'pause-running') {
          setRechargeStage('pause-setup');
          setPauseRunKey((key) => key + 1);
        }
        if (rechargeStageRef.current === 'low-energy-running') {
          setRechargeStage('low-energy-setup');
          setLowEnergyRunKey((key) => key + 1);
        }
        if (messageStageRef.current === 'quick-running') {
          setMessageStage('quick-setup');
          setStopwatchRunKey((key) => key + 1);
        }
      };
    }, []),
  );

  const returnToRechargeMenu = () => {
    setRechargeStage('menu');
    setRechargeMethod(null);
  };

  const tryAnotherRechargeTool = () => {
    setRechargeRewarded(false);
    setRechargeXpEarned(0);
    rechargeRewardingRef.current = false;
    setRechargeMethod(null);
    setSelectedPauseId(null);
    setCustomPauseText('');
    setPauseDuration(20);
    setPauseHasTimer(true);
    setPauseDurationCustom(false);
    setPauseCustomMinutes('');
    setPauseRunKey(0);
    setBodyResetItems(makeBodyResetItems());
    setBodyEditingId(null);
    setBodyEditingText('');
    setShowCustomBodyItem(false);
    setCustomBodyText('');
    setSmallerDayItems(makeSmallerDayItems());
    setSmallerEditingId(null);
    setSmallerEditingText('');
    setShowCustomPermission(false);
    setCustomPermissionText('');
    setLowEnergyTask('');
    setLowEnergyEnough('');
    setLowEnergyDuration(10);
    setLowEnergyHasTimer(true);
    setLowEnergyDurationCustom(false);
    setLowEnergyCustomMinutes('');
    setLowEnergyRunKey(0);
    setRechargeStage('menu');
  };

  const selectRechargeMethod = (method: RechargeMethod) => {
    setRechargeMethod(method);
    if (method === 'real-pause') {
      setRechargeStage('pause-setup');
      return;
    }
    if (method === 'body-first') {
      setRechargeStage('body-reset');
      return;
    }
    if (method === 'make-today-smaller') {
      setRechargeStage('smaller-day');
      return;
    }
    setRechargeStage('low-energy-setup');
  };

  const awardRechargeWin = (title: string, category: TinyWinCategory) => {
    if (rechargeRewarded || rechargeRewardingRef.current) return;
    rechargeRewardingRef.current = true;
    addTinyWin(title.slice(0, 80), category, false);
    markAchievementEvent('cant-start-quest');
    setRechargeRewarded(true);
    setRechargeXpEarned(RECHARGE_XP);
    setRechargeStage('complete');
  };

  const completePauseWin = () => {
    const title = buildRechargeWinTitle({
      method: 'real-pause',
      pauseLabel,
    });
    awardRechargeWin(title, 'self-care');
  };

  const completeBodyResetWin = () => {
    if (bodyCompletedCount === 0) return;
    const title = buildRechargeWinTitle({
      method: 'body-first',
      completedBodyItems: bodyCompletedItems.map((item) => item.text),
    });
    awardRechargeWin(title, 'body-reset');
  };

  const completeSmallerDayWin = () => {
    if (selectedSmallerLabels.length === 0) return;
    const title = buildRechargeWinTitle({
      method: 'make-today-smaller',
      smallerDayLabel: selectedSmallerLabels[0],
    });
    awardRechargeWin(title, 'self-care');
  };

  const completeLowEnergyWin = () => {
    const enough = lowEnergyEnough.trim();
    if (!enough) return;
    const title = buildRechargeWinTitle({
      method: 'low-energy',
      enoughText: enough,
    });
    const category = inferTinyWinCategory(lowEnergyTask, 'self-care');
    awardRechargeWin(title, category);
  };

  const startPause = () => {
    if (!canStartPause) return;
    if (pauseHasTimer) {
      if (pauseDurationCustom && resolvedPauseMinutes !== null) {
        setPauseDuration(resolvedPauseMinutes);
      }
      setPauseRunKey((key) => key + 1);
      setRechargeStage('pause-running');
      return;
    }
    setRechargeStage('pause-running');
  };

  const startLowEnergy = () => {
    if (!canStartLowEnergy) return;
    if (lowEnergyHasTimer) {
      if (lowEnergyDurationCustom && resolvedLowEnergyMinutes !== null) {
        setLowEnergyDuration(resolvedLowEnergyMinutes);
      }
      setLowEnergyRunKey((key) => key + 1);
      setRechargeStage('low-energy-running');
      return;
    }
    setRechargeStage('low-energy-running');
  };

  const restartLowEnergyRound = () => {
    if (lowEnergyHasTimer) {
      setLowEnergyRunKey((key) => key + 1);
      setRechargeStage('low-energy-running');
      return;
    }
    setRechargeStage('low-energy-running');
  };

  const openLowEnergyFromPause = () => {
    setRechargeMethod('low-energy');
    setRechargeStage('low-energy-setup');
  };

  const backFromRechargeComplete = () => {
    if (rechargeMethod === 'real-pause') {
      setRechargeStage('pause-result');
      return;
    }
    if (rechargeMethod === 'body-first') {
      setRechargeStage('body-reset');
      return;
    }
    if (rechargeMethod === 'make-today-smaller') {
      setRechargeStage('smaller-day');
      return;
    }
    setRechargeStage('low-energy-result');
  };

  const returnToMessageMenu = () => {
    setMessageStage('menu');
    setMessageMethod(null);
  };

  const tryAnotherMessageTool = () => {
    setMessageRewarded(false);
    setMessageXpEarned(0);
    messageRewardingRef.current = false;
    setMessageMethod(null);
    setQuickClosePreset(null);
    setQuickCloseCustomGoal('');
    setStopwatchElapsed(0);
    setStopwatchRunKey((key) => key + 1);
    setReplyIntent(null);
    setReplyDraft('');
    setLateOpener(null);
    setLateAction(null);
    setLateDraft('');
    setEnergyChoice(null);
    setUnsentDraft('');
    setUsefulCoreDraft('');
    setUnsentDraftCrumpled(false);
    setEnergyDraft('');
    setMessageStage('menu');
  };

  const closeAnotherMessage = () => {
    setMessageRewarded(false);
    setMessageXpEarned(0);
    messageRewardingRef.current = false;
    setMessageMethod('close-quickly');
    setQuickClosePreset(null);
    setQuickCloseCustomGoal('');
    setStopwatchElapsed(0);
    setStopwatchRunKey((key) => key + 1);
    setMessageStage('quick-setup');
  };

  const saveMessageContext = () => {
    const trimmed = messageContextDraft.trim().replace(/\s+/g, ' ').slice(0, MESSAGE_CONTEXT_MAX);
    setMessageContextDraft(trimmed);
    setMessageContext(trimmed);
    setMessageContextConfirmed(Boolean(trimmed));
  };

  const editMessageContext = () => {
    setMessageContextDraft(messageContext);
    setMessageContextConfirmed(false);
  };

  const selectQuickClosePreset = (preset: string) => {
    setQuickClosePreset(preset);
    if (preset !== QUICK_CLOSE_CUSTOM_PRESET) {
      setQuickCloseCustomGoal('');
    }
  };

  const selectMessageMethod = (method: MessageLoopMethod) => {
    setMessageMethod(method);
    if (method === 'close-quickly') {
      setMessageStage('quick-setup');
      return;
    }
    if (method === 'build-reply') {
      setMessageStage('reply-builder');
      return;
    }
    if (method === 'late-reply') {
      setMessageStage('late-reply');
      return;
    }
    setMessageStage('protect-energy');
  };

  const awardMessageWin = (title: string) => {
    if (messageRewarded || messageRewardingRef.current) return;
    messageRewardingRef.current = true;
    addTinyWin(title.slice(0, 80), MESSAGE_LOOP_WIN_CATEGORY, false);
    markAchievementEvent('cant-start-quest');
    setMessageRewarded(true);
    setMessageXpEarned(MESSAGE_LOOP_XP);
    setMessageStage('complete');
  };

  const startQuickCloseStopwatch = () => {
    if (!canStartQuickClose) return;
    setStopwatchElapsed(0);
    setStopwatchRunKey((key) => key + 1);
    setMessageStage('quick-running');
  };

  const finishQuickCloseStopwatch = (elapsedSeconds: number) => {
    setStopwatchElapsed(elapsedSeconds);
    setMessageStage('quick-result');
  };

  const cancelQuickCloseStopwatch = () => {
    setStopwatchRunKey((key) => key + 1);
    setMessageStage('quick-setup');
  };

  const completeQuickCloseWin = () => {
    const title = buildMessageWinTitle({
      method: 'close-quickly',
      elapsedSeconds: stopwatchElapsed,
      context: messageContext,
    });
    awardMessageWin(title);
  };

  const selectReplyIntent = (intent: ReplyIntent) => {
    setReplyIntent(intent);
    setReplyDraft(buildReplyDraft({ intent, context: messageContext }));
  };

  const completeReplyBuilderWin = () => {
    if (!replyDraft.trim()) return;
    const title = buildMessageWinTitle({
      method: 'build-reply',
      context: messageContext,
    });
    awardMessageWin(title);
  };

  const selectLateOpener = (opener: LateReplyOpener) => {
    setLateOpener(opener);
    if (lateAction) {
      setLateDraft(
        buildLateReplyDraft({
          opener,
          action: lateAction,
          context: messageContext,
        }),
      );
    }
  };

  const selectLateAction = (action: LateReplyAction) => {
    setLateAction(action);
    if (lateOpener) {
      setLateDraft(
        buildLateReplyDraft({
          opener: lateOpener,
          action,
          context: messageContext,
        }),
      );
    }
  };

  const completeLateReplyWin = () => {
    if (!lateDraft.trim()) return;
    const title = buildMessageWinTitle({
      method: 'late-reply',
      context: messageContext,
    });
    awardMessageWin(title);
  };

  const selectEnergyChoice = (choice: EnergyProtectionChoice) => {
    setEnergyChoice(choice);
    if (choice === 'unsent-draft') {
      setUnsentDraftCrumpled(false);
      setUnsentDraft('');
      setUsefulCoreDraft('');
      setEnergyDraft('');
      return;
    }
    if (choice === 'no-reply-needed' || choice === 'ask-someone-to-check') {
      setEnergyDraft('');
      return;
    }
    setEnergyDraft(buildBoundaryDraft(choice));
  };

  const crumpleUnsentDraft = () => {
    setUnsentDraft('');
    setUnsentDraftCrumpled(true);
  };

  const completeEnergyWin = () => {
    if (!energyChoice) return;

    if (energyChoice === 'unsent-draft') {
      if (!unsentDraftCrumpled || !usefulCoreDraft.trim()) return;
    } else if (energyChoice === 'no-reply-needed') {
      // Decision card only — no draft required.
    } else if (energyChoice === 'ask-someone-to-check') {
      if (!energyDraft.trim()) return;
    } else if (!energyDraft.trim()) {
      return;
    }

    const title = buildMessageWinTitle({
      method: 'protect-energy',
      energyChoice,
      context: messageContext,
    });
    awardMessageWin(title);
  };

  const backFromMessageComplete = () => {
    if (messageMethod === 'close-quickly') {
      setMessageStage('quick-result');
      return;
    }
    if (messageMethod === 'build-reply') {
      setMessageStage('reply-builder');
      return;
    }
    if (messageMethod === 'late-reply') {
      setMessageStage('late-reply');
      return;
    }
    setMessageStage('protect-energy');
  };

  const toggleBodyResetItem = (id: string) => {
    setBodyResetItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const submitCustomBodyItem = () => {
    const trimmed = customBodyText.trim();
    if (!trimmed) return;
    setBodyResetItems((prev) => [
      ...prev,
      {
        id: `body-custom-${Date.now()}`,
        text: trimmed.slice(0, TASK_TEXT_MAX),
        completed: false,
        isCustom: true,
      },
    ]);
    setCustomBodyText('');
    setShowCustomBodyItem(false);
  };

  const saveBodyEdit = () => {
    if (!bodyEditingId) return;
    const trimmed = bodyEditingText.trim();
    if (!trimmed) return;
    setBodyResetItems((prev) =>
      prev.map((item) =>
        item.id === bodyEditingId
          ? { ...item, text: trimmed.slice(0, TASK_TEXT_MAX) }
          : item,
      ),
    );
    setBodyEditingId(null);
    setBodyEditingText('');
  };

  const deleteBodyItem = (id: string) => {
    setBodyResetItems((prev) => prev.filter((item) => item.id !== id));
    if (bodyEditingId === id) {
      setBodyEditingId(null);
      setBodyEditingText('');
    }
  };

  const clearCompletedBodyItems = () => {
    setBodyResetItems((prev) => prev.map((item) => ({ ...item, completed: false })));
  };

  const toggleSmallerDayItem = (id: string) => {
    setSmallerDayItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const submitCustomPermission = () => {
    const trimmed = customPermissionText.trim();
    if (!trimmed) return;
    setSmallerDayItems((prev) => [
      ...prev,
      {
        id: `permission-custom-${Date.now()}`,
        text: trimmed.slice(0, TASK_TEXT_MAX),
        completed: true,
        isCustom: true,
      },
    ]);
    setCustomPermissionText('');
    setShowCustomPermission(false);
  };

  const saveSmallerEdit = () => {
    if (!smallerEditingId) return;
    const trimmed = smallerEditingText.trim();
    if (!trimmed) return;
    setSmallerDayItems((prev) =>
      prev.map((item) =>
        item.id === smallerEditingId
          ? { ...item, text: trimmed.slice(0, TASK_TEXT_MAX) }
          : item,
      ),
    );
    setSmallerEditingId(null);
    setSmallerEditingText('');
  };

  const deleteSmallerItem = (id: string) => {
    setSmallerDayItems((prev) => prev.filter((item) => item.id !== id));
    if (smallerEditingId === id) {
      setSmallerEditingId(null);
      setSmallerEditingText('');
    }
  };

  const clearSmallerChoices = () => {
    setSmallerDayItems((prev) => prev.map((item) => ({ ...item, completed: false })));
  };

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
    resetAttentionResetState();
    resetThreadRecoveryState();
    if (type === 'too-big') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
      resetRechargeState();
      resetMessageLoopState();
    } else if (type === 'no-beginning') {
      resetTooBigLocalState();
      resetVersionZeroState();
      resetNoBeginningState();
      resetBoredomState();
      resetRechargeState();
      resetMessageLoopState();
    } else if (type === 'scared-bad') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
      resetRechargeState();
      resetMessageLoopState();
    } else if (type === 'bored') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
      resetRechargeState();
      resetMessageLoopState();
    } else if (type === 'tired') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
      resetRechargeState();
      resetMessageLoopState();
    } else if (type === 'avoiding-message') {
      resetTooBigLocalState();
      resetNoBeginningState();
      resetVersionZeroState();
      resetBoredomState();
      resetRechargeState();
      resetMessageLoopState();
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
      resetRechargeState();
      resetMessageLoopState();
    }
  };

  const returnToStuckTypes = () => {
    setStuckType(null);
    resetTooBigLocalState();
    resetNoBeginningState();
    resetVersionZeroState();
    resetBoredomState();
    resetRechargeState();
    resetMessageLoopState();
    resetAttentionResetState();
    resetThreadRecoveryState();
  };

  const refocusAttentionInput = () => {
    requestAnimationFrame(() => {
      attentionInputRef.current?.focus();
    });
  };

  const addAttentionTask = () => {
    const result = canAddAttentionTask(attentionTasks, attentionTitle);
    if (result === 'empty') return;
    if (result === 'duplicate') {
      setAttentionFeedback('That task is already on the list.');
      return;
    }
    if (result === 'max') {
      setAttentionFeedback('Let’s work with the first 12 for now.');
      return;
    }

    const task = makeAttentionTask(attentionTitle, attentionPriority, attentionDeadline);
    setAttentionTasks((prev) => [...prev, task]);
    setAttentionTitle('');
    setAttentionPriority('medium');
    setAttentionDeadline('');
    setAttentionFeedback('');
    setShowQuickReset(false);
    refocusAttentionInput();
  };

  const updateAttentionTask = (id: string, updates: Partial<AttentionTask>) => {
    setAttentionTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    );
  };

  const selectAttentionTask = (id: string) => {
    const task = attentionTasks.find((item) => item.id === id);
    if (!task || task.completed) return;
    setAttentionActiveId(id);
    setAttentionJustFinished(false);
  };

  const deleteAttentionTask = (id: string) => {
    setAttentionTasks((prev) => prev.filter((task) => task.id !== id));
    if (attentionActiveId === id) setAttentionActiveId(null);
    if (attentionEditingId === id) {
      setAttentionEditingId(null);
      setAttentionEditTitle('');
      setAttentionEditDeadline('');
    }
  };

  const startAttentionEdit = (task: AttentionTask) => {
    setAttentionEditingId(task.id);
    setAttentionEditTitle(task.title);
    setAttentionEditDeadline(task.deadline);
  };

  const saveAttentionEdit = () => {
    if (!attentionEditingId) return;
    const trimmed = attentionEditTitle.trim();
    if (!trimmed) {
      setAttentionFeedback('A task needs a name.');
      return;
    }
    const duplicate = attentionTasks.some(
      (task) =>
        task.id !== attentionEditingId &&
        task.title.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setAttentionFeedback('That task is already on the list.');
      return;
    }
    updateAttentionTask(attentionEditingId, {
      title: trimmed.slice(0, ATTENTION_ITEM_CHAR_MAX),
      deadline: attentionEditDeadline.trim().slice(0, ATTENTION_DEADLINE_MAX),
    });
    setAttentionEditingId(null);
    setAttentionEditTitle('');
    setAttentionEditDeadline('');
    setAttentionFeedback('');
  };

  const cancelAttentionEdit = () => {
    setAttentionEditingId(null);
    setAttentionEditTitle('');
    setAttentionEditDeadline('');
  };

  const markAttentionTaskDone = (id: string) => {
    updateAttentionTask(id, { completed: true });
    if (attentionActiveId === id) setAttentionActiveId(null);
    setAttentionJustFinished(true);
  };

  const restoreAttentionTask = (id: string) => {
    updateAttentionTask(id, { completed: false });
  };

  const toggleQuickResetItem = (index: number) => {
    setQuickResetChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };

  const awardAttentionWin = (title: string) => {
    if (attentionRewarded || attentionRewardingRef.current) return;
    attentionRewardingRef.current = true;

    addTinyWin(title.slice(0, 80), 'work-study', false);
    markAchievementEvent('cant-start-quest');
    setAttentionRewarded(true);
    setAttentionXpEarned(ATTENTION_RESET_XP);
    setAttentionStage('complete');
  };

  const saveParkedToBrainDumpNow = () => {
    const titles = attentionParkedTasks.map((task) => task.title);
    const savedCount = addParkedThoughts(titles);
    setSavedParkedKeys((prev) => {
      const next = new Set(prev);
      for (const title of titles) {
        const key = title.trim().toLowerCase();
        if (key) next.add(key);
      }
      return [...next];
    });
    if (savedCount > 0) {
      setBrainDumpSaved(true);
      setBrainDumpSaveStatus('saved');
    } else {
      setBrainDumpSaveStatus('already');
    }
  };

  const renderAttentionTaskCard = (task: AttentionTask, active: boolean) => (
    <AttentionTaskCard
      key={task.id}
      task={task}
      active={active}
      editing={attentionEditingId === task.id}
      editTitle={attentionEditTitle}
      editDeadline={attentionEditDeadline}
      onEditTitleChange={(value) => setAttentionEditTitle(value.slice(0, ATTENTION_ITEM_CHAR_MAX))}
      onEditDeadlineChange={(value) =>
        setAttentionEditDeadline(value.slice(0, ATTENTION_DEADLINE_MAX))
      }
      onStartEdit={() => startAttentionEdit(task)}
      onSaveEdit={saveAttentionEdit}
      onCancelEdit={cancelAttentionEdit}
      onPriorityChange={(priority) => updateAttentionTask(task.id, { priority })}
      onMakeActive={() => selectAttentionTask(task.id)}
      onMarkDone={() => markAttentionTaskDone(task.id)}
      onRestore={() => restoreAttentionTask(task.id)}
      onDelete={() => deleteAttentionTask(task.id)}
    />
  );

  const completeAttentionSession = () => {
    const title = attentionActiveTask?.title ?? attentionCompletedTasks[0]?.title ?? '';
    awardAttentionWin(buildAttentionWinTitle(title));
  };

  const completeAttentionFromQuickReset = () => {
    if (quickResetCount === 0) return;
    awardAttentionWin(buildAttentionWinTitle(''));
  };

  const continueAttentionComplete = () => {
    if (attentionRewarded) setAttentionStage('complete');
  };

  const keepOrganizingAttention = () => {
    setAttentionStage('reset');
  };

  const awardThreadWin = () => {
    const nextStep = threadText.trim();
    if (!nextStep) return;
    if (threadRewarded || threadRewardingRef.current) return;
    threadRewardingRef.current = true;
    addTinyWin(buildThreadWinTitle(threadContextLabel), 'work-study', false);
    markAchievementEvent('cant-start-quest');
    setThreadRewarded(true);
    setThreadXpEarned(THREAD_XP);
    setFutureNoteDraft((current) => current.trim() || buildFutureNoteDraft(nextStep));
    setThreadStage('complete');
  };

  const continueThreadComplete = () => {
    if (threadRewarded) setThreadStage('complete');
  };

  const useComebackClue = () => {
    if (!latestComebackNote) return;
    setThreadText(latestComebackNote.text.slice(0, THREAD_TEXT_MAX));
    setTrFocusedField('thread');
    requestAnimationFrame(() => {
      threadInputRef.current?.focus();
      cantStartScrollRef.current?.scrollTo({
        y: Math.max(0, threadSectionYRef.current - 12),
        animated: true,
      });
    });
  };

  const saveFutureYouClue = () => {
    const text = futureNoteDraft.trim();
    if (!text) return;
    setComebackNote({
      text: text.slice(0, THREAD_NOTE_MAX),
      context: threadContextLabel || undefined,
      createdAt: new Date().toISOString(),
    });
    setClueSaved(true);
    setFutureNoteSkipped(false);
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
          ref={cantStartScrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
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

          {isRechargeFlow && rechargeStage === 'menu' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeMenuInner]}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>I&apos;M TIRED</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You may need recovery, not another productivity trick.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: rcSectionGap },
                  ]}>
                  Tired does not mean lazy. Let&apos;s protect the energy you have left before asking
                  your brain for more.
                </Text>

                <GlassCard
                  style={[
                    styles.rechargeIntroCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: rcSectionGap,
                    },
                  ]}>
                  <View style={styles.rechargeIntroTextGroup}>
                    <Text style={[styles.rechargeIntroTitle, { color: theme.text }]}>
                      Rest is part of the process.
                    </Text>
                    <Text style={[styles.rechargeIntroSupport, { color: theme.text }]}>
                      You do not have to earn it first.
                    </Text>
                  </View>
                </GlassCard>

                <View style={[styles.taskFieldBlock, { marginBottom: rcSectionGap, marginTop: 0 }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    Not sure what might help?
                  </Text>
                  <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                    Pick what feels closest, or skip this and choose any tool.
                  </Text>
                  <View style={styles.exampleRow}>
                    {TIRED_FEELING_OPTIONS.map((option) => {
                      const selected = tiredFeeling === option.id;
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() =>
                            setTiredFeeling((current) =>
                              current === option.id ? null : option.id,
                            )
                          }
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          accessibilityLabel={option.label}
                          style={({ pressed, focused }: PressableFocusState) => [
                            styles.durationChip,
                            {
                              backgroundColor: selected ? theme.accentTertiary : theme.surface,
                              borderColor: selected ? theme.accent : theme.surfaceBorder,
                            },
                            pressed && styles.pressed,
                            focused && Platform.OS === 'web' ? styles.focusRing : null,
                          ]}>
                          <Text
                            style={[
                              styles.durationChipText,
                              { color: selected ? theme.text : theme.textSecondary },
                            ]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <ActivationMethodsGrid columns={rechargeMethodColumns} gap={methodGap}>
                  {RECHARGE_METHODS.map((method) => (
                    <RechargeMethodCard
                      key={method.id}
                      icon={method.icon}
                      title={method.title}
                      description={method.description}
                      suggested={suggestedRechargeMethod === method.id}
                      onPress={() => selectRechargeMethod(method.id)}
                    />
                  ))}
                </ActivationMethodsGrid>

                <Text style={[styles.vzSafetyCopy, { color: theme.textMuted }]}>
                  This tool supports reflection and basic self-care. It does not diagnose the cause
                  of fatigue.
                </Text>
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'pause-setup' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeActiveInner]}>
                <InternalBack label="Back to recharge tools" onPress={returnToRechargeMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>REAL PAUSE</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Your brain is allowed to stop receiving input.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  A real pause does not have to be productive. Choose the kind of rest that feels
                  possible right now.
                </Text>
                <Text
                  style={[
                    styles.cueSupportText,
                    {
                      color: theme.textMuted,
                      textAlign: 'left',
                      alignSelf: 'stretch',
                      marginBottom: rcFieldGap,
                    },
                  ]}>
                  Doing nothing for a while is also an option.
                </Text>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  What kind of pause feels possible?
                </Text>
                <View style={[styles.blockerList, { marginBottom: rcFieldGap }]}>
                  {PAUSE_OPTIONS.map((option) => (
                    <PauseTypeRow
                      key={option.id}
                      option={option}
                      selected={selectedPauseId === option.id}
                      onSelect={() => setSelectedPauseId(option.id)}
                    />
                  ))}
                </View>

                {selectedPauseId === 'custom' ? (
                  <View style={[styles.taskFieldBlock, { marginBottom: rcFieldGap, marginTop: 0 }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                      Your kind of pause
                    </Text>
                    <TextInput
                      value={customPauseText}
                      onChangeText={(v) => setCustomPauseText(v.slice(0, TASK_TEXT_MAX))}
                      placeholder="e.g. rest with a warm drink"
                      placeholderTextColor={theme.textMuted}
                      maxLength={TASK_TEXT_MAX}
                      accessibilityLabel="Custom pause"
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
                  </View>
                ) : null}

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  Would a time boundary help?
                </Text>
                <View style={styles.durationRow}>
                  {PAUSE_DURATION_PRESETS.map((mins) => (
                    <DurationChip
                      key={mins}
                      label={`${mins} min`}
                      selected={pauseHasTimer && !pauseDurationCustom && pauseDuration === mins}
                      onPress={() => {
                        setPauseHasTimer(true);
                        setPauseDurationCustom(false);
                        setPauseDuration(mins);
                      }}
                    />
                  ))}
                  <DurationChip
                    label="Custom"
                    selected={pauseHasTimer && pauseDurationCustom}
                    onPress={() => {
                      setPauseHasTimer(true);
                      setPauseDurationCustom(true);
                    }}
                  />
                  <DurationChip
                    label="No timer"
                    selected={!pauseHasTimer}
                    onPress={() => {
                      setPauseHasTimer(false);
                      setPauseDurationCustom(false);
                    }}
                  />
                </View>

                {pauseHasTimer && pauseDurationCustom ? (
                  <View style={[styles.taskFieldBlock, { marginBottom: rcFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Custom minutes</Text>
                    <TextInput
                      value={pauseCustomMinutes}
                      onChangeText={(v) =>
                        setPauseCustomMinutes(sanitizeCustomMinutesInputMax(v, 3))
                      }
                      placeholder="e.g. 45"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                      accessibilityLabel="Custom pause minutes"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (canStartPause) startPause();
                      }}
                      style={[
                        styles.taskInput,
                        styles.customDurationInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: pauseCustomErrorText ? theme.accent : theme.surfaceBorder,
                        },
                      ]}
                    />
                    {pauseCustomErrorText ? (
                      <Text style={[styles.validationText, { color: theme.accent }]}>
                        {pauseCustomErrorText}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.actionStack}>
                  <View style={[styles.compactBtn, !canStartPause && styles.continueDisabled]}>
                    <GradientButton
                      label={pauseHasTimer ? 'Start my pause' : 'Begin my untimed pause'}
                      onPress={startPause}
                      small
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'pause-running' ? (
            <View style={styles.stageShell}>
              <View
                style={[
                  styles.stageInner,
                  pauseHasTimer ? styles.timerRunningInner : styles.rechargeActiveInner,
                ]}>
                <InternalBack
                  label="Back to pause setup"
                  onPress={() => {
                    setPauseRunKey((key) => key + 1);
                    setRechargeStage('pause-setup');
                  }}
                />
                {pauseHasTimer ? (
                  <GentleTimer
                    key={`recharge-pause-${pauseRunKey}-${pauseDuration}`}
                    durationMinutes={pauseDuration}
                    title={`Pause: ${pauseLabel || 'rest'}`}
                    compact
                    endLabel="End pause"
                    pauseLabel="Pause timer"
                    resumeLabel="Resume timer"
                    onFinish={() => setRechargeStage('pause-result')}
                  />
                ) : (
                  <GlassCard
                    style={[
                      styles.vzStatementCard,
                      {
                        backgroundColor: theme.accentTertiary,
                        borderColor: theme.accent,
                        marginBottom: rcFieldGap,
                      },
                    ]}>
                    <Text style={[styles.vzStatementText, { color: theme.text }]}>
                      Your pause has started.
                    </Text>
                    <Text
                      style={[
                        styles.cueSupportText,
                        { color: theme.textSecondary, marginTop: spacing.sm },
                      ]}>
                      You do not need to watch the clock. Come back to the app whenever you want.
                    </Text>
                    <View style={[styles.actionStack, { marginTop: spacing.lg }]}>
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label="I gave myself a real pause"
                          onPress={() => setRechargeStage('pause-result')}
                          small
                        />
                      </View>
                      <Pressable
                        onPress={() => setRechargeStage('pause-setup')}
                        accessibilityRole="button"
                        accessibilityLabel="Choose a different kind of pause"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Choose a different kind of pause
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                )}
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'pause-result' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeActiveInner]}>
                <InternalBack
                  label="Back to my pause"
                  onPress={() => setRechargeStage('pause-running')}
                />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>RECOVERY COUNTS</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You gave your brain somewhere to land.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: rcFieldGap },
                  ]}>
                  This time was not wasted. You reduced the demand for a while.
                </Text>

                <View style={styles.actionStack}>
                  {rechargeRewarded ? (
                    <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                      <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                        Recovery win saved ✓
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.compactBtn}>
                      <GradientButton
                        label={`Save this as a recovery win +${RECHARGE_XP} XP`}
                        onPress={completePauseWin}
                        small
                      />
                    </View>
                  )}
                  <GradientButton
                    label="I need more rest"
                    onPress={() => setRechargeStage('pause-setup')}
                    variant="secondary"
                    small
                    style={styles.compactBtn}
                  />
                  <Pressable
                    onPress={openLowEnergyFromPause}
                    accessibilityRole="button"
                    accessibilityLabel="I'm ready for one small thing"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.quietAction,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      I&apos;m ready for one small thing
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'body-reset' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeActiveInner]}>
                <InternalBack label="Back to recharge tools" onPress={returnToRechargeMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>BODY FIRST</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Check the system carrying the task.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  Your body is not an obstacle between you and productivity. It is where all of this
                  is happening.
                </Text>
                <Text
                  style={[
                    styles.cueSupportText,
                    {
                      color: theme.textMuted,
                      textAlign: 'left',
                      alignSelf: 'stretch',
                      marginBottom: rcFieldGap,
                    },
                  ]}>
                  Basic care is still real progress.
                </Text>

                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                  {bodyCompletedCount} {bodyCompletedCount === 1 ? 'thing' : 'things'} cared for
                </Text>

                <View style={[styles.blockerList, { marginBottom: rcFieldGap }]}>
                  {bodyResetItems.map((item) => (
                    <RechargeBodyRow
                      key={item.id}
                      item={item}
                      isEditing={bodyEditingId === item.id}
                      editingText={bodyEditingText}
                      onEditingTextChange={(text) =>
                        setBodyEditingText(text.slice(0, TASK_TEXT_MAX))
                      }
                      onToggleComplete={() => toggleBodyResetItem(item.id)}
                      onStartEdit={() => {
                        setBodyEditingId(item.id);
                        setBodyEditingText(item.text);
                      }}
                      onSaveEdit={saveBodyEdit}
                      onCancelEdit={() => {
                        setBodyEditingId(null);
                        setBodyEditingText('');
                      }}
                      onDelete={() => deleteBodyItem(item.id)}
                    />
                  ))}
                  {!showCustomBodyItem ? (
                    <Pressable
                      onPress={() => setShowCustomBodyItem(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Add what my body needs"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.customBlockerBtn,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.addStepText, { color: theme.accentSecondary }]}>
                        + Add what my body needs
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.customBlockerInputRow}>
                      <TextInput
                        value={customBodyText}
                        onChangeText={(v) => setCustomBodyText(v.slice(0, TASK_TEXT_MAX))}
                        placeholder="What does your body need?"
                        placeholderTextColor={theme.textMuted}
                        maxLength={TASK_TEXT_MAX}
                        accessibilityLabel="Custom body care item"
                        returnKeyType="done"
                        onSubmitEditing={submitCustomBodyItem}
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
                          onPress={submitCustomBodyItem}
                          accessibilityRole="button"
                          accessibilityLabel="Add body care item"
                          style={[
                            styles.editSaveBtn,
                            { backgroundColor: theme.accentSecondary + '44' },
                          ]}>
                          <Text style={[styles.editSaveText, { color: theme.text }]}>Add</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setShowCustomBodyItem(false);
                            setCustomBodyText('');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel custom body item"
                          hitSlop={8}
                          style={styles.editCancelBtn}>
                          <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>

                {bodyCompletedCount > 0 ? (
                  <View style={styles.actionStack}>
                    {rechargeRewarded ? (
                      <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                        <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                          Recovery win saved ✓
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label={`That is enough for now +${RECHARGE_XP} XP`}
                          onPress={completeBodyResetWin}
                          small
                        />
                      </View>
                    )}
                    <Pressable
                      onPress={clearCompletedBodyItems}
                      accessibilityRole="button"
                      accessibilityLabel="Clear completed items"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.quietAction,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                        Clear completed items
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'smaller-day' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeActiveInner]}>
                <InternalBack label="Back to recharge tools" onPress={returnToRechargeMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>MAKE TODAY SMALLER</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Some things can wait.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: rcFieldGap },
                  ]}>
                  Protecting your capacity is not giving up. Choose what can shrink, move, or stop
                  asking for your energy today.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: rcFieldGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.text }]}>
                    You are allowed to plan around the energy you have.
                  </Text>
                </GlassCard>

                <View style={[styles.blockerList, { marginBottom: rcFieldGap }]}>
                  {smallerDayItems.map((item) => (
                    <RechargePermissionRow
                      key={item.id}
                      item={item}
                      isEditing={smallerEditingId === item.id}
                      editingText={smallerEditingText}
                      onEditingTextChange={(text) =>
                        setSmallerEditingText(text.slice(0, TASK_TEXT_MAX))
                      }
                      onToggle={() => toggleSmallerDayItem(item.id)}
                      onStartEdit={() => {
                        setSmallerEditingId(item.id);
                        setSmallerEditingText(item.text);
                      }}
                      onSaveEdit={saveSmallerEdit}
                      onCancelEdit={() => {
                        setSmallerEditingId(null);
                        setSmallerEditingText('');
                      }}
                      onDelete={() => deleteSmallerItem(item.id)}
                    />
                  ))}
                  {!showCustomPermission ? (
                    <Pressable
                      onPress={() => setShowCustomPermission(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Write my own permission"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.customBlockerBtn,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.addStepText, { color: theme.accentSecondary }]}>
                        + Write my own permission
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.customBlockerInputRow}>
                      <TextInput
                        value={customPermissionText}
                        onChangeText={(v) => setCustomPermissionText(v.slice(0, TASK_TEXT_MAX))}
                        placeholder="What are you allowed to do differently?"
                        placeholderTextColor={theme.textMuted}
                        maxLength={TASK_TEXT_MAX}
                        accessibilityLabel="Custom permission"
                        returnKeyType="done"
                        onSubmitEditing={submitCustomPermission}
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
                          onPress={submitCustomPermission}
                          accessibilityRole="button"
                          accessibilityLabel="Add permission"
                          style={[
                            styles.editSaveBtn,
                            { backgroundColor: theme.accentSecondary + '44' },
                          ]}>
                          <Text style={[styles.editSaveText, { color: theme.text }]}>Add</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setShowCustomPermission(false);
                            setCustomPermissionText('');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel custom permission"
                          hitSlop={8}
                          style={styles.editCancelBtn}>
                          <Text style={[styles.editCancelText, { color: theme.textMuted }]}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>

                {selectedSmallerLabels.length > 0 ? (
                  <GlassCard style={[styles.boredomSummaryCard, { marginBottom: rcFieldGap }]}>
                    <Text style={[styles.vzModeLabel, { color: theme.textMuted }]}>
                      My low-energy plan
                    </Text>
                    <Text style={[styles.boredomSummaryText, { color: theme.text }]}>
                      {smallerDaySummary}
                    </Text>
                  </GlassCard>
                ) : null}

                {selectedSmallerLabels.length > 0 ? (
                  <View style={styles.actionStack}>
                    {rechargeRewarded ? (
                      <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                        <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                          Recovery win saved ✓
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label={`Use this plan today +${RECHARGE_XP} XP`}
                          onPress={completeSmallerDayWin}
                          small
                        />
                      </View>
                    )}
                    <Pressable
                      onPress={clearSmallerChoices}
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
                ) : null}
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'low-energy-setup' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeActiveInner]}>
                <InternalBack label="Back to recharge tools" onPress={returnToRechargeMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>LOW-ENERGY MODE</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Let&apos;s use the energy you have.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: rcFieldGap },
                  ]}>
                  This is for something that truly cannot wait. The goal is not the best result. The
                  goal is the smallest result that is enough for today.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: rcFieldGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.text }]}>
                    Work with your capacity instead of fighting it.
                  </Text>
                </GlassCard>

                <View style={[styles.taskFieldBlock, { marginBottom: rcFieldGap, marginTop: 0 }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What truly cannot wait?
                  </Text>
                  <TextInput
                    value={lowEnergyTask}
                    onChangeText={(v) => setLowEnergyTask(v.slice(0, TASK_TEXT_MAX))}
                    placeholder="e.g. send the file, wash the dishes I need, answer one urgent message"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TASK_TEXT_MAX}
                    accessibilityLabel="What truly cannot wait?"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={() => {}}
                    onFocus={() => setRcInputFocused(true)}
                    onBlur={() => setRcInputFocused(false)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: rcInputFocused ? theme.accent : theme.surfaceBorder,
                      },
                      rcInputFocused && styles.taskInputFocused,
                    ]}
                  />
                </View>

                <View style={[styles.taskFieldBlock, { marginBottom: rcFieldGap, marginTop: 0 }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What would “enough” look like today?
                  </Text>
                  <TextInput
                    value={lowEnergyEnough}
                    onChangeText={(v) => setLowEnergyEnough(v.slice(0, LOW_ENERGY_ENOUGH_MAX))}
                    placeholder="e.g. send the rough version, wash five dishes, write one short reply"
                    placeholderTextColor={theme.textMuted}
                    maxLength={LOW_ENERGY_ENOUGH_MAX}
                    accessibilityLabel="What would enough look like today?"
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
                    {LOW_ENERGY_ENOUGH_PRESETS.map((preset) => (
                      <TagPill
                        key={preset}
                        label={preset}
                        onPress={() => setLowEnergyEnough(preset.slice(0, LOW_ENERGY_ENOUGH_MAX))}
                      />
                    ))}
                  </View>
                </View>

                {lowEnergyEnough.trim() ? (
                  <GlassCard style={[styles.boredomSummaryCard, { marginBottom: rcFieldGap }]}>
                    <Text style={[styles.vzModeLabel, { color: theme.textMuted }]}>
                      Enough for today
                    </Text>
                    <Text style={[styles.boredomSummaryText, { color: theme.text }]}>
                      {lowEnergyEnough.trim().charAt(0).toUpperCase() +
                        lowEnergyEnough.trim().slice(1)}
                      {lowEnergyEnough.trim().endsWith('.') ? '' : '.'}
                    </Text>
                    <Text style={[styles.cueSupportText, { color: theme.textSecondary }]}>
                      Anything beyond this is optional.
                    </Text>
                  </GlassCard>
                ) : null}

                <GlassCard style={[styles.rechargeRulesCard, { marginBottom: rcFieldGap }]}>
                  <Text style={[styles.vzModeLabel, { color: theme.textMuted }]}>
                    Low-energy rules
                  </Text>
                  <Text style={[styles.rechargeRuleText, { color: theme.textSecondary }]}>
                    • Choose the smallest acceptable result
                  </Text>
                  <Text style={[styles.rechargeRuleText, { color: theme.textSecondary }]}>
                    • Remove one unnecessary part
                  </Text>
                  <Text style={[styles.rechargeRuleText, { color: theme.textSecondary }]}>
                    • Check in again after one short round
                  </Text>
                </GlassCard>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  Would a short round help?
                </Text>
                <View style={styles.durationRow}>
                  {LOW_ENERGY_DURATION_PRESETS.map((mins) => (
                    <DurationChip
                      key={mins}
                      label={`${mins} min`}
                      selected={
                        lowEnergyHasTimer &&
                        !lowEnergyDurationCustom &&
                        lowEnergyDuration === mins
                      }
                      onPress={() => {
                        setLowEnergyHasTimer(true);
                        setLowEnergyDurationCustom(false);
                        setLowEnergyDuration(mins);
                      }}
                    />
                  ))}
                  <DurationChip
                    label="Custom"
                    selected={lowEnergyHasTimer && lowEnergyDurationCustom}
                    onPress={() => {
                      setLowEnergyHasTimer(true);
                      setLowEnergyDurationCustom(true);
                    }}
                  />
                  <DurationChip
                    label="No timer"
                    selected={!lowEnergyHasTimer}
                    onPress={() => {
                      setLowEnergyHasTimer(false);
                      setLowEnergyDurationCustom(false);
                    }}
                  />
                </View>

                {lowEnergyHasTimer && lowEnergyDurationCustom ? (
                  <View style={[styles.taskFieldBlock, { marginBottom: rcFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Custom minutes</Text>
                    <TextInput
                      value={lowEnergyCustomMinutes}
                      onChangeText={(v) =>
                        setLowEnergyCustomMinutes(sanitizeCustomMinutesInput(v))
                      }
                      placeholder="e.g. 8"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                      accessibilityLabel="Custom low-energy minutes"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (canStartLowEnergy) startLowEnergy();
                      }}
                      style={[
                        styles.taskInput,
                        styles.customDurationInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: lowEnergyCustomErrorText
                            ? theme.accent
                            : theme.surfaceBorder,
                        },
                      ]}
                    />
                    {lowEnergyCustomErrorText ? (
                      <Text style={[styles.validationText, { color: theme.accent }]}>
                        {lowEnergyCustomErrorText}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.actionStack}>
                  <View style={[styles.compactBtn, !canStartLowEnergy && styles.continueDisabled]}>
                    <GradientButton
                      label={lowEnergyHasTimer ? 'Start low-energy mode' : 'Begin with enough'}
                      onPress={startLowEnergy}
                      small
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'low-energy-running' ? (
            <View style={styles.stageShell}>
              <View
                style={[
                  styles.stageInner,
                  lowEnergyHasTimer ? styles.timerRunningInner : styles.rechargeActiveInner,
                ]}>
                <InternalBack
                  label="Back to low-energy setup"
                  onPress={() => {
                    setLowEnergyRunKey((key) => key + 1);
                    setRechargeStage('low-energy-setup');
                  }}
                />
                {lowEnergyHasTimer ? (
                  <GentleTimer
                    key={`recharge-low-${lowEnergyRunKey}-${lowEnergyDuration}`}
                    durationMinutes={lowEnergyDuration}
                    title={`Enough for today: ${lowEnergyEnough.trim() || 'enough'}`}
                    compact
                    endLabel="End round"
                    pauseLabel="Pause timer"
                    resumeLabel="Resume timer"
                    onFinish={() => setRechargeStage('low-energy-result')}
                  />
                ) : (
                  <GlassCard
                    style={[
                      styles.vzStatementCard,
                      {
                        backgroundColor: theme.accentTertiary,
                        borderColor: theme.accent,
                        marginBottom: rcFieldGap,
                      },
                    ]}>
                    <Text style={[styles.vzStatementText, { color: theme.text }]}>
                      Your only goal is: {lowEnergyEnough.trim()}
                    </Text>
                    <View style={[styles.actionStack, { marginTop: spacing.lg }]}>
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label="I did enough for now"
                          onPress={() => setRechargeStage('low-energy-result')}
                          small
                        />
                      </View>
                      <Pressable
                        onPress={() => setRechargeStage('low-energy-setup')}
                        accessibilityRole="button"
                        accessibilityLabel="Change what enough means"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Change what enough means
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                )}
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'low-energy-result' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeActiveInner]}>
                <InternalBack
                  label="Back to low-energy mode"
                  onPress={() => setRechargeStage('low-energy-running')}
                />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>ENOUGH IS ENOUGH</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You worked with the capacity you had.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: rcFieldGap },
                  ]}>
                  You did not need unlimited energy to move one necessary thing forward.
                </Text>

                <View style={styles.actionStack}>
                  {rechargeRewarded ? (
                    <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                      <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                        Recovery win saved ✓
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.compactBtn}>
                      <GradientButton
                        label={`Save this as a tiny win +${RECHARGE_XP} XP`}
                        onPress={completeLowEnergyWin}
                        small
                      />
                    </View>
                  )}
                  <GradientButton
                    label="Do one more short round"
                    onPress={restartLowEnergyRound}
                    variant="secondary"
                    small
                    style={styles.compactBtn}
                  />
                  <Pressable
                    onPress={returnToRechargeMenu}
                    accessibilityRole="button"
                    accessibilityLabel="That is enough for today"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.quietAction,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                      That is enough for today
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {isRechargeFlow && rechargeStage === 'complete' && rechargeCompletionCopy ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.rechargeCompleteInner]}>
                <InternalBack
                  label="Back to my recharge tool"
                  onPress={backFromRechargeComplete}
                />
                <GlassCard style={styles.successCard}>
                  <Text style={styles.vzCompleteBadge} accessibilityLabel="Recovery">
                    🌙
                  </Text>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    {rechargeCompletionCopy.headline}
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    {rechargeCompletionCopy.body}
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      1 recovery strategy used
                    </Text>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      +{rechargeXpEarned} XP earned
                    </Text>
                    <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                      Your garden grows from rest and self-care too.
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
                      onPress={tryAnotherRechargeTool}
                      accessibilityRole="button"
                      accessibilityLabel="Try another recharge tool"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Try another recharge tool
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

          {isMessageLoopFlow && messageStage === 'menu' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageMenuInner]}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                  I&apos;M AVOIDING A MESSAGE
                </Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Let&apos;s get this message out of your head.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: mlSectionGap },
                  ]}>
                  An unanswered message can keep using mental space long after the reply itself would
                  be finished. You do not need a perfect response — only a clear next decision.
                </Text>

                <GlassCard
                  style={[
                    styles.rechargeIntroCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: mlSectionGap,
                    },
                  ]}>
                  <View style={styles.rechargeIntroTextGroup}>
                    <Text style={[styles.rechargeIntroTitle, { color: theme.onLightAccent }]}>
                      The reply may take two minutes. The open loop has already taken enough.
                    </Text>
                    <Text style={[styles.rechargeIntroSupport, { color: theme.onLightAccentMuted }]}>
                      Let&apos;s reply, ask for time, set a boundary, or decide that no answer is
                      needed.
                    </Text>
                  </View>
                </GlassCard>

                <View style={[styles.taskFieldBlock, { marginBottom: mlSectionGap, marginTop: 0 }]}>
                  <View style={styles.messageContextLabelRow}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                      Who or what are you replying to?
                    </Text>
                    <Text style={[styles.messageOptionalTag, { color: theme.textMuted }]}>
                      (optional)
                    </Text>
                  </View>

                  {messageContextConfirmed && messageContext ? (
                    <View
                      style={[
                        styles.messageContextSavedCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}>
                      <Text style={[styles.messageContextSavedText, { color: theme.text }]}>
                        Replying to: {messageContext}
                      </Text>
                      <Pressable
                        onPress={editMessageContext}
                        accessibilityRole="button"
                        accessibilityLabel="Edit message context"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.messageContextEditBtn,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.messageContextEditText, { color: theme.accentSecondary }]}>
                          Edit
                        </Text>
                      </Pressable>
                      <Text style={[styles.vzFieldHelper, { color: theme.textMuted, marginTop: spacing.xs }]}>
                        Saved for this message flow ✓
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.messageContextInputRow}>
                        <TextInput
                          value={messageContextDraft}
                          onChangeText={(v) =>
                            setMessageContextDraft(v.slice(0, MESSAGE_CONTEXT_MAX))
                          }
                          placeholder="e.g. my manager about the deadline"
                          placeholderTextColor={theme.textMuted}
                          maxLength={MESSAGE_CONTEXT_MAX}
                          accessibilityLabel="Who or what are you replying to?"
                          returnKeyType="done"
                          blurOnSubmit
                          onSubmitEditing={saveMessageContext}
                          onFocus={() => setMlInputFocused(true)}
                          onBlur={() => setMlInputFocused(false)}
                          style={[
                            styles.taskInput,
                            styles.messageContextInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.surface,
                              borderColor: mlInputFocused ? theme.accent : theme.surfaceBorder,
                            },
                            mlInputFocused && styles.taskInputFocused,
                          ]}
                        />
                        <Pressable
                          onPress={saveMessageContext}
                          accessibilityRole="button"
                          accessibilityLabel="Save message context"
                          style={({ pressed, focused }: PressableFocusState) => [
                            styles.messageContextSaveBtn,
                            {
                              backgroundColor: theme.accentTertiary,
                              borderColor: theme.accent,
                            },
                            pressed && styles.pressed,
                            focused && Platform.OS === 'web' ? styles.focusRing : null,
                          ]}>
                          <Text
                            style={[
                              styles.messageContextSaveIcon,
                              { color: theme.onLightAccent },
                            ]}>
                            →
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                        This short note can appear in Tiny Wins. Avoid private details.
                      </Text>
                    </>
                  )}
                </View>

                <ActivationMethodsGrid columns={messageMethodColumns} gap={methodGap}>
                  {MESSAGE_LOOP_METHODS.map((method) => (
                    <ActivationMethodCard
                      key={method.id}
                      icon={method.icon}
                      title={method.title}
                      description={method.description}
                      onPress={() => selectMessageMethod(method.id)}
                    />
                  ))}
                </ActivationMethodsGrid>
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'quick-setup' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageActiveInner]}>
                <InternalBack label="Back to message tools" onPress={returnToMessageMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>CLOSE THE LOOP</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  How long will the reply actually take?
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  Your brain may have been carrying this message for much longer than the reply
                  itself will take. Let&apos;s measure the action, not the dread around it.
                </Text>
                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: mlFieldGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.onLightAccent }]}>
                    One finished reply means one less task running in the background.
                  </Text>
                </GlassCard>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  What would close this loop?
                </Text>
                <View style={[styles.exampleRow, { marginBottom: mlFieldGap }]}>
                  {QUICK_CLOSE_GOAL_PRESETS.map((preset) => (
                    <MessageOptionChip
                      key={preset}
                      label={preset}
                      selected={quickClosePreset === preset}
                      onPress={() => selectQuickClosePreset(preset)}
                    />
                  ))}
                </View>

                {quickClosePreset === QUICK_CLOSE_CUSTOM_PRESET ? (
                  <View style={[styles.taskFieldBlock, { marginTop: 0, marginBottom: mlFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>My finish line</Text>
                    <TextInput
                      value={quickCloseCustomGoal}
                      onChangeText={(v) => setQuickCloseCustomGoal(v.slice(0, TASK_TEXT_MAX))}
                      placeholder="e.g. send one clear answer"
                      placeholderTextColor={theme.textMuted}
                      maxLength={TASK_TEXT_MAX}
                      accessibilityLabel="My finish line"
                      returnKeyType="done"
                      blurOnSubmit
                      onSubmitEditing={startQuickCloseStopwatch}
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
                ) : null}

                <Text
                  style={[
                    styles.stageSupport,
                    {
                      color: theme.textSecondary,
                      marginBottom: spacing.md,
                      textAlign: 'left',
                      alignSelf: 'stretch',
                    },
                  ]}>
                  Open the message and start the stopwatch. Come back when the loop is closed — the
                  timer will show how long it really took.
                </Text>

                <View style={styles.actionStack}>
                  <View
                    style={[
                      styles.compactBtn,
                      styles.messageStopwatchBtn,
                      !canStartQuickClose && styles.messageStopwatchBtnDisabled,
                    ]}
                    pointerEvents={canStartQuickClose ? 'auto' : 'none'}>
                    <GradientButton
                      label="Start stopwatch"
                      onPress={startQuickCloseStopwatch}
                      small
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'quick-running' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageActiveInner, styles.timerRunningInner]}>
                <InternalBack
                  label="Back to stopwatch setup"
                  onPress={cancelQuickCloseStopwatch}
                />
                <GentleStopwatch
                  key={`message-stopwatch-${stopwatchRunKey}`}
                  runKey={stopwatchRunKey}
                  title={`Closing: ${quickCloseGoal.trim()}`}
                  onFinish={finishQuickCloseStopwatch}
                  onCancel={cancelQuickCloseStopwatch}
                />
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'quick-result' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageActiveInner]}>
                <InternalBack
                  label="Back to stopwatch"
                  onPress={() => {
                    setStopwatchRunKey((key) => key + 1);
                    setMessageStage('quick-running');
                  }}
                />
                <GlassCard style={styles.successCard}>
                  <Text style={[styles.eyebrow, { color: theme.textMuted }]}>LOOP CLOSED</Text>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    It took {formatStopwatchTime(stopwatchElapsed)}.
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    That message no longer needs to keep running in the background.
                  </Text>
                  <Text
                    style={[
                      styles.rechargeIntroTitle,
                      { color: theme.text, marginBottom: spacing.md },
                    ]}>
                    Your brain can put it down now.
                  </Text>
                  <View style={styles.actionStack}>
                    {messageRewarded ? (
                      <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                        <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                          Tiny win saved ✓
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label={`Save this as a tiny win +${MESSAGE_LOOP_XP} XP`}
                          onPress={completeQuickCloseWin}
                          small
                        />
                      </View>
                    )}
                    <Pressable
                      onPress={closeAnotherMessage}
                      accessibilityRole="button"
                      accessibilityLabel="Close another message"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.quietAction,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                        Close another message
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={tryAnotherMessageTool}
                      accessibilityRole="button"
                      accessibilityLabel="Try another reply tool"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.quietAction,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                        Try another reply tool
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'reply-builder' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageActiveInner]}>
                <InternalBack label="Back to message tools" onPress={returnToMessageMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                  SMALLEST ACCEPTABLE REPLY
                </Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You do not need the perfect words.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  Choose what the reply needs to accomplish. We&apos;ll create a short starting point
                  that you can edit.
                </Text>
                <Text
                  style={[
                    styles.cueSupportText,
                    {
                      color: theme.textMuted,
                      textAlign: 'left',
                      alignSelf: 'stretch',
                      marginBottom: mlFieldGap,
                    },
                  ]}>
                  A useful reply can be two sentences.
                </Text>

                <ActivationMethodsGrid columns={messageMethodColumns} gap={methodGap}>
                  {standardReplyIntents.map((intent) => (
                    <MessageChoiceCard
                      key={intent.id}
                      title={intent.title}
                      description={intent.description}
                      selected={replyIntent === intent.id}
                      onPress={() => selectReplyIntent(intent.id)}
                    />
                  ))}
                </ActivationMethodsGrid>
                {customReplyIntent ? (
                  <View style={{ marginTop: methodGap, width: '100%' }}>
                    <MessageChoiceCard
                      title={customReplyIntent.title}
                      description={customReplyIntent.description}
                      selected={replyIntent === customReplyIntent.id}
                      onPress={() => selectReplyIntent(customReplyIntent.id)}
                      wide
                    />
                  </View>
                ) : null}

                {replyIntent ? (
                  <View style={[styles.taskFieldBlock, { marginTop: mlFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                      Your short draft
                    </Text>
                    <TextInput
                      value={replyDraft}
                      onChangeText={(v) => setReplyDraft(v.slice(0, REPLY_DRAFT_MAX))}
                      placeholder="Edit your reply here"
                      placeholderTextColor={theme.textMuted}
                      maxLength={REPLY_DRAFT_MAX}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Your short draft"
                      onSubmitEditing={() => {}}
                      style={[
                        styles.taskInput,
                        styles.messageDraftInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}
                    />
                    <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                      Change anything you need. The app cannot send this message for you.
                    </Text>

                    <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                      {messageRewarded ? (
                        <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                          <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                            Tiny win saved ✓
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.compactBtn}>
                          <GradientButton
                            label={`I sent the reply +${MESSAGE_LOOP_XP} XP`}
                            onPress={completeReplyBuilderWin}
                            small
                          />
                        </View>
                      )}
                      <Pressable
                        onPress={() => {
                          setReplyIntent(null);
                          setReplyDraft('');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Choose another intention"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Choose another intention
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={returnToMessageMenu}
                        accessibilityRole="button"
                        accessibilityLabel="I'm not ready to send yet"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          I&apos;m not ready to send yet
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'late-reply' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageActiveInner]}>
                <InternalBack label="Back to message tools" onPress={returnToMessageMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>LATE REPLY</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  Late is not the same as impossible.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  You do not need to explain your entire nervous system before answering the actual
                  message.
                </Text>
                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: mlFieldGap,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.onLightAccent }]}>
                    One sentence of acknowledgment is enough.
                  </Text>
                </GlassCard>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  Choose an opener
                </Text>
                <View style={[styles.exampleRow, { marginBottom: mlFieldGap }]}>
                  {LATE_REPLY_OPENERS.map((opener) => (
                    <MessageOptionChip
                      key={opener.id}
                      label={opener.label}
                      selected={lateOpener === opener.id}
                      onPress={() => selectLateOpener(opener.id)}
                    />
                  ))}
                </View>

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  Choose what comes next
                </Text>
                <View style={[styles.exampleRow, { marginBottom: mlFieldGap }]}>
                  {LATE_REPLY_ACTIONS.map((action) => (
                    <MessageOptionChip
                      key={action.id}
                      label={action.label}
                      selected={lateAction === action.id}
                      onPress={() => selectLateAction(action.id)}
                    />
                  ))}
                </View>

                {lateOpener && lateAction ? (
                  <View style={styles.taskFieldBlock}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Your reply</Text>
                    <TextInput
                      value={lateDraft}
                      onChangeText={(v) => setLateDraft(v.slice(0, REPLY_DRAFT_MAX))}
                      placeholder="Edit your late reply here"
                      placeholderTextColor={theme.textMuted}
                      maxLength={REPLY_DRAFT_MAX}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Your reply"
                      onSubmitEditing={() => {}}
                      style={[
                        styles.taskInput,
                        styles.messageDraftInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}
                    />

                    <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                      {messageRewarded ? (
                        <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                          <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                            Tiny win saved ✓
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.compactBtn}>
                          <GradientButton
                            label={`I sent the late reply +${MESSAGE_LOOP_XP} XP`}
                            onPress={completeLateReplyWin}
                            small
                          />
                        </View>
                      )}
                      <Pressable
                        onPress={() => {
                          setLateOpener(null);
                          setLateDraft('');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Change the opening"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Change the opening
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => selectLateAction('ask-for-time')}
                        accessibilityRole="button"
                        accessibilityLabel="I need more time instead"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          I need more time instead
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'protect-energy' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageActiveInner]}>
                <InternalBack label="Back to message tools" onPress={returnToMessageMenu} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>PROTECT YOUR ENERGY</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>
                  You can respond without giving this all of your energy.
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  First decide what kind of contact is actually necessary. A boundary is also a clear
                  answer.
                </Text>
                <Text style={[styles.vzSafetyCopy, { color: theme.textMuted, marginTop: 0, marginBottom: mlFieldGap }]}>
                  If contact feels unsafe, you are allowed to pause, mute, block, seek support, or not
                  reply.
                </Text>

                <ActivationMethodsGrid columns={messageMethodColumns} gap={methodGap}>
                  {ENERGY_PROTECTION_OPTIONS.map((option) => (
                    <MessageChoiceCard
                      key={option.id}
                      title={option.title}
                      description={option.description}
                      selected={energyChoice === option.id}
                      onPress={() => selectEnergyChoice(option.id)}
                    />
                  ))}
                </ActivationMethodsGrid>

                {energyChoice === 'unsent-draft' && !unsentDraftCrumpled ? (
                  <View style={[styles.taskFieldBlock, { marginTop: mlFieldGap }]}>
                    <Text style={[styles.stageTitle, { color: theme.text, fontSize: 28, lineHeight: 34 }]}>
                      Write the version you should not send.
                    </Text>
                    <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                      This stays inside this temporary field. It will not be saved or sent.
                    </Text>
                    <TextInput
                      value={unsentDraft}
                      onChangeText={(v) => setUnsentDraft(v.slice(0, UNSENT_DRAFT_MAX))}
                      placeholder="Get the emotional first version out..."
                      placeholderTextColor={theme.textMuted}
                      maxLength={UNSENT_DRAFT_MAX}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Unsent emotional draft"
                      onSubmitEditing={() => {}}
                      style={[
                        styles.taskInput,
                        styles.messageDraftInput,
                        styles.messageUnsentInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}
                    />
                    <View style={[styles.compactBtn, { marginTop: spacing.md, alignSelf: 'center' }]}>
                      <GradientButton
                        label="Crumple this draft 🗑️"
                        onPress={crumpleUnsentDraft}
                        small
                      />
                    </View>
                  </View>
                ) : null}

                {energyChoice === 'unsent-draft' && unsentDraftCrumpled ? (
                  <View style={[styles.taskFieldBlock, { marginTop: mlFieldGap }]}>
                    <Text style={[styles.stageTitle, { color: theme.text, fontSize: 28, lineHeight: 34 }]}>
                      Good. What is the useful core?
                    </Text>
                    <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                      Keep only the information, request, or boundary that actually needs to be
                      communicated.
                    </Text>
                    <TextInput
                      value={usefulCoreDraft}
                      onChangeText={(v) => setUsefulCoreDraft(v.slice(0, REPLY_DRAFT_MAX))}
                      placeholder="Write the useful version here"
                      placeholderTextColor={theme.textMuted}
                      maxLength={REPLY_DRAFT_MAX}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Useful core draft"
                      onSubmitEditing={() => {}}
                      style={[
                        styles.taskInput,
                        styles.messageDraftInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}
                    />
                    <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                      {messageRewarded ? (
                        <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                          <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                            Tiny win saved ✓
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.compactBtn}>
                          <GradientButton
                            label={`${energyCtaLabel} +${MESSAGE_LOOP_XP} XP`}
                            onPress={completeEnergyWin}
                            small
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}

                {energyChoice === 'no-reply-needed' ? (
                  <View style={[styles.taskFieldBlock, { marginTop: mlFieldGap }]}>
                    <GlassCard
                      style={[
                        styles.vzStatementCard,
                        {
                          backgroundColor: theme.accentTertiary,
                          borderColor: theme.accent,
                          marginBottom: spacing.md,
                        },
                      ]}>
                      <Text style={[styles.vzStatementText, { color: theme.onLightAccent }]}>
                        I am choosing not to reply to this message.
                      </Text>
                    </GlassCard>
                    <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                      A deliberate decision is different from carrying an undefined obligation.
                    </Text>
                    <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                      {messageRewarded ? (
                        <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                          <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                            Tiny win saved ✓
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.compactBtn}>
                          <GradientButton
                            label={`${energyCtaLabel} +${MESSAGE_LOOP_XP} XP`}
                            onPress={completeEnergyWin}
                            small
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}

                {energyChoice === 'ask-someone-to-check' ? (
                  <View style={[styles.taskFieldBlock, { marginTop: mlFieldGap }]}>
                    <Text style={[styles.stageSupport, { color: theme.textSecondary }]}>
                      Share the draft with someone you trust before sending it.
                    </Text>
                    <TextInput
                      value={energyDraft}
                      onChangeText={(v) => setEnergyDraft(v.slice(0, REPLY_DRAFT_MAX))}
                      placeholder="Paste or write a temporary draft"
                      placeholderTextColor={theme.textMuted}
                      maxLength={REPLY_DRAFT_MAX}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Draft for someone to check"
                      onSubmitEditing={() => {}}
                      style={[
                        styles.taskInput,
                        styles.messageDraftInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}
                    />
                    <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                      {messageRewarded ? (
                        <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                          <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                            Tiny win saved ✓
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.compactBtn}>
                          <GradientButton
                            label={`${energyCtaLabel} +${MESSAGE_LOOP_XP} XP`}
                            onPress={completeEnergyWin}
                            small
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}

                {energyChoice &&
                energyChoice !== 'unsent-draft' &&
                energyChoice !== 'no-reply-needed' &&
                energyChoice !== 'ask-someone-to-check' ? (
                  <View style={[styles.taskFieldBlock, { marginTop: mlFieldGap }]}>
                    <Text style={[styles.taskFieldLabel, { color: theme.text }]}>Your short draft</Text>
                    <TextInput
                      value={energyDraft}
                      onChangeText={(v) => setEnergyDraft(v.slice(0, REPLY_DRAFT_MAX))}
                      placeholder="Edit your draft here"
                      placeholderTextColor={theme.textMuted}
                      maxLength={REPLY_DRAFT_MAX}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Energy protection draft"
                      onSubmitEditing={() => {}}
                      style={[
                        styles.taskInput,
                        styles.messageDraftInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                        },
                      ]}
                    />
                    <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                      {messageRewarded ? (
                        <View style={[styles.compactBtn, styles.vzCompletedBtn]}>
                          <Text style={[styles.vzCompletedText, { color: theme.textSecondary }]}>
                            Tiny win saved ✓
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.compactBtn}>
                          <GradientButton
                            label={`${energyCtaLabel} +${MESSAGE_LOOP_XP} XP`}
                            onPress={completeEnergyWin}
                            small
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {isMessageLoopFlow && messageStage === 'complete' && messageCompletionCopy ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.messageCompleteInner]}>
                <InternalBack label="Back to my reply tool" onPress={backFromMessageComplete} />
                <GlassCard style={styles.successCard}>
                  <Text style={styles.vzCompleteBadge} accessibilityLabel="Message loop">
                    💬
                  </Text>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    {messageCompletionCopy.headline}
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    {messageCompletionCopy.body}
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      1 communication loop handled
                    </Text>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      +{messageXpEarned} XP earned
                    </Text>
                    {messageMethod === 'close-quickly' ? (
                      <Text style={[styles.sessionStat, { color: theme.text }]}>
                        Reply time: {formatStopwatchTime(stopwatchElapsed)}
                      </Text>
                    ) : null}
                    <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                      Your garden grows from closed loops too.
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
                      onPress={closeAnotherMessage}
                      accessibilityRole="button"
                      accessibilityLabel="Close another message"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Close another message
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={tryAnotherMessageTool}
                      accessibilityRole="button"
                      accessibilityLabel="Try another reply tool"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Try another reply tool
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

          {isAttentionResetFlow && attentionStage === 'reset' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.attentionInner]}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>TOO MANY THINGS OPEN</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>Let’s reduce the noise.</Text>
                <Text style={[styles.stageSupport, { color: theme.textSecondary, marginBottom: spacing.xs }]}>
                  When too many things compete for your attention, choosing what comes first can make
                  everything feel smaller.
                </Text>
                <Text
                  style={[
                    styles.vzFieldHelper,
                    { color: theme.textMuted, marginBottom: spacing.md },
                  ]}>
                  List what is pulling at you, set a priority, then choose just one thing to focus on.
                </Text>

                <GlassCard style={styles.attentionQuietCard}>
                  <Text style={[styles.attentionQuietTitle, { color: theme.text }]}>
                    One thing gets your attention now. The rest stay visible, but parked for later.
                  </Text>
                  <Text style={[styles.attentionQuietBody, { color: theme.textMuted }]}>
                    You are not deleting them. You are only removing the competition for now.
                  </Text>
                </GlassCard>

                <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                  What is pulling at your attention?
                </Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xs },
                  ]}>
                  Add the things competing for your attention right now.
                </Text>
                <AttentionComposer
                  title={attentionTitle}
                  onTitleChange={(value) => {
                    setAttentionTitle(value.slice(0, ATTENTION_ITEM_CHAR_MAX));
                    if (attentionFeedback) setAttentionFeedback('');
                  }}
                  priority={attentionPriority}
                  onPriorityChange={setAttentionPriority}
                  deadline={attentionDeadline}
                  onDeadlineChange={(value) =>
                    setAttentionDeadline(value.slice(0, ATTENTION_DEADLINE_MAX))
                  }
                  onSubmit={addAttentionTask}
                  inputRef={attentionInputRef}
                  titleFocused={arFocusedField === 'title'}
                  deadlineFocused={arFocusedField === 'deadline'}
                  onTitleFocus={() => setArFocusedField('title')}
                  onDeadlineFocus={() => setArFocusedField('deadline')}
                  onBlur={() => setArFocusedField(null)}
                  feedback={attentionFeedback}
                />

                {attentionOpenTasks.length > 0 ? (
                  <>
                    {attentionJustFinished ? (
                      <View style={styles.attentionDoneBanner}>
                        <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                          One thing is off your plate ✓
                        </Text>
                        <Text style={[styles.vzFieldHelper, { color: theme.textSecondary }]}>
                          Choose what gets the next turn — or stop here.
                        </Text>
                      </View>
                    ) : null}

                    {attentionHasActive && attentionActiveTask ? (
                      <>
                        <Text style={[styles.attentionSectionTitle, { color: theme.textMuted }]}>
                          STARTING HERE
                        </Text>
                        <AttentionTaskList>
                          {renderAttentionTaskCard(attentionActiveTask, true)}
                        </AttentionTaskList>
                        {attentionParkedTasks.length > 0 ? (
                          <>
                            <Text style={[styles.attentionSectionTitle, { color: theme.textMuted }]}>
                              PARKED FOR LATER
                            </Text>
                            <Text
                              style={[
                                styles.vzFieldHelper,
                                { color: theme.textMuted, marginBottom: spacing.sm },
                              ]}>
                              Still here — they just do not need your attention yet.
                            </Text>
                            <AttentionTaskList>
                              {attentionParkedTasks.map((task) =>
                                renderAttentionTaskCard(task, false),
                              )}
                            </AttentionTaskList>
                            <AttentionBrainDumpSave
                              parkedCount={attentionParkedTasks.length}
                              needsSave={parkedNeedsSave}
                              status={brainDumpSaveStatus}
                              onSave={saveParkedToBrainDumpNow}
                            />
                          </>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Text style={[styles.attentionSectionTitle, { color: theme.textMuted }]}>
                          YOUR OPEN THINGS
                        </Text>
                        <Text
                          style={[
                            styles.stageSupport,
                            { color: theme.textSecondary, marginBottom: spacing.xs },
                          ]}>
                          Choose what deserves your attention first.
                        </Text>
                        {attentionOpenTasks.length >= 2 ? (
                          <Text
                            style={[
                              styles.vzFieldHelper,
                              { color: theme.textMuted, marginBottom: spacing.sm },
                            ]}>
                            You only need to choose one.
                          </Text>
                        ) : null}
                        <AttentionTaskList>
                          {attentionOpenTasks.map((task) => renderAttentionTaskCard(task, false))}
                        </AttentionTaskList>
                        <AttentionBrainDumpSave
                          parkedCount={attentionParkedTasks.length}
                          needsSave={parkedNeedsSave}
                          status={brainDumpSaveStatus}
                          onSave={saveParkedToBrainDumpNow}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {!showQuickReset ? (
                      <Pressable
                        onPress={() => setShowQuickReset(true)}
                        accessibilityRole="button"
                        accessibilityLabel="I don’t want to list everything"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietActionLeft,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          I don’t want to list everything
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.quickResetBlock}>
                        <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                          Do only these three things.
                        </Text>
                        <View style={styles.blockerList}>
                          {QUICK_RESET_ITEMS.map((item, index) => (
                            <QuietCheckRow
                              key={item}
                              label={item}
                              checked={quickResetChecked[index]}
                              onToggle={() => toggleQuickResetItem(index)}
                            />
                          ))}
                        </View>
                        {quickResetCount > 0 ? (
                          <View style={[styles.actionStack, { marginTop: spacing.md }]}>
                            <View style={styles.compactBtn}>
                              {attentionRewarded ? (
                                <GradientButton
                                  label="Continue"
                                  onPress={continueAttentionComplete}
                                  small
                                />
                              ) : (
                                <GradientButton
                                  label={`I reduced the noise +${ATTENTION_RESET_XP} XP`}
                                  onPress={completeAttentionFromQuickReset}
                                  small
                                />
                              )}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </>
                )}

                {attentionCompletedTasks.length > 0 ? (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[styles.attentionSectionTitle, { color: theme.textMuted }]}>DONE</Text>
                    <AttentionTaskList>
                      {attentionCompletedTasks.map((task) => renderAttentionTaskCard(task, false))}
                    </AttentionTaskList>
                  </View>
                ) : null}

                {attentionHasActive || attentionCompletedTasks.length > 0 ? (
                  <View style={[styles.actionStack, { marginTop: spacing.lg }]}>
                    <View style={styles.attentionCtaBtn}>
                      {attentionRewarded ? (
                        <GradientButton label="Continue" onPress={continueAttentionComplete} small />
                      ) : (
                        <GradientButton
                          label={`I cleared some mental space · +${ATTENTION_RESET_XP} XP`}
                          onPress={completeAttentionSession}
                          small
                        />
                      )}
                    </View>
                    <Pressable
                      onPress={completeAttentionSession}
                      accessibilityRole="button"
                      accessibilityLabel="That’s enough for now"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.quietAction,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                        That’s enough for now
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {isAttentionResetFlow && attentionStage === 'complete' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.attentionCompleteInner]}>
                <GlassCard style={styles.successCard}>
                  <Text style={[styles.successTitle, { color: theme.text }]}>
                    Your attention has somewhere to go.
                  </Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    You chose what matters now and gave everything else permission to wait.
                  </Text>
                  <View style={styles.sessionStats}>
                    {attentionCompletedTasks.length > 0 ? (
                      <Text style={[styles.sessionStat, { color: theme.text }]}>
                        You also finished {attentionCompletedTasks.length}{' '}
                        {attentionCompletedTasks.length === 1 ? 'task' : 'tasks'}.
                      </Text>
                    ) : null}
                    {brainDumpSaved ? (
                      <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                        The rest are waiting in Brain Dump — not in your head.
                      </Text>
                    ) : null}
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      +{attentionXpEarned} XP earned
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
                      onPress={keepOrganizingAttention}
                      accessibilityRole="button"
                      accessibilityLabel="Keep organizing"
                      style={({ pressed, focused }: PressableFocusState) => [
                        styles.successLink,
                        pressed && styles.pressed,
                        focused && Platform.OS === 'web' ? styles.focusRing : null,
                      ]}>
                      <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                        Keep organizing
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
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : null}

          {isThreadRecoveryFlow && threadStage === 'find' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.threadInner]}>
                <InternalBack label="Back to stuck types" onPress={returnToStuckTypes} />
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>I LOST THE THREAD</Text>
                <Text style={[styles.stageTitle, { color: theme.text }]}>Let’s find your way back in.</Text>
                <Text
                  style={[
                    styles.stageSupport,
                    { color: theme.textSecondary, marginBottom: spacing.md },
                  ]}>
                  You don’t need to reconstruct the whole task. We only need the last useful clue.
                </Text>

                <GlassCard
                  style={[
                    styles.vzStatementCard,
                    {
                      backgroundColor: theme.accentTertiary,
                      borderColor: theme.accent,
                      marginBottom: spacing.lg,
                    },
                  ]}>
                  <Text style={[styles.vzStatementText, { color: theme.onLightAccent }]}>
                    Find the last useful clue, not the entire plan.
                  </Text>
                </GlassCard>

                {latestComebackNote ? (
                  <GlassCard style={[styles.clueCard, { marginBottom: spacing.lg }]}>
                    <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
                      FUTURE YOU LEFT A CLUE
                    </Text>
                    <Text style={[styles.clueMainText, { color: theme.text }]}>
                      {latestComebackNote.text}
                    </Text>
                    {latestComebackNote.context ? (
                      <Text style={[styles.vzFieldHelper, { color: theme.textSecondary }]}>
                        From: {latestComebackNote.context}
                      </Text>
                    ) : null}
                    {comebackTimestamp ? (
                      <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                        {comebackTimestamp}
                      </Text>
                    ) : null}
                    <View style={[styles.actionStack, { marginTop: spacing.sm }]}>
                      <View style={styles.compactBtn}>
                        <GradientButton label="Use this clue" onPress={useComebackClue} small />
                      </View>
                      <Pressable
                        onPress={clearComebackNote}
                        accessibilityRole="button"
                        accessibilityLabel="Clear this clue"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Clear this clue
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                ) : null}

                <Text style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                  What were you looking at or doing?
                </Text>
                <View style={[styles.threadChipWrap, { marginBottom: spacing.md }]}>
                  {THREAD_CONTEXT_OPTIONS.map((option) => (
                    <ThreadContextChip
                      key={option.id}
                      emoji={option.emoji}
                      label={option.label}
                      selected={threadContextKind === option.id}
                      onPress={() => setThreadContextKind(option.id)}
                    />
                  ))}
                </View>
                <View style={[styles.taskFieldBlock, { marginTop: 0, marginBottom: spacing.lg }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    Optional context
                  </Text>
                  <TextInput
                    value={threadContextText}
                    onChangeText={(value) => setThreadContextText(value.slice(0, THREAD_CONTEXT_MAX))}
                    placeholder="e.g. presentation, kitchen, email to Sam"
                    placeholderTextColor={theme.textMuted}
                    maxLength={THREAD_CONTEXT_MAX}
                    accessibilityLabel="Optional context"
                    returnKeyType="done"
                    blurOnSubmit
                    onFocus={() => setTrFocusedField('context')}
                    onBlur={() => setTrFocusedField(null)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor:
                          trFocusedField === 'context' ? theme.accent : theme.surfaceBorder,
                      },
                      trFocusedField === 'context' && styles.taskInputFocused,
                    ]}
                  />
                </View>

                <View style={[styles.taskFieldBlock, { marginTop: 0, marginBottom: spacing.lg }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What is the last thing you remember doing?
                  </Text>
                  <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                    Even a tiny detail can be enough.
                  </Text>
                  <TextInput
                    value={threadLastMemory}
                    onChangeText={(value) => setThreadLastMemory(value.slice(0, THREAD_MEMORY_MAX))}
                    placeholder="e.g. I had just chosen the images"
                    placeholderTextColor={theme.textMuted}
                    maxLength={THREAD_MEMORY_MAX}
                    accessibilityLabel="What is the last thing you remember doing?"
                    returnKeyType="done"
                    blurOnSubmit
                    onFocus={() => setTrFocusedField('memory')}
                    onBlur={() => setTrFocusedField(null)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor:
                          trFocusedField === 'memory' ? theme.accent : theme.surfaceBorder,
                      },
                      trFocusedField === 'memory' && styles.taskInputFocused,
                    ]}
                  />
                </View>

                <View style={[styles.taskFieldBlock, { marginTop: 0, marginBottom: spacing.lg }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    What were you trying to get to?
                  </Text>
                  <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                    Not the whole project — just what you were trying to make happen next.
                  </Text>
                  <TextInput
                    value={threadIntent}
                    onChangeText={(value) => setThreadIntent(value.slice(0, THREAD_MEMORY_MAX))}
                    placeholder="e.g. finish slide 3"
                    placeholderTextColor={theme.textMuted}
                    maxLength={THREAD_MEMORY_MAX}
                    accessibilityLabel="What were you trying to get to?"
                    returnKeyType="done"
                    blurOnSubmit
                    onFocus={() => setTrFocusedField('intent')}
                    onBlur={() => setTrFocusedField(null)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor:
                          trFocusedField === 'intent' ? theme.accent : theme.surfaceBorder,
                      },
                      trFocusedField === 'intent' && styles.taskInputFocused,
                    ]}
                  />
                </View>

                {threadContextKind ? (
                  <View style={{ marginBottom: spacing.md }}>
                    <Text
                      style={[styles.taskFieldLabel, { color: theme.text, marginBottom: spacing.sm }]}>
                      What would reconnect you fastest?
                    </Text>
                    <View style={styles.threadChipWrap}>
                      {threadSuggestions.map((suggestion) => (
                        <MessageOptionChip
                          key={suggestion}
                          label={suggestion}
                          selected={threadText === suggestion}
                          onPress={() => setThreadText(suggestion.slice(0, THREAD_TEXT_MAX))}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}

                <View
                  style={[styles.taskFieldBlock, { marginTop: 0, marginBottom: spacing.md }]}
                  onLayout={(event) => {
                    threadSectionYRef.current = event.nativeEvent.layout.y;
                  }}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>My thread</Text>
                  <TextInput
                    ref={threadInputRef}
                    value={threadText}
                    onChangeText={(value) => setThreadText(value.slice(0, THREAD_TEXT_MAX))}
                    placeholder="The next visible step"
                    placeholderTextColor={theme.textMuted}
                    maxLength={THREAD_TEXT_MAX}
                    accessibilityLabel="My thread"
                    returnKeyType="done"
                    blurOnSubmit
                    onFocus={() => setTrFocusedField('thread')}
                    onBlur={() => setTrFocusedField(null)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor:
                          trFocusedField === 'thread' ? theme.accent : theme.surfaceBorder,
                      },
                      trFocusedField === 'thread' && styles.taskInputFocused,
                    ]}
                  />
                </View>

                {threadHasText ? (
                  <>
                    <GlassCard style={[styles.threadSummaryCard, { marginBottom: spacing.lg }]}>
                      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>YOUR THREAD</Text>
                      {threadContextLabel ? (
                        <Text style={[styles.vzFieldHelper, { color: theme.textSecondary }]}>
                          You were: {threadContextLabel}
                        </Text>
                      ) : null}
                      {threadLastMemory.trim() ? (
                        <Text style={[styles.vzFieldHelper, { color: theme.textSecondary }]}>
                          Last clue: {threadLastMemory.trim()}
                        </Text>
                      ) : null}
                      <Text style={[styles.threadSummaryNext, { color: theme.text }]}>
                        Next: {threadText.trim()}
                      </Text>
                      <Text style={[styles.vzFieldHelper, { color: theme.textMuted }]}>
                        You do not need the rest of the plan yet.
                      </Text>
                    </GlassCard>
                    <View style={styles.actionStack}>
                      <View style={styles.compactBtn}>
                        {threadRewarded ? (
                          <GradientButton label="Continue" onPress={continueThreadComplete} small />
                        ) : (
                          <GradientButton
                            label={`I found the thread +${THREAD_XP} XP`}
                            onPress={awardThreadWin}
                            small
                          />
                        )}
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          ) : null}

          {isThreadRecoveryFlow && threadStage === 'complete' ? (
            <View style={styles.stageShell}>
              <View style={[styles.stageInner, styles.threadCompleteInner]}>
                <InternalBack label="Back to my thread" onPress={() => setThreadStage('find')} />
                <GlassCard style={styles.successCard}>
                  <Text style={[styles.successTitle, { color: theme.text }]}>There you are.</Text>
                  <Text style={[styles.successBody, { color: theme.textSecondary }]}>
                    You did not need to reconstruct everything. You found enough of the thread to
                    continue.
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={[styles.sessionStat, { color: theme.text }]}>
                      +{threadXpEarned} XP earned
                    </Text>
                    {clueSaved ? (
                      <Text style={[styles.gardenNote, { color: theme.textSecondary }]}>
                        You also left yourself a clue for next time.
                      </Text>
                    ) : null}
                  </View>
                </GlassCard>

                {!futureNoteSkipped ? (
                <View style={[styles.futureNoteBlock, { marginTop: spacing.lg }]}>
                  <Text style={[styles.taskFieldLabel, { color: theme.text }]}>
                    Before you go — leave Future You one clue?
                  </Text>
                  <Text
                    style={[
                      styles.vzFieldHelper,
                      { color: theme.textSecondary, marginBottom: spacing.sm },
                    ]}>
                    If your attention disappears again, you won’t have to rebuild the whole context.
                  </Text>
                  <TextInput
                    value={futureNoteDraft}
                    onChangeText={(value) => {
                      setFutureNoteDraft(value.slice(0, THREAD_NOTE_MAX));
                      setClueSaved(false);
                    }}
                    placeholder="Next: one visible clue"
                    placeholderTextColor={theme.textMuted}
                    maxLength={THREAD_NOTE_MAX}
                    accessibilityLabel="Note for Future You"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={saveFutureYouClue}
                    onFocus={() => setTrFocusedField('note')}
                    onBlur={() => setTrFocusedField(null)}
                    style={[
                      styles.taskInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor:
                          trFocusedField === 'note' ? theme.accent : theme.surfaceBorder,
                      },
                      trFocusedField === 'note' && styles.taskInputFocused,
                    ]}
                  />
                  {clueSaved ? (
                    <>
                      <Text
                        style={[
                          styles.vzCompletedText,
                          { color: theme.textSecondary, marginTop: spacing.sm },
                        ]}>
                        Clue saved ✓
                      </Text>
                      <Text style={[styles.vzFieldHelper, { color: theme.textMuted, marginTop: spacing.xs }]}>
                        Future You will see this the next time you lose the thread.
                      </Text>
                    </>
                  ) : (
                    <View style={[styles.actionStack, { marginTop: spacing.sm }]}>
                      <View style={styles.compactBtn}>
                        <GradientButton
                          label="Save clue for Future Me"
                          onPress={saveFutureYouClue}
                          small
                        />
                      </View>
                      <Pressable
                        onPress={() => setFutureNoteSkipped(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Skip for now"
                        style={({ pressed, focused }: PressableFocusState) => [
                          styles.quietAction,
                          pressed && styles.pressed,
                          focused && Platform.OS === 'web' ? styles.focusRing : null,
                        ]}>
                        <Text style={[styles.quietActionText, { color: theme.textMuted }]}>
                          Skip for now
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                ) : null}

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
                    onPress={() => setThreadStage('find')}
                    accessibilityRole="button"
                    accessibilityLabel="Back to my thread"
                    style={({ pressed, focused }: PressableFocusState) => [
                      styles.successLink,
                      pressed && styles.pressed,
                      focused && Platform.OS === 'web' ? styles.focusRing : null,
                    ]}>
                    <Text style={[styles.successLinkText, { color: theme.textMuted }]}>
                      Back to my thread
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
  rechargeMenuInner: {
    maxWidth: RECHARGE_MENU_MAX_WIDTH,
    alignSelf: 'center',
  },
  rechargeActiveInner: {
    maxWidth: RECHARGE_ACTIVE_MAX_WIDTH,
    alignSelf: 'center',
  },
  rechargeCompleteInner: {
    maxWidth: RECHARGE_COMPLETE_MAX_WIDTH,
    alignSelf: 'center',
  },
  messageMenuInner: {
    maxWidth: MESSAGE_LOOP_MENU_MAX_WIDTH,
    alignSelf: 'center',
  },
  messageActiveInner: {
    maxWidth: MESSAGE_LOOP_ACTIVE_MAX_WIDTH,
    alignSelf: 'center',
  },
  messageCompleteInner: {
    maxWidth: MESSAGE_LOOP_COMPLETE_MAX_WIDTH,
    alignSelf: 'center',
  },
  messageDraftInput: {
    minHeight: 140,
    paddingTop: Platform.OS === 'web' ? 12 : spacing.sm + 2,
  },
  messageUnsentInput: {
    minHeight: 180,
  },
  messageChoiceCard: {
    flex: 1,
    minHeight: 112,
    maxHeight: undefined,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 24,
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
  messageChoiceWide: {
    width: '100%',
  },
  messageChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  messageChoiceTitle: {
    ...typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  messageChoiceDesc: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  messageChoiceCheck: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  messageContextLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  messageOptionalTag: {
    ...typography.caption,
    fontWeight: '500',
  },
  messageContextInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  messageContextInput: {
    flex: 1,
    minWidth: 0,
  },
  messageContextSaveBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  messageContextSaveIcon: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  messageContextSavedCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  messageContextSavedText: {
    ...typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  messageContextEditBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  messageContextEditText: {
    ...typography.bodySmall,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  messageStopwatchBtn: {
    maxWidth: MESSAGE_LOOP_STOPWATCH_BTN_MAX,
    width: '100%',
  },
  messageStopwatchBtnDisabled: {
    opacity: 0.48,
  },
  rechargeIntroCard: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeIntroTextGroup: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  rechargeIntroTitle: {
    ...typography.h2,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '700',
  },
  rechargeIntroSupport: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  rechargeRulesCard: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.xs,
  },
  rechargeRuleText: {
    ...typography.bodySmall,
    lineHeight: 20,
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
  attentionInner: {
    maxWidth: ATTENTION_RESET_MAX_WIDTH,
    alignSelf: 'center',
  },
  attentionCompleteInner: {
    maxWidth: ATTENTION_RESET_COMPLETE_MAX_WIDTH,
    alignSelf: 'center',
  },
  attentionQuietCard: {
    width: '100%',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  attentionQuietTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    lineHeight: 20,
  },
  attentionQuietBody: {
    ...typography.caption,
    lineHeight: 18,
  },
  attentionComposer: {
    width: '100%',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  attentionComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  attentionComposerInput: {
    flex: 1,
    minWidth: 0,
  },
  attentionAddBtn: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  attentionAddBtnText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  attentionPriorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attentionPriorityChip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
  attentionPriorityChipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  attentionPriorityChipSm: {
    minHeight: 28,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
  attentionPriorityChipSmText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  attentionTaskList: {
    width: '100%',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  attentionTaskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    width: '100%',
  },
  attentionTaskMain: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    minWidth: 0,
    gap: 2,
  },
  attentionTaskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  attentionTaskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  attentionPriorityBadge: {
    minHeight: 22,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
  attentionPriorityBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  attentionActiveBadge: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  attentionDoneBadge: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  attentionTaskTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  attentionMetaText: {
    ...typography.caption,
    lineHeight: 16,
  },
  attentionActiveSupport: {
    ...typography.caption,
    lineHeight: 16,
    marginTop: 2,
  },
  attentionTaskEdit: {
    gap: spacing.xs,
  },
  attentionTaskEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attentionMarkDone: {
    minHeight: 36,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionMarkDoneText: {
    ...typography.caption,
    fontWeight: '700',
  },
  attentionDoneBanner: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  attentionKeepActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    minHeight: 36,
    paddingHorizontal: spacing.xs,
  },
  attentionKeepIcon: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  attentionKeepText: {
    ...typography.caption,
    fontWeight: '700',
  },
  attentionSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  attentionBrainDumpSave: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: 2,
  },
  attentionBrainDumpBtn: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  attentionBrainDumpBtnText: {
    ...typography.caption,
    fontWeight: '700',
  },
  attentionBrainDumpConfirm: {
    ...typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  attentionCtaBtn: {
    width: '100%',
    maxWidth: 400,
  },
  parkedHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickResetBlock: {
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  threadInner: {
    maxWidth: THREAD_RECOVERY_MAX_WIDTH,
    alignSelf: 'center',
  },
  threadCompleteInner: {
    maxWidth: THREAD_RECOVERY_COMPLETE_MAX_WIDTH,
    alignSelf: 'center',
  },
  clueCard: {
    width: '100%',
    gap: spacing.xs,
  },
  clueMainText: {
    ...typography.body,
    fontWeight: '700',
    lineHeight: 24,
  },
  threadChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  threadContextChip: {
    maxWidth: '100%',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  threadContextEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  threadContextChipText: {
    ...typography.bodySmall,
    fontWeight: '600',
    lineHeight: 20,
    flexShrink: 1,
  },
  threadSummaryCard: {
    width: '100%',
    gap: spacing.xs,
    padding: spacing.md,
  },
  threadSummaryNext: {
    ...typography.h3,
    lineHeight: 26,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  futureNoteBlock: {
    width: '100%',
    marginBottom: spacing.md,
  },
});
