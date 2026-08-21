import { moodOptions } from '@/data/content';
import { startOfLocalDayMs, toLocalDateKey } from '@/lib/dateUtils';
import {
  ActivityEntry,
  ActivitySource,
  AppState,
  FocusResult,
  HomeCareTask,
  MoodType,
  SelfCareCheck,
} from '@/types';

export type ActivityTimelineState = Pick<
  AppState,
  | 'tinyWins'
  | 'waterEntries'
  | 'sleepEntries'
  | 'moodEntries'
  | 'focusSessions'
  | 'selfCareChecks'
  | 'homeCareTasks'
>;

export const activitySourceLabels: Record<ActivitySource, string> = {
  'tiny-win': 'Win',
  water: 'Water',
  sleep: 'Sleep',
  mood: 'Mood',
  focus: 'Focus',
  'self-care': 'Self-care',
  'home-care': 'Home',
};

function meaningfulXp(xp: number | undefined): number | undefined {
  if (typeof xp !== 'number' || !Number.isFinite(xp) || xp <= 0) return undefined;
  return xp;
}

function formatSleepTitle(hours: number): string {
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0) {
    return 'Logged sleep';
  }
  const rounded = Math.round(hours * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `Slept ${display} hours`;
}

function formatWaterTitle(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 1) {
    return 'Drank water';
  }
  return `Drank water × ${amount}`;
}

function moodLabel(mood: MoodType): string | undefined {
  return moodOptions.find((option) => option.id === mood)?.label;
}

function formatMoodTitle(mood: MoodType): string {
  const label = moodLabel(mood);
  return label ? `Checked in with my mood — ${label}` : 'Checked in with my mood';
}

function formatFocusTitle(duration: number): string {
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) {
    return 'Focus session';
  }
  return `Focused for ${duration} min`;
}

function formatFocusResult(result?: FocusResult): string | undefined {
  if (!result) return undefined;
  switch (result) {
    case 'started':
      return 'Started';
    case 'progress':
      return 'Made progress';
    case 'finished':
      return 'Finished';
    case 'stuck':
      return 'Got stuck';
    case 'came-back':
      return 'Came back';
    default:
      return undefined;
  }
}

function dateKeyFromTimestampOrDate(createdAt: string | undefined, date: string): string {
  if (createdAt) return toLocalDateKey(createdAt);
  return toLocalDateKey(date);
}

function fromSelfCare(check: SelfCareCheck): ActivityEntry {
  return {
    id: `self-care:${check.id}`,
    source: 'self-care',
    title: check.label,
    dateKey: dateKeyFromTimestampOrDate(check.createdAt, check.date),
    createdAt: check.createdAt,
  };
}

function fromHomeCare(task: HomeCareTask): ActivityEntry {
  return {
    id: `home-care:${task.id}`,
    source: 'home-care',
    title: task.label,
    dateKey: dateKeyFromTimestampOrDate(task.createdAt, task.date),
    createdAt: task.createdAt,
    category: task.zone,
  };
}

function sortTime(entry: ActivityEntry): number {
  if (entry.createdAt) {
    const timestamp = Date.parse(entry.createdAt);
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return startOfLocalDayMs(entry.dateKey);
}

function sortTimeline(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort((a, b) => {
    const diff = sortTime(b) - sortTime(a);
    if (diff !== 0) return diff;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/** Pure derived timeline. Does not mutate source collections or award XP. */
export function buildActivityTimeline(state: ActivityTimelineState): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const win of state.tinyWins ?? []) {
    entries.push({
      id: `tiny-win:${win.id}`,
      source: 'tiny-win',
      title: win.title,
      dateKey: toLocalDateKey(win.createdAt),
      createdAt: win.createdAt,
      xp: meaningfulXp(win.xp),
      category: win.category,
      note: win.note,
    });
  }

  for (const entry of state.waterEntries ?? []) {
    entries.push({
      id: `water:${entry.id}`,
      source: 'water',
      title: formatWaterTitle(entry.amount),
      dateKey: toLocalDateKey(entry.createdAt),
      createdAt: entry.createdAt,
    });
  }

  for (const entry of state.sleepEntries ?? []) {
    entries.push({
      id: `sleep:${entry.id}`,
      source: 'sleep',
      title: formatSleepTitle(entry.hours),
      dateKey: toLocalDateKey(entry.createdAt),
      createdAt: entry.createdAt,
    });
  }

  for (const entry of state.moodEntries ?? []) {
    entries.push({
      id: `mood:${entry.id}`,
      source: 'mood',
      title: formatMoodTitle(entry.mood),
      dateKey: toLocalDateKey(entry.createdAt),
      createdAt: entry.createdAt,
      category: moodLabel(entry.mood),
      note: entry.note,
    });
  }

  for (const session of state.focusSessions ?? []) {
    entries.push({
      id: `focus:${session.id}`,
      source: 'focus',
      title: formatFocusTitle(session.duration),
      dateKey: toLocalDateKey(session.createdAt),
      createdAt: session.createdAt,
      xp: meaningfulXp(session.xp),
      note: formatFocusResult(session.result),
    });
  }

  for (const check of state.selfCareChecks ?? []) {
    if (!check.done) continue;
    entries.push(fromSelfCare(check));
  }

  for (const task of state.homeCareTasks ?? []) {
    if (!task.done) continue;
    entries.push(fromHomeCare(task));
  }

  return sortTimeline(entries);
}

export function groupActivitiesByDate(
  entries: ActivityEntry[],
): Record<string, ActivityEntry[]> {
  const groups: Record<string, ActivityEntry[]> = {};
  for (const entry of entries) {
    const bucket = groups[entry.dateKey] ?? [];
    bucket.push(entry);
    groups[entry.dateKey] = bucket;
  }
  return groups;
}
