export type ThemeMode = 'light' | 'dark' | 'system';

export type StruggleId =
  | 'cant-start'
  | 'procrastinating'
  | 'overwhelmed'
  | 'cant-focus'
  | 'switching-tasks'
  | 'low-energy'
  | 'sleep-mess'
  | 'forget-self-care'
  | 'home-chaotic'
  | 'lose-progress'
  | 'need-rewards'
  | 'open-loops';

export type EnergyLevel =
  | 'empty-battery'
  | 'low'
  | 'okay-ish'
  | 'restless'
  | 'wired-tired'
  | 'changes-a-lot';

export type SupportStyle =
  | 'tiny-steps'
  | 'quick-plan'
  | 'reward'
  | 'calm-down'
  | 'proof'
  | 'routines';

export type GardenVibe =
  | 'cozy-night'
  | 'lilac-greenhouse'
  | 'space-planet'
  | 'magic-desk';

export type TinyWinCategory =
  | 'self-care'
  | 'home'
  | 'work-study'
  | 'social-admin'
  | 'pet-care'
  | 'body-reset'
  | 'emotional'
  | 'creative'
  | 'sleep-support';

export type StuckType =
  | 'too-big'
  | 'no-beginning'
  | 'scared-bad'
  | 'bored'
  | 'tired'
  | 'avoiding-message'
  | 'opened-everything'
  | 'forgot-what';

export interface StuckTypeOption {
  id: StuckType;
  label: string;
  emoji: string;
  hint: string;
}

export type MoodType =
  | 'okay-ish'
  | 'calm'
  | 'content'
  | 'hopeful'
  | 'proud'
  | 'grateful'
  | 'relieved'
  | 'excited'
  | 'energized'
  | 'confident'
  | 'connected'
  | 'motivated'
  | 'curious'
  | 'happy'
  | 'playful'
  | 'sad'
  | 'anxious'
  | 'worried'
  | 'frustrated'
  | 'irritated'
  | 'angry'
  | 'lonely'
  | 'disappointed'
  | 'rejected'
  | 'guilty'
  | 'overwhelmed'
  | 'empty'
  | 'stressed'
  | 'scared'
  | 'tired'
  | 'foggy'
  | 'numb'
  | 'restless'
  | 'wired'
  | 'distracted'
  | 'uncertain'
  | 'bored'
  | 'detached'
  | 'surprised'
  | 'thoughtful';

export type WakeFeeling =
  | 'refreshed'
  | 'okay'
  | 'sleepy'
  | 'heavy'
  | 'foggy'
  | 'anxious'
  | 'wired'
  | 'restless'
  | 'irritable'
  | 'low-energy'
  | 'headache'
  | 'groggy';

export type SleepSessionType = 'main' | 'nap';

export type FocusResult =
  | 'started'
  | 'progress'
  | 'finished'
  | 'stuck'
  | 'came-back'
  | 'couldnt-start';

export type BrainDumpMode =
  | 'brain-dump'
  | 'open-loops'
  | 'scary-thought'
  | 'idea-parking'
  | 'tomorrow-bridge'
  | 'rejection'
  | 'sleep-closing';

export type ToolCategory =
  | 'start'
  | 'focus'
  | 'calm'
  | 'self-care'
  | 'sleep'
  | 'home'
  | 'rewards'
  | 'reflect'
  | 'low-energy';

export interface UserProfile {
  id: string;
  name?: string;
  mainStruggle: StruggleId;
  secondaryStruggles: StruggleId[];
  energyLevel: EnergyLevel;
  supportStyle: SupportStyle;
  supportStyles: SupportStyle[];
  gardenVibe: GardenVibe;
  theme: ThemeMode;
  onboardingComplete: boolean;
  lowEnergyMode: boolean;
  reducedMotion: boolean;
  waterGoal: number;
  focusDuration: number;
  claimWithoutSpending: boolean;
  createdAt: string;
}

export interface TinyWin {
  id: string;
  title: string;
  category: TinyWinCategory;
  xp: number;
  isHardToday: boolean;
  note?: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  /** First selected descriptor, or a safe fallback when none were chosen. */
  mood: MoodType;
  /** Selected descriptors. `[]` means none chosen. Omitted on older entries. */
  moods?: MoodType[];
  /** Overall state from -3 (very unpleasant) to +3 (very pleasant). New entries. */
  stateScore?: number;
  /** Legacy 1–5 intensity. Older entries may have this; new entries usually omit it. */
  intensity?: number;
  /** Impact tags. */
  tags: string[];
  note?: string;
  createdAt: string;
  /** Local calendar day as YYYY-MM-DD. Older persisted entries may omit this. */
  dateKey?: string;
}

