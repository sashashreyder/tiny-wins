import {
  achievementTemplates,
  gardenLevels,
  gardenStageThresholds,
  rewardTemplates,
  struggleToolPriority,
  supportiveMessages,
  tinyQuests,
  toolDefinitions,
} from '@/data/content';
import { Reward } from '@/types';
import {
  Achievement,
  AppState,
  EnergyLevel,
  FocusSession,
  GardenItem,
  GardenLevel,
  StuckType,
  TinyWin,
  TinyWinCategory,
  ToolDefinition,
  UserProfile,
} from '@/types';

export { problemOptions, toolDefinitions } from '@/data/content';

export type XPAction =
  | 'tiny-win'
  | 'hard-today-bonus'
  | 'cant-start-quest'
  | 'focus-3'
  | 'focus-5'
  | 'focus-10'
  | 'focus-25'
  | 'focus-45'
  | 'mood'
  | 'sleep'
  | 'water'
  | 'brain-dump'
  | 'close-day'
  | 'home-reset'
  | 'self-care-low-energy';

const XP_VALUES: Record<XPAction, number> = {
  'tiny-win': 5,
  'hard-today-bonus': 5,
  'cant-start-quest': 10,
  'focus-3': 8,
  'focus-5': 10,
  'focus-10': 15,
  'focus-25': 25,
  'focus-45': 25,
  mood: 5,
  sleep: 5,
  water: 3,
  'brain-dump': 8,
  'close-day': 15,
  'home-reset': 10,
  'self-care-low-energy': 10,
};

export function calculateXP(action: XPAction, extra = 0): number {
  return (XP_VALUES[action] ?? 0) + extra;
}

export function getFocusXP(minutes: number): number {
  if (minutes <= 3) return calculateXP('focus-3');
  if (minutes <= 5) return calculateXP('focus-5');
  if (minutes <= 10) return calculateXP('focus-10');
  if (minutes <= 25) return calculateXP('focus-25');
  return calculateXP('focus-45');
}

