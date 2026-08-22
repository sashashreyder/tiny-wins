export const CHALLENGE_DURATION_OPTIONS = [3, 5, 10, 15] as const;
export const CHALLENGE_DURATION_DEFAULT = 5;
export const CHALLENGE_DURATION_MIN = 1;
export const CHALLENGE_DURATION_MAX = 60;

export const CHALLENGE_TASK_EXAMPLES = [
  'Clear the kitchen',
  'Review product cards',
  'Reply to emails',
  'Edit the draft',
] as const;

export const CHALLENGE_UNIT_EXAMPLES = [
  'things put away',
  'cards reviewed',
  'emails replied to',
  'paragraphs edited',
] as const;

const INCREMENT_NOTES = ['Nice.', 'Got it.', '+1'] as const;

const MINUTES_AGO: Record<number, string> = {
  1: 'One minute ago',
  3: 'Three minutes ago',
  5: 'Five minutes ago',
  10: 'Ten minutes ago',
  15: 'Fifteen minutes ago',
};

export function parseChallengeMinutes(
  value: string,
  min = CHALLENGE_DURATION_MIN,
  max = CHALLENGE_DURATION_MAX,
): number | null {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function minutesLabel(minutes: number): string {
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

export function incrementNote(seed: number): string {
  return INCREMENT_NOTES[Math.abs(seed) % INCREMENT_NOTES.length];
}

export function suggestShorterDuration(minutes: number): number {
  const lowerPreset = [...CHALLENGE_DURATION_OPTIONS].reverse().find((option) => option < minutes);
  if (lowerPreset != null) return lowerPreset;
  return Math.max(CHALLENGE_DURATION_MIN, Math.ceil(minutes / 2));
}

export function countLabel(unit: string): string {
  return unit.trim();
}

export function scoreWithLabel(completed: number, unit: string): string {
  const label = countLabel(unit);
  if (!label) return completed === 1 ? '1 done' : `${completed} done`;
  return `${completed} ${label}`;
}

function minutesAgoPhrase(minutes: number): string {
  return MINUTES_AGO[minutes] ?? `${minutesLabel(minutes).replace(/^./, (c) => c.toUpperCase())} ago`;
}

export function speedRunSupportLine(completed: number, unit: string, minutes: number): string {
  if (completed === 0) return 'Nothing got counted this round.';
  const label = countLabel(unit);
  if (label) {
    return `${minutesAgoPhrase(minutes)}, those ${completed} ${label} were still waiting for you.`;
  }
  return `That’s ${completed} things moved forward.`;
}
