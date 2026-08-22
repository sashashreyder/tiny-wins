export const CHALLENGE_TARGET_MIN = 1;
export const CHALLENGE_TARGET_MAX = 50;
export const CHALLENGE_TARGET_DEFAULT = 3;

export const CHALLENGE_DURATION_OPTIONS = [3, 5, 10, 15] as const;
export const CHALLENGE_DURATION_DEFAULT = 5;
export const CHALLENGE_DURATION_MIN = 1;
export const CHALLENGE_DURATION_MAX = 60;

export type ChallengePresetId = 'tiny' | 'quick' | 'spicy';

export type ChallengePreset = {
  id: ChallengePresetId;
  label: string;
  target: number;
  minutes: number;
};

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  { id: 'tiny', label: 'Tiny', target: 3, minutes: 3 },
  { id: 'quick', label: 'Quick', target: 5, minutes: 5 },
  { id: 'spicy', label: 'Spicy', target: 7, minutes: 10 },
];

export const CHALLENGE_TASK_EXAMPLES = [
  'Finish presentation',
  'Clear the desk',
  'Reply to emails',
  'Write the draft',
] as const;

export const CHALLENGE_UNIT_EXAMPLES = [
  'one slide',
  'one email',
  'one paragraph',
  'one item put away',
] as const;

const INCREMENT_NOTES = ['Nice.', 'Got it.', '+1'] as const;

export function parseChallengeCount(
  value: string,
  min = CHALLENGE_TARGET_MIN,
  max = CHALLENGE_TARGET_MAX,
): number | null {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function parseChallengeMinutes(
  value: string,
  min = CHALLENGE_DURATION_MIN,
  max = CHALLENGE_DURATION_MAX,
): number | null {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function clampChallengeCount(
  value: number,
  min = CHALLENGE_TARGET_MIN,
  max = CHALLENGE_TARGET_MAX,
): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function minutesLabel(minutes: number): string {
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

function stripUnitArticle(unit: string): string {
  return unit.trim().toLowerCase().replace(/^(one|a|an)\s+/i, '').trim();
}

function pluralizeSimple(word: string): string {
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
    return word.endsWith('s') ? word : `${word}es`;
  }
  if (word.length > 1 && word.endsWith('y') && !/[aeiou]y$/.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }
  return `${word}s`;
}

function isSimpleUnit(unit: string): boolean {
  return unit.length > 0 && !/\s/.test(unit) && /^[a-z][a-z-]*$/i.test(unit);
}

export function unitScoreLabel(unit: string, count: number): string {
  const cleaned = stripUnitArticle(unit);
  if (!cleaned) return '';
  if (!isSimpleUnit(cleaned)) return cleaned;
  return count === 1 ? cleaned : pluralizeSimple(cleaned);
}

export function formatChallengePreview(
  target: number,
  unit: string,
  minutes: number,
): string | null {
  const cleaned = stripUnitArticle(unit);
  if (!isSimpleUnit(cleaned)) return null;
  const word = target === 1 ? cleaned : pluralizeSimple(cleaned);
  return `${target} ${word} in ${minutesLabel(minutes)}`;
}

export function formatChallengeFallback(target: number, minutes: number): string {
  return `Target: ${target}\nTime: ${minutesLabel(minutes)}`;
}

export function challengePreview(target: number, unit: string, minutes: number): string {
  return formatChallengePreview(target, unit, minutes) ?? formatChallengeFallback(target, minutes);
}

export function suggestSmallerChallenge(
  target: number,
  minutes: number,
): { target: number; minutes: number } {
  if (target > CHALLENGE_TARGET_MIN) {
    const halved = Math.max(CHALLENGE_TARGET_MIN, Math.ceil(target / 2));
    return {
      target: halved === target ? target - 1 : halved,
      minutes,
    };
  }

  const lowerPreset = [...CHALLENGE_DURATION_OPTIONS].reverse().find((option) => option < minutes);
  if (lowerPreset != null) {
    return { target, minutes: lowerPreset };
  }

  return {
    target,
    minutes: Math.max(CHALLENGE_DURATION_MIN, Math.ceil(minutes / 2)),
  };
}

export function incrementNote(seed: number): string {
  return INCREMENT_NOTES[Math.abs(seed) % INCREMENT_NOTES.length];
}

export function challengeSupportLine(
  completed: number,
  target: number,
  endedByTimer: boolean,
): string {
  if (completed === 0) {
    return endedByTimer ? 'The timer ended. You still showed up.' : 'You still showed up.';
  }
  if (completed > target) {
    return `You flew past your target of ${target}.`;
  }
  if (completed === target) {
    return 'You moved it forward.';
  }
  return `${completed} done. That still counts.`;
}

export function challengeTimerHeadline(completed: number, target: number): string | null {
  if (completed === 0) return null;
  if (completed > target) return `You got ${completed} done.`;
  if (completed === target) return `${completed} / ${target} — target hit ✨`;
  return `You got ${completed} done ✨`;
}

export function challengeTimerSupport(completed: number, target: number): string | null {
  if (completed === 0) return null;
  if (completed > target) return `You flew past your target of ${target}.`;
  if (completed === target) return null;
  return `That’s ${completed} more than before.`;
}

export function matchingPreset(
  target: number,
  minutes: number,
): ChallengePresetId | null {
  return CHALLENGE_PRESETS.find((preset) => preset.target === target && preset.minutes === minutes)
    ?.id ?? null;
}
