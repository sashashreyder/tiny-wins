export type PomodoroRhythmId = 'short' | 'classic' | 'deep' | 'custom';

export type PomodoroPreset = {
  id: PomodoroRhythmId;
  label: string;
  description: string;
  focusMinutes: number;
  breakMinutes: number;
};

export const POMODORO_PRESETS: PomodoroPreset[] = [
  {
    id: 'short',
    label: 'Short',
    description: '15 min focus · 5 min break',
    focusMinutes: 15,
    breakMinutes: 5,
  },
  {
    id: 'classic',
    label: 'Classic',
    description: '25 min focus · 5 min break',
    focusMinutes: 25,
    breakMinutes: 5,
  },
  {
    id: 'deep',
    label: 'Deep',
    description: '45 min focus · 10 min break',
    focusMinutes: 45,
    breakMinutes: 10,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Choose your own focus and break length',
    focusMinutes: 0,
    breakMinutes: 0,
  },
];

export const POMODORO_ROUNDS = [1, 2, 3, 4] as const;
export const DEFAULT_POMODORO_ROUNDS = 2;
export const DEFAULT_POMODORO_RHYTHM: PomodoroRhythmId = 'classic';

export const POMODORO_FOCUS_MIN = 1;
export const POMODORO_FOCUS_MAX = 90;
export const POMODORO_BREAK_MIN = 1;
export const POMODORO_BREAK_MAX = 30;

export const POMODORO_BREAK_IDEAS = [
  'Stretch',
  'Get some water',
  'Look away from the screen',
  'Stand up',
  'Do absolutely nothing',
] as const;

export function parsePomodoroMinutes(
  value: string,
  min: number,
  max: number,
): number | null {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function roundsLabel(count: number): string {
  return count === 1 ? '1 focus round' : `${count} focus rounds`;
}

export function breaksLabel(count: number): string {
  return count === 1 ? '1 break' : `${count} breaks`;
}

export function remainingRoundsLabel(count: number): string {
  if (count <= 0) return '';
  return count === 1 ? '1 focus round left' : `${count} focus rounds left`;
}
