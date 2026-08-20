import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createDemoState, createEmptyState } from '@/data/demoData';
import {
  calculateXP,
  checkAchievements,
  createGardenItemForWin,
  getFocusXP,
} from '@/lib/recommendations';
import {
  AppState,
  BrainDumpEntry,
  ComebackNote,
  FocusResult,
  FocusSession,
  MoodEntry,
  Reward,
  SleepEntry,
  StuckType,
  TinyWin,
  TinyWinCategory,
  UserProfile,
} from '@/types';

interface AppActions {
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (profile: UserProfile) => void;
  loadDemoData: () => void;
  resetData: () => void;
  addXP: (amount: number, source?: string) => void;
  spendXP: (amount: number) => boolean;
  addTinyWin: (title: string, category: TinyWinCategory, isHardToday?: boolean, note?: string) => void;
  completeCantStartQuest: (quest: string, stuckType: StuckType) => void;
  addMood: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => void;
  addSleep: (entry: Omit<SleepEntry, 'id' | 'createdAt'>) => void;
  addWater: (amount?: number) => void;
  addBrainDump: (entry: Omit<BrainDumpEntry, 'id' | 'createdAt'>) => void;
  addParkedThoughts: (texts: string[]) => number;
  setComebackNote: (note: ComebackNote) => void;
  clearComebackNote: () => void;
  completeFocus: (session: Omit<FocusSession, 'id' | 'createdAt' | 'xp'>, result: FocusResult) => void;
  toggleSelfCare: (label: string) => void;
  toggleHomeTask: (zone: string, label: string) => void;
  claimReward: (rewardId: string) => void;
  unlockPrintable: (printableId: string) => void;
  addCustomReward: (reward: Omit<Reward, 'id' | 'unlocked' | 'claimed' | 'isCustom'>) => void;
  recordReturn: () => void;
  markAchievementEvent: (event: string) => void;
}

type AppStore = AppState & AppActions;

function todayString() {
  return new Date().toDateString();
}