export function getRecommendedTools(profile: UserProfile | null): ToolDefinition[] {
  if (!profile) return toolDefinitions.slice(0, 6);
  const priority = struggleToolPriority[profile.mainStruggle] ?? [];
  const sorted = [...toolDefinitions].sort((a, b) => {
    const aIdx = priority.indexOf(a.id);
    const bIdx = priority.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  return sorted;
}

export interface GardenMilestoneProgress {
  currentMinXp: number;
  nextMinXp: number | null;
  nextLabel: string | null;
  progress: number;
  remainingXp: number;
  isComplete: boolean;
}

export function getGardenMilestoneProgress(xpTotal: number): GardenMilestoneProgress {
  let currentIdx = 0;
  for (let i = 0; i < gardenStageThresholds.length; i++) {
    if (xpTotal >= gardenStageThresholds[i].xp) currentIdx = i;
  }

  const current = gardenStageThresholds[currentIdx];
  const next = gardenStageThresholds[currentIdx + 1] ?? null;

  if (!next) {
    return {
      currentMinXp: current.xp,
      nextMinXp: null,
      nextLabel: null,
      progress: 1,
      remainingXp: 0,
      isComplete: true,
    };
  }

  const span = next.xp - current.xp;
  const progress =
    span > 0 ? Math.min(1, Math.max(0, (xpTotal - current.xp) / span)) : 1;

  return {
    currentMinXp: current.xp,
    nextMinXp: next.xp,
    nextLabel: next.label,
    progress,
    remainingXp: Math.max(0, next.xp - xpTotal),
    isComplete: false,
  };
}

export function getDashboardRecommendedTools(
  profile: UserProfile | null,
  primaryRoute?: string,
): ToolDefinition[] {
  const excludeRoutes = new Set(
    [primaryRoute, '/garden', '/progress'].filter(Boolean) as string[],
  );
  return getRecommendedTools(profile)
    .filter((tool) => !excludeRoutes.has(tool.route))
    .slice(0, 3);
}

export function getTinyQuests(stuckType: StuckType, _energyLevel?: EnergyLevel): string[] {
  return tinyQuests[stuckType] ?? tinyQuests['too-big'];
}

export function getSupportiveMessage(context?: string): string {
  if (context === 'start') return 'Starting counts.';
  if (context === 'low-energy') return 'A low-energy win is still a win.';
  if (context === 'return') return 'You can come back without starting over.';
  return supportiveMessages[Math.floor(Math.random() * supportiveMessages.length)];
}

export function getGardenLevel(xp: number): GardenLevel {
  let current = gardenLevels[0];
  for (const level of gardenLevels) {
    if (xp >= level.minXp) current = level;
  }
  return current;
}

export function getNextGardenLevel(xp: number): GardenLevel | null {
  const current = getGardenLevel(xp);
  const idx = gardenLevels.findIndex((l) => l.level === current.level);
  return gardenLevels[idx + 1] ?? null;
}

export function getXpToNextLevel(xp: number): number {
  const next = getNextGardenLevel(xp);
  if (!next) return 0;
  return next.minXp - xp;
}

export function getGardenStage(xp: number): string {
  let stage = gardenStageThresholds[0].label;
  for (const threshold of gardenStageThresholds) {
    if (xp >= threshold.xp) stage = threshold.label;
  }
  return stage;
}

export function getUnlockedGardenItems(state: AppState): GardenItem[] {
  return state.gardenItems;
}

export function createGardenItemForWin(
  win: TinyWin,
  xpTotal: number,
): GardenItem | null {
  const thresholds = [25, 50, 100, 150, 250, 400, 600, 900, 1200];
  const matched = thresholds.find((t) => xpTotal >= t && xpTotal - win.xp < t);
  if (!matched) return null;

  const typeMap: Partial<Record<TinyWinCategory, string>> = {
    'self-care': 'water-drop',
    home: 'stone-path',
    'work-study': 'desk-lamp',
    'social-admin': 'mail-bird',
    emotional: 'moon-star',
    'sleep-support': 'night-flower',
    creative: 'mushroom',
  };

  return {
    id: `garden-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: typeMap[win.category] ?? 'sprout',
    category: win.category,
    unlockedAtXp: matched,
    unlockedBy: win.title,
    createdAt: new Date().toISOString(),
  };
}

export function getUnlockedAchievements(state: AppState): Achievement[] {
  return state.achievements.filter((a) => a.unlocked);
}

export function checkAchievements(state: AppState, event: string): Achievement[] {
  const unlocked: Achievement[] = [];
  const now = new Date().toISOString();

  const unlock = (id: string) => {
    const achievement = state.achievements.find((a) => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = now;
      unlocked.push({ ...achievement });
    }
  };

  switch (event) {
    case 'first-tiny-win':
      unlock('a1');
      break;
    case 'cant-start-quest':
      unlock('a2');
      break;
    case 'water':
      unlock('a3');
      break;
    case 'food':
      unlock('a4');
      break;
    case 'outside':
      unlock('a5');
      break;
    case 'close-loop':
      unlock('a6');
      break;
    case 'message':
      unlock('a7');
      break;
    case 'focus-3':
      unlock('a8');
      break;
    case 'low-energy-win':
      unlock('a9');
      break;
    case 'home-reset':
      unlock('a10');
      break;
    case 'return':
      unlock('a11');
      break;
    case 'view-progress':
      unlock('a12');
      break;
    case 'sleep-log':
      unlock('a13');
      break;
    case 'garden-sprout':
      unlock('a14');
      break;
    case 'ten-wins':
      unlock('a15');
      break;
  }

  if (state.tinyWins.length >= 10) unlock('a15');
  if (state.xpTotal >= 25) unlock('a14');

  return unlocked;
}

export function getSupportModeLabel(profile: UserProfile | null): string {
  if (!profile) return 'Gentle support';
  const energyLabels: Record<string, string> = {
    'empty-battery': 'Empty Battery',
    low: 'Low Energy',
    'okay-ish': 'Okay-ish',
    restless: 'Restless',
    'wired-tired': 'Wired but Tired',
    'changes-a-lot': 'It Changes a Lot',
  };
  return energyLabels[profile.energyLevel] ?? 'Gentle support';
}

export function getPrimaryAction(profile: UserProfile | null): { label: string; route: string } {
  if (!profile) return { label: 'Try a 3-minute starter quest', route: '/cant-start' };
  const tools = getRecommendedTools(profile);
  const first = tools[0];
  return {
    label: `Try ${first.title.toLowerCase()}`,
    route: first.route,
  };
}

export function createInitialAchievements(): Achievement[] {
  return achievementTemplates.map((a) => ({ ...a, unlocked: false }));
}

export function createInitialRewards(): Reward[] {
  return rewardTemplates.map((r) => ({ ...r, unlocked: r.cost <= 30, claimed: false }));
}

export function getTodayWins(state: AppState): TinyWin[] {
  const today = new Date().toDateString();
  return state.tinyWins.filter((w) => new Date(w.createdAt).toDateString() === today);
}

export function getWeekWins(state: AppState): TinyWin[] {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return state.tinyWins.filter((w) => new Date(w.createdAt).getTime() >= weekAgo);
}

export function getTodayWaterCups(state: AppState): number {
  const today = new Date().toDateString();
  return state.waterEntries
    .filter((w) => new Date(w.createdAt).toDateString() === today)
    .reduce((sum, w) => sum + w.amount, 0);
}

export function getCategoriesTouched(state: AppState, wins: TinyWin[]): TinyWinCategory[] {
  return [...new Set(wins.map((w) => w.category))];
}

export function getFocusAttemptsToday(state: AppState): FocusSession[] {
  const today = new Date().toDateString();
  return state.focusSessions.filter((s) => new Date(s.createdAt).toDateString() === today);
}
