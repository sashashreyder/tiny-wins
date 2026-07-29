import { AppState, UserProfile } from '@/types';
import {
  createInitialAchievements,
  createInitialRewards,
} from '@/lib/recommendations';

export const demoProfile: UserProfile = {
  id: 'demo-user',
  name: 'Demo',
  mainStruggle: 'cant-start',
  secondaryStruggles: ['low-energy'],
  energyLevel: 'low',
  supportStyle: 'tiny-steps',
  gardenVibe: 'lilac-greenhouse',
  theme: 'light',
  onboardingComplete: true,
  lowEnergyMode: true,
  reducedMotion: false,
  waterGoal: 5,
  focusDuration: 10,
  claimWithoutSpending: false,
  createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
};

export function createDemoState(): AppState {
  const now = Date.now();
  const day = (offset: number) => new Date(now - offset * 3600000).toISOString();

  return {
    userProfile: demoProfile,
    xpTotal: 142,
    xpToday: 38,
    lastXpDate: new Date().toDateString(),
    returns: 3,
    tinyWins: [
      { id: 'w1', title: 'Drank water', category: 'self-care', xp: 5, isHardToday: false, createdAt: day(1) },
      { id: 'w2', title: 'Fed pet', category: 'pet-care', xp: 5, isHardToday: false, createdAt: day(2) },
      { id: 'w3', title: 'Opened project', category: 'work-study', xp: 10, isHardToday: true, createdAt: day(3) },
      { id: 'w4', title: 'Sent one application', category: 'work-study', xp: 5, isHardToday: false, createdAt: day(4) },
      { id: 'w5', title: 'Posted one tiny video', category: 'creative', xp: 5, isHardToday: false, createdAt: day(5) },
      { id: 'w6', title: 'Washed 3 dishes', category: 'home', xp: 10, isHardToday: false, createdAt: day(6) },
      { id: 'w7', title: 'Took a walk', category: 'body-reset', xp: 5, isHardToday: false, createdAt: day(7) },
    ],
    moodEntries: [
      {
        id: 'm1',
        mood: 'foggy',
        intensity: 3,
        tags: ['sleep', 'work', 'rejection'],
        note: 'Brain feels slow but I showed up.',
        createdAt: day(2),
      },
    ],
    sleepEntries: [
      {
        id: 's1',
        bedtime: '23:30',
        sleepTime: '00:15',
        wakeTime: '07:00',
        hours: 6.8,
        quality: 3,
        wakeFeeling: 'okay',
        tags: ['late screen', 'stress'],
        createdAt: day(8),
      },
    ],
    waterEntries: [
      { id: 'wt1', amount: 1, createdAt: day(1) },
      { id: 'wt2', amount: 1, createdAt: day(3) },
      { id: 'wt3', amount: 1, createdAt: day(5) },
    ],
    rewards: createInitialRewards().map((r) =>
      r.id === 'r3' ? { ...r, unlocked: true, claimed: true } : r,
    ),
    gardenItems: [
      { id: 'g1', type: 'sprout', category: 'general', unlockedAtXp: 25, createdAt: day(24) },
      { id: 'g2', type: 'water-drop', category: 'self-care', unlockedAtXp: 50, unlockedBy: 'Drank water', createdAt: day(20) },
      { id: 'g3', type: 'desk-lamp', category: 'work-study', unlockedAtXp: 100, unlockedBy: 'Opened project', createdAt: day(12) },
    ],
    achievements: createInitialAchievements().map((a) =>
      ['a1', 'a3', 'a14'].includes(a.id)
        ? { ...a, unlocked: true, unlockedAt: day(10) }
        : a,
    ),
    brainDumpEntries: [
      {
        id: 'b1',
        mode: 'open-loops',
        text: 'Reply to email, fix thumbnail, water plants, call pharmacy',
        tags: ['work', 'home'],
        createdAt: day(4),
      },
    ],
    focusSessions: [
      {
        id: 'f1',
        title: 'Write project intro',
        duration: 10,
        result: 'started',
        distractions: ['Checked phone once'],
        xp: 15,
        createdAt: day(6),
      },
    ],
    selfCareChecks: [],
    homeCareTasks: [],
    claimedPrintables: ['p1'],
  };
}

export function createEmptyState(): AppState {
  return {
    userProfile: null,
    xpTotal: 0,
    xpToday: 0,
    lastXpDate: new Date().toDateString(),
    returns: 0,
    tinyWins: [],
    moodEntries: [],
    sleepEntries: [],
    waterEntries: [],
    rewards: createInitialRewards(),
    gardenItems: [],
    achievements: createInitialAchievements(),
    brainDumpEntries: [],
    focusSessions: [],
    selfCareChecks: [],
    homeCareTasks: [],
    claimedPrintables: [],
  };
}