export interface SleepEntry {
  id: string;
  /**
   * Session kind. Omitted on older entries — treat missing as `'main'`.
   * Multiple sessions may share the same local wake date.
   */
  type?: SleepSessionType;
  /** Legacy HH:MM bedtime. Empty string when went-to-bed was skipped. */
  bedtime: string;
  /** Legacy HH:MM fall-asleep time. Prefer `fellAsleepAt` when present. */
  sleepTime: string;
  /** Legacy HH:MM wake time. Prefer `wokeAt` when present. */
  wakeTime: string;
  /**
   * Legacy duration in hours (may be manually typed on old entries).
   * Prefer `durationMinutes` when present.
   */
  hours: number;
  /** ISO datetime. Omitted on older entries. */
  wentToBedAt?: string;
  /** ISO datetime for sleep start. Omitted on older entries. */
  fellAsleepAt?: string;
  /** ISO datetime for sleep end. Omitted on older entries. */
  wokeAt?: string;
  /** Calculated duration. Omitted on older entries. */
  durationMinutes?: number;
  /** 1–5 self-reported quality. Not a clinical score. */
  quality: number;
  /** First selected wake feeling, or a fallback when none were chosen. */
  wakeFeeling: WakeFeeling;
  /** Selected wake feelings. `[]` means none chosen. Omitted on older entries. */
  wakeFeelings?: WakeFeeling[];
  /** Context tags / factors. Older entries may include `'unknown'` or `'melatonin'`. */
  tags: string[];
  /** Alias of `tags` on newer entries. Prefer `tags` when reading. */
  factors?: string[];
  note?: string;
  createdAt: string;
  /**
   * Local calendar day the user woke up, as YYYY-MM-DD.
   * History groups by this date. Older persisted entries may omit it.
   */
  dateKey?: string;
}

export interface WaterEntry {
  id: string;
  amount: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  category: string;
  icon: string;
  unlocked: boolean;
  claimed: boolean;
  isCustom: boolean;
  description?: string;
}

export interface GardenItem {
  id: string;
  type: string;
  category: TinyWinCategory | 'general';
  unlockedAtXp: number;
  unlockedBy?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface BrainDumpEntry {
  id: string;
  mode: BrainDumpMode;
  text: string;
  tags: string[];
  createdAt: string;
}

export interface ComebackNote {
  text: string;
  context?: string;
  createdAt: string;
}

export interface FocusDistraction {
  id: string;
  text: string;
  createdAt: string;
}

/** Legacy sessions stored plain strings; new sprints store FocusDistraction objects. */
export type FocusDistractionEntry = string | FocusDistraction;

export interface FocusSession {
  id: string;
  title: string;
  duration: number;
  result?: FocusResult;
  /** Present on new sprints. Historical sessions may omit this or store plain strings. */
  distractions?: FocusDistractionEntry[];
  xp: number;
  createdAt: string;
}

export interface SelfCareCheck {
  id: string;
  label: string;
  done: boolean;
  date: string;
  /** Present on newly created records. Historical items may only have `date`. */
  createdAt?: string;
}

export interface HomeCareTask {
  id: string;
  zone: string;
  label: string;
  done: boolean;
  date: string;
  /** Present on newly created records. Historical items may only have `date`. */
  createdAt?: string;
}

export type ActivitySource =
  | 'tiny-win'
  | 'water'
  | 'sleep'
  | 'mood'
  | 'focus'
  | 'self-care'
  | 'home-care';

/** Derived progress row. Never persisted — build from existing source collections. */
export interface ActivityEntry {
  id: string;
  source: ActivitySource;
  title: string;
  /** Local calendar day as YYYY-MM-DD. */
  dateKey: string;
  createdAt?: string;
  xp?: number;
  category?: string;
  note?: string;
}

export interface DayMetadata {
  isHardDay: boolean;
  updatedAt: string;
}

export interface AppState {
  userProfile: UserProfile | null;
  xpTotal: number;
  xpToday: number;
  lastXpDate: string;
  returns: number;
  tinyWins: TinyWin[];
  moodEntries: MoodEntry[];
  sleepEntries: SleepEntry[];
  waterEntries: WaterEntry[];
  rewards: Reward[];
  gardenItems: GardenItem[];
  achievements: Achievement[];
  brainDumpEntries: BrainDumpEntry[];
  latestComebackNote: ComebackNote | null;
  focusSessions: FocusSession[];
  selfCareChecks: SelfCareCheck[];
  homeCareTasks: HomeCareTask[];
  claimedPrintables: string[];
  /** Local YYYY-MM-DD keys. Missing on older persisted users — treat as {}. */
  dayMetadata: Record<string, DayMetadata>;
}

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  bestFor: string;
  estimatedTime: string;
  category: ToolCategory;
  route: string;
  icon: string;
}

export interface ProblemOption {
  id: StruggleId;
  label: string;
  emoji: string;
}

export interface GardenLevel {
  level: number;
  name: string;
  minXp: number;
}
