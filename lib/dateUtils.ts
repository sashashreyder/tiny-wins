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
