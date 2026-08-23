import { moodOptions } from '@/data/content';
import { dateFromDateKey, shiftDateKey, toLocalDateKey } from '@/lib/dateUtils';
import { MoodEntry, MoodType } from '@/types';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MOOD_PATTERN_MIN_ENTRIES = 3;
export const MOOD_HISTORY_PREVIEW_COUNT = 4;

export function getMoodDateKey(entry: Pick<MoodEntry, 'createdAt'> & { dateKey?: string }): string {
  if (typeof entry.dateKey === 'string') {
    const trimmed = entry.dateKey.trim();
    if (DATE_KEY_PATTERN.test(trimmed)) return trimmed;
  }
  return toLocalDateKey(entry.createdAt);
}

export function hydrateMoodEntry(entry: MoodEntry): MoodEntry {
  const dateKey = getMoodDateKey(entry);
  if (entry.dateKey === dateKey) return entry;
  return { ...entry, dateKey };
}

export function moodMeta(mood: MoodType | string): { id: string; label: string; emoji: string } {
  const match = moodOptions.find((option) => option.id === mood);
  if (match) return match;
  return { id: String(mood), label: String(mood), emoji: '💭' };
}

export function groupMoodsByDate(entries: MoodEntry[]): Record<string, MoodEntry[]> {
  const groups: Record<string, MoodEntry[]> = {};
  for (const entry of entries) {
    const key = getMoodDateKey(entry);
    const bucket = groups[key] ?? [];
    bucket.push(entry);
    groups[key] = bucket;
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const diff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (diff !== 0) return diff;
      return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
    });
  }
  return groups;
}

export function moodCountByDate(entries: MoodEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [dateKey, dayEntries] of Object.entries(groupMoodsByDate(entries))) {
    counts[dateKey] = dayEntries.length;
  }
  return counts;
}

export type MoodCount = { id: string; label: string; emoji: string; count: number };

export type MoodPatternSummary = {
  days: 7 | 30;
  count: number;
  sparse: boolean;
  averageIntensity: number | null;
  topMoods: MoodCount[];
  topFactors: { label: string; count: number }[];
  multiCheckInDays: number;
  sentences: string[];
};

function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function ranked<T>(counts: Map<string, number>, toItem: (key: string, count: number) => T): T[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => toItem(key, count));
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function entriesInWindow(entries: MoodEntry[], days: 7 | 30, todayKey: string): MoodEntry[] {
  const startKey = shiftDateKey(todayKey, -(days - 1));
  return entries.filter((entry) => {
    const key = getMoodDateKey(entry);
    return key >= startKey && key <= todayKey;
  });
}

export function summarizeMoodPatterns(
  entries: MoodEntry[],
  days: 7 | 30,
  todayKey: string,
): MoodPatternSummary {
  const inWindow = entriesInWindow(entries, days, todayKey);
  const periodLabel = days === 7 ? 'last 7 days' : 'last 30 days';

  if (inWindow.length < MOOD_PATTERN_MIN_ENTRIES) {
    return {
      days,
      count: inWindow.length,
      sparse: true,
      averageIntensity: null,
      topMoods: [],
      topFactors: [],
      multiCheckInDays: 0,
      sentences: [],
    };
  }

  const moodCounts = ranked(countBy(inWindow, (entry) => entry.mood), (id, count) => {
    const meta = moodMeta(id);
    return { id, label: meta.label, emoji: meta.emoji, count };
  });

  const factorCounts = ranked(
    countBy(
      inWindow.flatMap((entry) => entry.tags ?? []),
      (tag) => tag.trim().toLowerCase(),
    ),
    (label, count) => ({ label, count }),
  );

  const byDate = groupMoodsByDate(inWindow);
  const multiCheckInDays = Object.values(byDate).filter((day) => day.length > 1).length;

  const intensitySum = inWindow.reduce((sum, entry) => sum + (entry.intensity ?? 0), 0);
  const averageIntensity = roundOne(intensitySum / inWindow.length);

  const sentences: string[] = [];
  const topMood = moodCounts[0];
  if (topMood) {
    const times = topMood.count === 1 ? 'once' : `${topMood.count} times`;
    sentences.push(`${topMood.label} showed up ${times} in the ${periodLabel}.`);
  }
  const topFactor = factorCounts[0];
  if (topFactor) {
    sentences.push(
      `${capitalize(topFactor.label)} was selected in ${topFactor.count} ${
        topFactor.count === 1 ? 'check-in' : 'check-ins'
      }.`,
    );
  }
  sentences.push(`Your average logged intensity was ${formatIntensity(averageIntensity)} / 5.`);

  return {
    days,
    count: inWindow.length,
    sparse: false,
    averageIntensity,
    topMoods: moodCounts.slice(0, 3),
    topFactors: factorCounts.slice(0, 3),
    multiCheckInDays,
    sentences,
  };
}

export type IntensityTrendPoint = {
  dateKey: string;
  weekday: string;
  average: number | null;
  count: number;
};

export function getIntensityTrend(
  entries: MoodEntry[],
  days: number,
  todayKey: string,
): IntensityTrendPoint[] {
  const groups = groupMoodsByDate(entries);
  const points: IntensityTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dateKey = shiftDateKey(todayKey, -offset);
    const dayEntries = groups[dateKey] ?? [];
    const date = dateFromDateKey(dateKey);
    const average =
      dayEntries.length > 0
        ? roundOne(
            dayEntries.reduce((sum, entry) => sum + (entry.intensity ?? 0), 0) / dayEntries.length,
          )
        : null;
    points.push({
      dateKey,
      weekday: date
        ? date.toLocaleDateString(undefined, { weekday: 'narrow' })
        : '',
      average,
      count: dayEntries.length,
    });
  }

  return points;
}

export function formatIntensity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
