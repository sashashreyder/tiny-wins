import { moodOptions } from '@/data/content';
import { dateFromDateKey, shiftDateKey, toLocalDateKey } from '@/lib/dateUtils';
import { moodStateLabel } from '@/lib/moodState';
import { MoodEntry, MoodType } from '@/types';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MOOD_PATTERN_MIN_ENTRIES = 3;
export const MOOD_HISTORY_PREVIEW_COUNT = 4;
const COOCCURRENCE_MIN = 3;

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

/** `moods: []` means none chosen. Missing `moods` means a legacy single-mood entry. */
export function getEntryMoods(entry: Pick<MoodEntry, 'mood' | 'moods'>): MoodType[] {
  if (Array.isArray(entry.moods)) return entry.moods.filter(Boolean);
  return entry.mood ? [entry.mood] : [];
}

export function factorLabel(tag: string): string {
  const value = tag.trim().toLowerCase();
  if (value === 'unknown') return 'not sure';
  if (value === 'too much waiting') return 'waiting';
  if (value === 'social') return 'social life';
  return tag;
}

export function formatMoodList(entry: Pick<MoodEntry, 'mood' | 'moods'>): string {
  return getEntryMoods(entry)
    .map((id) => moodMeta(id).label)
    .join(', ');
}

export function moodMeta(mood: MoodType | string): { id: string; label: string; emoji: string } {
  const match = moodOptions.find((option) => option.id === mood);
  if (match) return { id: match.id, label: match.label, emoji: match.emoji ?? '' };
  return { id: String(mood), label: String(mood), emoji: '' };
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
  topMoods: MoodCount[];
  topFactors: { label: string; count: number }[];
  multiCheckInDays: number;
  overallStateLabel: string | null;
  cooccurrence: string[];
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

  if (inWindow.length < MOOD_PATTERN_MIN_ENTRIES) {
    return {
      days,
      count: inWindow.length,
      sparse: true,
      topMoods: [],
      topFactors: [],
      multiCheckInDays: 0,
      overallStateLabel: null,
      cooccurrence: [],
    };
  }

  const moodCounts = ranked(
    countBy(
      inWindow.flatMap((entry) => getEntryMoods(entry)),
      (id) => id,
    ),
    (id, count) => {
      const meta = moodMeta(id);
      return { id, label: meta.label, emoji: meta.emoji, count };
    },
  );

  const factorCounts = ranked(
    countBy(
      inWindow.flatMap((entry) => entry.tags ?? []),
      (tag) => factorLabel(tag).trim().toLowerCase(),
    ),
    (label, count) => ({ label, count }),
  );

  const byDate = groupMoodsByDate(inWindow);
  const multiCheckInDays = Object.values(byDate).filter((day) => day.length > 1).length;

  const scored = inWindow.filter(
    (entry) => typeof entry.stateScore === 'number' && Number.isFinite(entry.stateScore),
  );
  const overallStateLabel =
    scored.length > 0
      ? `Mostly ${moodStateLabel(
          scored.reduce((sum, entry) => sum + (entry.stateScore ?? 0), 0) / scored.length,
        ).toLowerCase()}`
      : null;

  const pairCounts = countBy(
    inWindow.flatMap((entry) => {
      const moods = getEntryMoods(entry);
      const tags = (entry.tags ?? []).map(factorLabel);
      const pairs: string[] = [];
      for (const mood of moods) {
        for (const tag of tags) {
          if (!tag || tag === 'not sure') continue;
          pairs.push(`${mood}||${tag}`);
        }
      }
      for (let i = 0; i < moods.length; i += 1) {
        for (let j = i + 1; j < moods.length; j += 1) {
          pairs.push(`${moods[i]}++${moods[j]}`);
        }
      }
      return pairs;
    }),
    (key) => key,
  );

  const cooccurrence: string[] = [];
  for (const item of ranked(pairCounts, (pair, count) => ({ pair, count }))) {
    if (item.count < COOCCURRENCE_MIN) continue;
    if (item.pair.includes('||')) {
      const [moodId, tag] = item.pair.split('||');
      cooccurrence.push(`${moodMeta(moodId).label} was logged with ${tag} ${item.count} times.`);
    } else if (item.pair.includes('++')) {
      const [a, b] = item.pair.split('++');
      cooccurrence.push(
        `${moodMeta(a).label} and ${moodMeta(b).label} appeared together ${item.count} times.`,
      );
    }
    if (cooccurrence.length >= 3) break;
  }

  return {
    days,
    count: inWindow.length,
    sparse: false,
    topMoods: moodCounts.slice(0, 3),
    topFactors: factorCounts.slice(0, 3),
    multiCheckInDays,
    overallStateLabel,
    cooccurrence,
  };
}

export type StateTrendPoint = {
  dateKey: string;
  weekday: string;
  average: number | null;
  count: number;
};

export function getStateTrend(
  entries: MoodEntry[],
  days: number,
  todayKey: string,
): StateTrendPoint[] {
  const groups = groupMoodsByDate(entries);
  const points: StateTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dateKey = shiftDateKey(todayKey, -offset);
    const scored = (groups[dateKey] ?? []).filter(
      (entry) => typeof entry.stateScore === 'number' && Number.isFinite(entry.stateScore),
    );
    const date = dateFromDateKey(dateKey);
    points.push({
      dateKey,
      weekday: date ? date.toLocaleDateString(undefined, { weekday: 'narrow' }) : '',
      average:
        scored.length > 0
          ? roundOne(
              scored.reduce((sum, entry) => sum + (entry.stateScore ?? 0), 0) / scored.length,
            )
          : null,
      count: scored.length,
    });
  }

  return points;
}
