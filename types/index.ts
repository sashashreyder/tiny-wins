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
  | 'sad'
  | 'anxious'
  | 'irritated'
  | 'foggy'
  | 'wired'
  | 'tired'
  | 'restless'
  | 'hopeful'
  | 'proud'
  | 'overwhelmed'
  | 'empty';

export type WakeFeeling =
  | 'refreshed'
  | 'okay'
  | 'heavy'
  | 'anxious'
  | 'foggy'
  | 'wired';

export type FocusResult =
  | 'started'
  | 'progress'
  | 'finished'
  | 'stuck'
  | 'came-back';

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
  mood: MoodType;
  intensity: number;
  tags: string[];
  note?: string;
  createdAt: string;
}

export interface SleepEntry {
  id: string;
  bedtime: string;
  sleepTime: string;
  wakeTime: string;
  hours: number;
  quality: number;
  wakeFeeling: WakeFeeling;
  tags: string[];
  note?: string;
  createdAt: string;
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

export interface FocusSession {
  id: string;
  title: string;
  duration: number;
  result?: FocusResult;
  distractions: string[];
  xp: number;
  createdAt: string;
}

export interface SelfCareCheck {
  id: string;
  label: string;
  done: boolean;
  date: string;
}

export interface HomeCareTask {
  id: string;
  zone: string;
  label: string;
  done: boolean;
  date: string;
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
  focusSessions: FocusSession[];
  selfCareChecks: SelfCareCheck[];
  homeCareTasks: HomeCareTask[];
  claimedPrintables: string[];
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