function resetDailyXp(state: AppState): Partial<AppState> {
  if (state.lastXpDate !== todayString()) {
    return { xpToday: 0, lastXpDate: todayString() };
  }
  return {};
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createEmptyState(),

      setProfile: (profile) => set({ userProfile: profile }),

      updateProfile: (updates) =>
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...updates }
            : null,
        })),

      completeOnboarding: (profile) =>
        set({
          userProfile: { ...profile, onboardingComplete: true },
          returns: 1,
        }),

      loadDemoData: () => set(createDemoState()),

      resetData: () => set(createEmptyState()),

      addXP: (amount, _source) =>
        set((state) => {
          const daily = resetDailyXp(state);
          return {
            ...daily,
            xpTotal: state.xpTotal + amount,
            xpToday: (daily.xpToday ?? state.xpToday) + amount,
          };
        }),

      spendXP: (amount) => {
        const state = get();
        if (state.userProfile?.claimWithoutSpending) return true;
        if (state.xpTotal < amount) return false;
        set({ xpTotal: state.xpTotal - amount });
        return true;
      },

      addTinyWin: (title, category, isHardToday = false, note) => {
        const state = get();
        let xp = calculateXP('tiny-win');
        if (isHardToday) xp += calculateXP('hard-today-bonus');
        if (state.userProfile?.lowEnergyMode && category === 'self-care') {
          xp += calculateXP('self-care-low-energy');
        }

        const win: TinyWin = {
          id: `win-${Date.now()}`,
          title,
          category,
          xp,
          isHardToday,
          note,
          createdAt: new Date().toISOString(),
        };

        const gardenItem = createGardenItemForWin(win, state.xpTotal + xp);
        const achievements = checkAchievements(
          { ...state, tinyWins: [...state.tinyWins, win], xpTotal: state.xpTotal + xp },
          state.tinyWins.length === 0 ? 'first-tiny-win' : 'tiny-win',
        );

        set((s) => {
          const daily = resetDailyXp(s);
          return {
            ...daily,
            tinyWins: [...s.tinyWins, win],
            xpTotal: s.xpTotal + xp,
            xpToday: (daily.xpToday ?? s.xpToday) + xp,
            gardenItems: gardenItem ? [...s.gardenItems, gardenItem] : s.gardenItems,
            achievements: s.achievements.map((a) => {
              const unlocked = achievements.find((u) => u.id === a.id);
              return unlocked ?? a;
            }),
          };
        });

        if (title.toLowerCase().includes('water')) get().markAchievementEvent('water');
        if (title.toLowerCase().includes('ate') || title.toLowerCase().includes('food')) {
          get().markAchievementEvent('food');
        }
        if (title.toLowerCase().includes('outside') || title.toLowerCase().includes('walk')) {
          get().markAchievementEvent('outside');
        }
        if (title.toLowerCase().includes('message') || title.toLowerCase().includes('email')) {
          get().markAchievementEvent('message');
        }
      },

      completeCantStartQuest: (quest, _stuckType) => {
        get().addTinyWin(quest.slice(0, 80) || 'Started while stuck', 'work-study', true);
        get().markAchievementEvent('cant-start-quest');
      },

      addMood: (entry) => {
        const mood: MoodEntry = {
          ...entry,
          id: `mood-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        get().addXP(calculateXP('mood'));
        set((s) => ({ moodEntries: [...s.moodEntries, mood] }));
      },

      addSleep: (entry) => {
        const sleep: SleepEntry = {
          ...entry,
          id: `sleep-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        get().addXP(calculateXP('sleep'));
        get().markAchievementEvent('sleep-log');
        set((s) => ({ sleepEntries: [...s.sleepEntries, sleep] }));
      },

      addWater: (amount = 1) => {
        const entry = { id: `water-${Date.now()}`, amount, createdAt: new Date().toISOString() };
        get().addXP(calculateXP('water'));
        get().markAchievementEvent('water');
        set((s) => ({ waterEntries: [...s.waterEntries, entry] }));
      },

      addBrainDump: (entry) => {
        const dump: BrainDumpEntry = {
          ...entry,
          id: `dump-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        get().addXP(calculateXP('brain-dump'));
        if (entry.mode === 'open-loops') get().markAchievementEvent('close-loop');
        set((s) => ({ brainDumpEntries: [...s.brainDumpEntries, dump] }));
      },

      addParkedThoughts: (texts) => {
        const existing = new Set(
          get().brainDumpEntries.flatMap((entry) =>
            entry.text
              .split(/[\n,;]+/)
              .map((piece) => piece.trim().toLowerCase())
              .filter(Boolean),
          ),
        );
        const unique = texts
          .map((text) => text.trim())
          .filter((text) => text.length > 0 && !existing.has(text.toLowerCase()));
        if (unique.length === 0) return 0;

        const createdAt = new Date().toISOString();
        const dump: BrainDumpEntry = {
          id: `dump-${Date.now()}`,
          mode: 'idea-parking',
          text: unique.join('\n'),
          tags: [],
          createdAt,
        };
        set((s) => ({ brainDumpEntries: [...s.brainDumpEntries, dump] }));
        return unique.length;
      },

      setComebackNote: (note) => set({ latestComebackNote: note }),

      clearComebackNote: () => set({ latestComebackNote: null }),

      completeFocus: (session, result) => {
        const xp = getFocusXP(session.duration);
        const full: FocusSession = {
          ...session,
          result,
          xp,
          id: `focus-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        get().addXP(xp);
        if (session.duration <= 3) get().markAchievementEvent('focus-3');
        set((s) => ({ focusSessions: [...s.focusSessions, full] }));
      },

      toggleSelfCare: (label) => {
        const today = todayString();
        set((s) => {
          const existing = s.selfCareChecks.find(
            (c) => c.label === label && c.date === today,
          );
          if (existing) {
            return {
              selfCareChecks: s.selfCareChecks.map((c) =>
                c.id === existing.id ? { ...c, done: !c.done } : c,
              ),
            };
          }
          const check = {
            id: `sc-${Date.now()}`,
            label,
            done: true,
            date: today,
          };
          get().addXP(
            s.userProfile?.lowEnergyMode
              ? calculateXP('self-care-low-energy')
              : calculateXP('tiny-win'),
          );
          if (s.userProfile?.lowEnergyMode) get().markAchievementEvent('low-energy-win');
          return { selfCareChecks: [...s.selfCareChecks, check] };
        });
      },

      toggleHomeTask: (zone, label) => {
        const today = todayString();
        set((s) => {
          const existing = s.homeCareTasks.find(
            (t) => t.zone === zone && t.label === label && t.date === today,
          );
          if (existing) {
            return {
              homeCareTasks: s.homeCareTasks.map((t) =>
                t.id === existing.id ? { ...t, done: !t.done } : t,
              ),
            };
          }
          const task = {
            id: `hc-${Date.now()}`,
            zone,
            label,
            done: true,
            date: today,
          };
          get().addXP(calculateXP('home-reset'));
          get().markAchievementEvent('home-reset');
          return { homeCareTasks: [...s.homeCareTasks, task] };
        });
      },

      claimReward: (rewardId) =>
        set((s) => {
          const reward = s.rewards.find((r) => r.id === rewardId);
          if (!reward) return s;
          if (!s.userProfile?.claimWithoutSpending && s.xpTotal < reward.cost) return s;
          return {
            xpTotal: s.userProfile?.claimWithoutSpending
              ? s.xpTotal
              : s.xpTotal - reward.cost,
            rewards: s.rewards.map((r) =>
              r.id === rewardId ? { ...r, claimed: true, unlocked: true } : r,
            ),
          };
        }),

      unlockPrintable: (printableId) =>
        set((s) => ({
          claimedPrintables: s.claimedPrintables.includes(printableId)
            ? s.claimedPrintables
            : [...s.claimedPrintables, printableId],
        })),

      addCustomReward: (reward) =>
        set((s) => ({
          rewards: [
            ...s.rewards,
            {
              ...reward,
              id: `custom-${Date.now()}`,
              unlocked: true,
              claimed: false,
              isCustom: true,
            },
          ],
        })),

      recordReturn: () =>
        set((s) => {
          get().markAchievementEvent('return');
          return { returns: s.returns + 1 };
        }),

      markAchievementEvent: (event) =>
        set((s) => {
          const unlocked = checkAchievements(s, event);
          if (unlocked.length === 0) return s;
          return {
            achievements: s.achievements.map((a) => {
              const match = unlocked.find((u) => u.id === a.id);
              return match ?? a;
            }),
          };
        }),
    }),
    {
      name: 'tiny-wins-garden-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as AppStore) };
        if (merged.userProfile && !merged.userProfile.supportStyles?.length) {
          merged.userProfile = {
            ...merged.userProfile,
            supportStyles: [merged.userProfile.supportStyle],
          };
        }
        if (merged.latestComebackNote === undefined) {
          merged.latestComebackNote = null;
        }
        return merged;
      },
    },
  ),
);
