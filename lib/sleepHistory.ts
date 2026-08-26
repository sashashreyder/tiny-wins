import { wakeFeelings } from '@/data/content';
import { dateFromDateKey, shiftDateKey, toLocalDateKey } from '@/lib/dateUtils';
import { SleepEntry, SleepSessionType, WakeFeeling } from '@/types';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const MINUTES_PER_DAY = 24 * 60;

export const SLEEP_PATTERN_MIN_MAIN = 3;
export const SLEEP_QUALITY_MIN = 1;
export const SLEEP_QUALITY_MAX = 5;

export const QUALITY_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Not great',
  3: 'Okay',
  4: 'Good',
  5: 'Restful',
};

export type ParsedClock = { hours: number; minutes: number; totalMinutes: number };

export type SleepDraft = {
  type: SleepSessionType;
  wentToBed: string;
  fellAsleep: string;
  woke: string;
  quality: number;
  wakeFeelings: WakeFeeling[];
  factors: string[];
  note: string;
  /** Local date the user woke up. History groups by this day. */
  wakeDateKey: string;
};

/**
 * History grouping rule:
 * A sleep session belongs to the local calendar date on which the user woke up.
 *
 * Overnight example: fell asleep Aug 25 23:30, woke Aug 26 07:00 → dateKey Aug 26.
 * Same-day nap: fell asleep and woke on Aug 26 → dateKey Aug 26.
 *
 * Older entries without `wokeAt` / `dateKey` fall back to the local date of `createdAt`.
 */
export function getSleepDateKey(
  entry: Pick<SleepEntry, 'createdAt' | 'wokeAt'> & { dateKey?: string },
): string {
  if (typeof entry.dateKey === 'string') {
    const trimmed = entry.dateKey.trim();
    if (DATE_KEY_PATTERN.test(trimmed)) return trimmed;
  }
  if (typeof entry.wokeAt === 'string') {
    const parsed = Date.parse(entry.wokeAt);
    if (!Number.isNaN(parsed)) return toLocalDateKey(entry.wokeAt);
  }
  return toLocalDateKey(entry.createdAt);
}

export function hydrateSleepEntry(entry: SleepEntry): SleepEntry {
  const dateKey = getSleepDateKey(entry);
  if (entry.dateKey === dateKey) return entry;
  return { ...entry, dateKey };
}

export function getSleepType(entry: Pick<SleepEntry, 'type'>): SleepSessionType {
  return entry.type === 'nap' ? 'nap' : 'main';
}

export function isMainSleep(entry: Pick<SleepEntry, 'type'>): boolean {
  return getSleepType(entry) === 'main';
}

export function parseClock(value: string | undefined | null): ParsedClock | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso) && looksLikeTimestamp(trimmed)) {
    const date = new Date(iso);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
  }

  const match = TIME_PATTERN.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

function looksLikeTimestamp(value: string): boolean {
  return value.includes('T') || value.includes('-') || value.endsWith('Z');
}

export function normalizeClockInput(value: string): string {
  const parsed = parseClock(value);
  if (!parsed) return value.trim();
  return `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}`;
}

/**
 * Sleep duration in minutes = wake − fell-asleep.
 * Clock-only values that cross midnight add 24h so 23:30 → 07:00 is 7h 30m, not negative.
 */
export function durationMinutesFromClocks(fellAsleep: string, woke: string): number | null {
  const start = parseClock(fellAsleep);
  const end = parseClock(woke);
  if (!start || !end) return null;
  let elapsed = end.totalMinutes - start.totalMinutes;
  // Cross-midnight: 23:30 → 07:00 is 7h 30m, not a negative span.
  if (elapsed < 0) elapsed += MINUTES_PER_DAY;
  if (elapsed <= 0) return null;
  return elapsed;
}

