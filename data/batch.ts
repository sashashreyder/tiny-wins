export const BATCH_MIN = 1;
export const BATCH_MAX = 99;
export const BATCH_DEFAULT = 5;
export const BATCH_ADD_MORE = [1, 3, 5] as const;
export const BATCH_TARGET_CAP = 199;

export function parseBatchCount(value: string, min = BATCH_MIN, max = BATCH_MAX): number | null {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function clampBatchCount(value: number, min = BATCH_MIN, max = BATCH_MAX): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function thingsLabel(count: number): string {
  return count === 1 ? 'thing' : 'things';
}
