const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatFromLocalParts(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date, ISO timestamp, locale date string, or YYYY-MM-DD value
 * into the user's local calendar day as YYYY-MM-DD.
 *
 * Do not use iso.slice(0, 10) — UTC midnight can land on the previous local day.
 */
export function toLocalDateKey(input: Date | string | number = new Date()): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (DATE_KEY_PATTERN.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return formatFromLocalParts(parsed);
    }
    return formatFromLocalParts(new Date());
  }

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return formatFromLocalParts(new Date());
  }
  return formatFromLocalParts(date);
}

export function todayLocalDateKey(): string {
  return formatFromLocalParts(new Date());
}

/** Local midnight for a YYYY-MM-DD key. Used for sort fallback only — not display. */
export function startOfLocalDayMs(dateKey: string): number {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return 0;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day).getTime();
}

export function formatDateForDisplay(dateKey: string): string {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return dateKey;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Returns a short local time only when `createdAt` is a real timestamp. */
export function formatTimeForDisplay(createdAt?: string): string | undefined {
  if (!createdAt) return undefined;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function parseDateKey(
  dateKey: string,
): { year: number; month: number; day: number } | null {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function dateFromDateKey(dateKey: string): Date | null {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

export function shiftDateKey(dateKey: string, days: number): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + days);
  return formatFromLocalParts(date);
}

export function monthFromDateKey(dateKey: string): { year: number; monthIndex: number } {
  const parsed = parseDateKey(dateKey);
  if (!parsed) {
    const today = new Date();
    return { year: today.getFullYear(), monthIndex: today.getMonth() };
  }
  return { year: parsed.year, monthIndex: parsed.month - 1 };
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function isMonthAfterDateKey(
  year: number,
  monthIndex: number,
  dateKey: string,
): boolean {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return false;
  if (year !== parsed.year) return year > parsed.year;
  return monthIndex > parsed.month - 1;
}

/** Locale month + day, e.g. August 20 */
export function formatMonthDayLong(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

/** Locale long form, e.g. Friday, August 21 */
export function formatWeekdayLongDate(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/** 0 = Sunday … 6 = Saturday. Falls back to Sunday if locale week start is unavailable. */
export function getWeekStartsOn(): number {
  try {
    const localeId = Intl.DateTimeFormat().resolvedOptions().locale;
    const locale = new Intl.Locale(localeId) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    const firstDay = locale.weekInfo?.firstDay;
    if (firstDay === 7) return 0;
    if (typeof firstDay === 'number' && firstDay >= 1 && firstDay <= 6) return firstDay;
  } catch {
    // Some runtimes do not expose weekInfo.
  }
  return 0;
}

export function getWeekdayLabels(weekStartsOn: number = getWeekStartsOn()): string[] {
  const sunday = new Date(2026, 0, 4);
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + ((weekStartsOn + index) % 7));
    return formatter.format(date);
  });
}

export type MonthGridCell = {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
};

export function buildMonthGrid(
  year: number,
  monthIndex: number,
  weekStartsOn: number = getWeekStartsOn(),
): MonthGridCell[] {
  const first = new Date(year, monthIndex, 1);
  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const total = Math.ceil((leading + daysInMonth) / 7) * 7;
  const cells: MonthGridCell[] = [];

  for (let index = 0; index < total; index += 1) {
    const date = new Date(year, monthIndex, 1 - leading + index);
    cells.push({
      dateKey: formatFromLocalParts(date),
      day: date.getDate(),
      inCurrentMonth: date.getFullYear() === year && date.getMonth() === monthIndex,
    });
  }

  return cells;
}