export function durationMinutesFromISO(fellAsleepAt: string, wokeAt: string): number | null {
  const start = Date.parse(fellAsleepAt);
  const end = Date.parse(wokeAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const elapsed = Math.round((end - start) / 60000);
  if (elapsed <= 0) return null;
  return elapsed;
}

export function getSleepDurationMinutes(entry: SleepEntry): number | null {
  if (typeof entry.durationMinutes === 'number' && Number.isFinite(entry.durationMinutes) && entry.durationMinutes > 0) {
    return Math.round(entry.durationMinutes);
  }
  if (entry.fellAsleepAt && entry.wokeAt) {
    const fromIso = durationMinutesFromISO(entry.fellAsleepAt, entry.wokeAt);
    if (fromIso != null) return fromIso;
  }
  const fromClocks = durationMinutesFromClocks(entry.sleepTime, entry.wakeTime);
  if (fromClocks != null) return fromClocks;
  if (typeof entry.hours === 'number' && Number.isFinite(entry.hours) && entry.hours > 0) {
    return Math.round(entry.hours * 60);
  }
  return null;
}

export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return '—';
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function qualityLabel(quality: number): string {
  const clamped = clampQuality(quality);
  return QUALITY_LABELS[clamped] ?? 'Okay';
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 3;
  return Math.min(SLEEP_QUALITY_MAX, Math.max(SLEEP_QUALITY_MIN, Math.round(quality)));
}

/** `wakeFeelings: []` means none chosen. Missing `wakeFeelings` means a legacy single value. */
export function getWakeFeelings(entry: Pick<SleepEntry, 'wakeFeeling' | 'wakeFeelings'>): WakeFeeling[] {
  if (Array.isArray(entry.wakeFeelings)) return entry.wakeFeelings.filter(Boolean);
  return entry.wakeFeeling ? [entry.wakeFeeling] : [];
}

export function wakeFeelingLabel(id: string): string {
  const match = wakeFeelings.find((item) => item.id === id);
  if (match) return match.label;
  if (!id) return '';
  return id.replace(/-/g, ' ');
}

export function getSleepFactors(entry: Pick<SleepEntry, 'tags' | 'factors'>): string[] {
  const raw = Array.isArray(entry.factors) && entry.factors.length > 0 ? entry.factors : (entry.tags ?? []);
  return raw.filter(Boolean);
}

export function factorLabel(tag: string): string {
  const value = tag.trim().toLowerCase();
  if (value === 'unknown') return 'not sure';
  return tag;
}

export function formatClockLabel(value: string | undefined | null): string | undefined {
  const parsed = parseClock(value);
  if (!parsed) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed || undefined;
  }
  const date = new Date(2000, 0, 1, parsed.hours, parsed.minutes);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function localDateTimeISO(dateKey: string, clock: ParsedClock): string {
  const date = dateFromDateKey(dateKey) ?? new Date();
  date.setHours(clock.hours, clock.minutes, 0, 0);
  return date.toISOString();
}

/**
 * Attach clock times to a wake date.
 * If the fall-asleep clock is later than the wake clock, fall-asleep is the previous local day.
 * Went-to-bed is resolved relative to fall-asleep the same way.
 */
export function datetimesFromWakeDate(
  wakeDateKey: string,
  wentToBed: string,
  fellAsleep: string,
  woke: string,
): { wentToBedAt?: string; fellAsleepAt?: string; wokeAt?: string } {
  const wakeClock = parseClock(woke);
  const sleepClock = parseClock(fellAsleep);
  if (!wakeClock || !sleepClock) return {};

  const wokeAt = localDateTimeISO(wakeDateKey, wakeClock);
  const fellAsleepDateKey =
    sleepClock.totalMinutes <= wakeClock.totalMinutes ? wakeDateKey : shiftDateKey(wakeDateKey, -1);
  const fellAsleepAt = localDateTimeISO(fellAsleepDateKey, sleepClock);

  const bedClock = parseClock(wentToBed);
  if (!bedClock) return { fellAsleepAt, wokeAt };

  const wentToBedDateKey =
    bedClock.totalMinutes <= sleepClock.totalMinutes
      ? fellAsleepDateKey
      : shiftDateKey(fellAsleepDateKey, -1);
  return {
    wentToBedAt: localDateTimeISO(wentToBedDateKey, bedClock),
    fellAsleepAt,
    wokeAt,
  };
}

export function emptySleepDraft(wakeDateKey: string): SleepDraft {
  return {
    type: 'main',
    wentToBed: '',
    fellAsleep: '23:30',
    woke: '07:00',
    quality: 3,
    wakeFeelings: [],
    factors: [],
    note: '',
    wakeDateKey,
  };
}

export function buildSleepFields(draft: SleepDraft): Omit<SleepEntry, 'id' | 'createdAt'> {
  const quality = clampQuality(draft.quality);
  const feelings = draft.wakeFeelings.filter(Boolean);
  const factors = draft.factors.map((tag) => (tag === 'unknown' ? 'not sure' : tag));
  const wentToBed = draft.wentToBed.trim() ? normalizeClockInput(draft.wentToBed) : '';
  const fellAsleep = normalizeClockInput(draft.fellAsleep);
  const woke = normalizeClockInput(draft.woke);
  const durationMinutes = durationMinutesFromClocks(fellAsleep, woke) ?? undefined;
  const datetimes = datetimesFromWakeDate(draft.wakeDateKey, wentToBed, fellAsleep, woke);

  return {
    type: draft.type,
    bedtime: wentToBed,
    sleepTime: fellAsleep,
    wakeTime: woke,
    hours: durationMinutes != null ? durationMinutes / 60 : 0,
    ...datetimes,
    durationMinutes,
    quality,
    wakeFeeling: feelings[0] ?? 'okay',
    wakeFeelings: feelings,
    tags: factors,
    factors,
    note: draft.note.trim() || undefined,
    dateKey: draft.wakeDateKey,
  };
}

export function draftFromEntry(entry: SleepEntry): SleepDraft {
  return {
    type: getSleepType(entry),
    wentToBed: entry.bedtime ? normalizeClockInput(entry.bedtime) : '',
    fellAsleep: entry.sleepTime ? normalizeClockInput(entry.sleepTime) : '',
    woke: entry.wakeTime ? normalizeClockInput(entry.wakeTime) : '',
    quality: clampQuality(entry.quality),
    wakeFeelings: getWakeFeelings(entry),
    factors: getSleepFactors(entry).map(factorLabel),
    note: entry.note ?? '',
    wakeDateKey: getSleepDateKey(entry),
  };
}

export function groupSleepByDate(entries: SleepEntry[]): Record<string, SleepEntry[]> {
  const groups: Record<string, SleepEntry[]> = {};
  for (const entry of entries) {
    const key = getSleepDateKey(entry);
    const bucket = groups[key] ?? [];
    bucket.push(entry);
    groups[key] = bucket;
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const diff = sleepSortTime(a) - sleepSortTime(b);
      if (diff !== 0) return diff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }
  return groups;
}

function sleepSortTime(entry: SleepEntry): number {
  if (entry.wokeAt) {
    const parsed = Date.parse(entry.wokeAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const created = Date.parse(entry.createdAt);
  if (!Number.isNaN(created)) return created;
  return 0;
}

export function sleepCountByDate(entries: SleepEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [dateKey, dayEntries] of Object.entries(groupSleepByDate(entries))) {
    counts[dateKey] = dayEntries.length;
  }
  return counts;
}

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

function entriesInWindow(entries: SleepEntry[], days: 7 | 30, todayKey: string): SleepEntry[] {
  const startKey = shiftDateKey(todayKey, -(days - 1));
  return entries.filter((entry) => {
    const key = getSleepDateKey(entry);
    return key >= startKey && key <= todayKey;
  });
}

/**
 * Circular mean of clock times, in minutes from local midnight.
 * Needed so 23:30 and 00:30 average to midnight, not noon.
 */
export function circularMeanMinutes(values: number[]): number | null {
  if (values.length === 0) return null;
  let sin = 0;
  let cos = 0;
  for (const value of values) {
    const angle = (value / MINUTES_PER_DAY) * Math.PI * 2;
    sin += Math.sin(angle);
    cos += Math.cos(angle);
  }
  const n = values.length;
  sin /= n;
  cos /= n;
  if (Math.hypot(sin, cos) < 1e-8) return null;
  let mean = Math.atan2(sin, cos);
  if (mean < 0) mean += Math.PI * 2;
  return Math.round((mean / (Math.PI * 2)) * MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function formatMinutesAsClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export type SleepPatternSummary = {
  days: 7 | 30;
  sparse: boolean;
  mainCount: number;
  napCount: number;
  averageDurationMinutes: number | null;
  averageQuality: number | null;
  typicalFallAsleep: string | null;
  typicalWake: string | null;
  topFeelings: { label: string; count: number }[];
  topFactors: { label: string; count: number }[];
  facts: string[];
};

export function summarizeSleepPatterns(
  entries: SleepEntry[],
  days: 7 | 30,
  todayKey: string,
): SleepPatternSummary {
  const inWindow = entriesInWindow(entries, days, todayKey);
  const main = inWindow.filter(isMainSleep);
  const naps = inWindow.filter((entry) => getSleepType(entry) === 'nap');

  if (main.length < SLEEP_PATTERN_MIN_MAIN) {
    return {
      days,
      sparse: true,
      mainCount: main.length,
      napCount: naps.length,
      averageDurationMinutes: null,
      averageQuality: null,
      typicalFallAsleep: null,
      typicalWake: null,
      topFeelings: [],
      topFactors: [],
      facts: [],
    };
  }

  const mainDurations = main
    .map(getSleepDurationMinutes)
    .filter((value): value is number => value != null && value > 0);
  const averageDurationMinutes =
    mainDurations.length > 0
      ? Math.round(mainDurations.reduce((sum, value) => sum + value, 0) / mainDurations.length)
      : null;

  const qualities = inWindow
    .map((entry) => entry.quality)
    .filter((value) => typeof value === 'number' && Number.isFinite(value));
  const averageQuality =
    qualities.length > 0
      ? roundOne(qualities.reduce((sum, value) => sum + value, 0) / qualities.length)
      : null;

  const fallAsleepMinutes = main
    .map((entry) => parseClock(entry.fellAsleepAt ?? entry.sleepTime)?.totalMinutes)
    .filter((value): value is number => value != null);
  const wakeMinutes = main
    .map((entry) => parseClock(entry.wokeAt ?? entry.wakeTime)?.totalMinutes)
    .filter((value): value is number => value != null);

  const typicalFallAsleepMean = circularMeanMinutes(fallAsleepMinutes);
  const typicalWakeMean = circularMeanMinutes(wakeMinutes);

  const feelingCounts = ranked(
    countBy(
      inWindow.flatMap((entry) => getWakeFeelings(entry)),
      (id) => id,
    ),
    (id, count) => ({ label: wakeFeelingLabel(id), count }),
  );

  const factorCounts = ranked(
    countBy(
      inWindow.flatMap((entry) => getSleepFactors(entry).map(factorLabel)),
      (tag) => tag.trim().toLowerCase(),
    ),
    (label, count) => ({ label, count }),
  );

  const facts: string[] = [];
  const shortMain = mainDurations.filter((value) => value < 6 * 60).length;
  if (shortMain >= 2) {
    facts.push(
      `You logged less than 6 hours on ${shortMain} main sleep session${shortMain === 1 ? '' : 's'}.`,
    );
  }

  for (const feeling of feelingCounts.slice(0, 2)) {
    if (feeling.count >= 3) {
      facts.push(`${feeling.label} was selected after waking ${feeling.count} times.`);
    }
  }

  for (const factor of factorCounts.slice(0, 2)) {
    if (factor.label === 'not sure') continue;
    if (factor.count >= 3) {
      facts.push(`${factor.label} was selected on ${factor.count} sleep logs.`);
    }
  }

  const association = ranked(
    countBy(
      main.flatMap((entry) =>
        getSleepFactors(entry)
          .map(factorLabel)
          .filter((tag) => tag && tag !== 'not sure')
          .map((tag) => tag.trim().toLowerCase()),
      ),
      (tag) => tag,
    ),
    (label, count) => ({ label, count }),
  ).find((item) => item.count >= 3);

  if (association) {
    const tagged = main.filter((entry) =>
      getSleepFactors(entry)
        .map((tag) => factorLabel(tag).trim().toLowerCase())
        .includes(association.label),
    );
    const taggedQuality = tagged
      .map((entry) => entry.quality)
      .filter((value) => typeof value === 'number' && Number.isFinite(value));
    if (taggedQuality.length >= 3) {
      const avg = roundOne(taggedQuality.reduce((sum, value) => sum + value, 0) / taggedQuality.length);
      facts.push(
        `On main sleep logs tagged ‘${association.label}’, average logged quality was ${avg} / 5.`,
      );
    }
  }

  return {
    days,
    sparse: false,
    mainCount: main.length,
    napCount: naps.length,
    averageDurationMinutes,
    averageQuality,
    typicalFallAsleep:
      typicalFallAsleepMean != null ? formatMinutesAsClock(typicalFallAsleepMean) : null,
    typicalWake: typicalWakeMean != null ? formatMinutesAsClock(typicalWakeMean) : null,
    topFeelings: feelingCounts.slice(0, 3),
    topFactors: factorCounts.filter((item) => item.label !== 'not sure').slice(0, 3),
    facts: facts.slice(0, 4),
  };
}

export function typeLabel(type: SleepSessionType): string {
  return type === 'nap' ? 'Nap' : 'Main sleep';
}
