// Local recovery suggestions for the prototype.
// A future optional AI provider can personalize these without changing the UI flow.

export type RechargeStage =
  | 'menu'
  | 'pause-setup'
  | 'pause-running'
  | 'pause-result'
  | 'body-reset'
  | 'smaller-day'
  | 'low-energy-setup'
  | 'low-energy-running'
  | 'low-energy-result'
  | 'complete';

export type RechargeMethod =
  | 'real-pause'
  | 'body-first'
  | 'make-today-smaller'
  | 'low-energy';

export type TiredFeeling =
  | 'sleepy-heavy'
  | 'overstimulated'
  | 'emotionally-drained'
  | 'need-basics'
  | 'wired-tired'
  | 'not-sure';

export type RechargeOption = {
  id: string;
  label: string;
  isCustom?: boolean;
};

export type RechargeChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  isCustom: boolean;
};

export const RECHARGE_METHODS: {
  id: RechargeMethod;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'real-pause',
    icon: '🛏',
    title: 'Give my brain a real pause',
    description: 'Reduce input, lie down, or do nothing for a little while.',
  },
  {
    id: 'body-first',
    icon: '🍲',
    title: 'Take care of my body first',
    description: 'Check the basic things before asking your brain for more.',
  },
  {
    id: 'make-today-smaller',
    icon: '✂️',
    title: 'Make today smaller',
    description:
      'Postpone, reduce, or release something that does not need your energy today.',
  },
  {
    id: 'low-energy',
    icon: '🪫',
    title: 'I still have to do one thing',
    description:
      'Use the energy you actually have for the smallest result that truly cannot wait.',
  },
];

export const TIRED_FEELING_OPTIONS: {
  id: TiredFeeling;
  label: string;
}[] = [
  { id: 'sleepy-heavy', label: '😴 Sleepy or physically heavy' },
  { id: 'overstimulated', label: '🔊 Overstimulated' },
  { id: 'emotionally-drained', label: '🫥 Emotionally drained' },
  { id: 'need-basics', label: '🍽 I may need food or water' },
  { id: 'wired-tired', label: '🌀 Wired but exhausted' },
  { id: 'not-sure', label: '❔ I honestly don’t know' },
];

export const TIRED_FEELING_RECOMMENDATIONS: Record<TiredFeeling, RechargeMethod> = {
  'sleepy-heavy': 'real-pause',
  overstimulated: 'real-pause',
  'emotionally-drained': 'make-today-smaller',
  'need-basics': 'body-first',
  'wired-tired': 'real-pause',
  'not-sure': 'body-first',
};

export const PAUSE_OPTIONS: RechargeOption[] = [
  { id: 'lie-down', label: 'Lie down with my eyes closed' },
  { id: 'sit-quiet', label: 'Sit somewhere quiet' },
  { id: 'phone-away', label: 'Put my phone out of reach' },
  { id: 'familiar-watch', label: 'Watch something familiar' },
  { id: 'listen-music', label: 'Listen to music' },
  { id: 'nap', label: 'Take a nap' },
  { id: 'fresh-air', label: 'Step outside for fresh air' },
  { id: 'lower-senses', label: 'Lower the lights and noise' },
  { id: 'do-nothing', label: 'Do absolutely nothing for a while' },
  { id: 'custom', label: 'Write my own kind of pause', isCustom: true },
];

export const BODY_RESET_OPTIONS: readonly string[] = [
  'Drink something',
  'Eat something',
  'Take a shower or wash my face',
  'Brush my teeth',
  'Use the bathroom',
  'Change into comfortable clothes',
  'Take my usual medication if it is already time',
  'Get some fresh air',
  'Stretch gently',
  'Rest my eyes',
  'Lower the light or noise',
  'Make the room a little more comfortable',
];

export const SMALLER_DAY_OPTIONS: RechargeOption[] = [
  { id: 'postpone', label: 'Postpone one non-urgent thing' },
  { id: 'move-day', label: 'Move one task to another day' },
  { id: 'cancel-plan', label: 'Cancel or decline one optional plan' },
  { id: 'minimum', label: 'Do the minimum useful version' },
  { id: 'ask-help', label: 'Ask someone for help' },
  { id: 'leave-unfinished', label: 'Leave something unfinished on purpose' },
  { id: 'essential', label: 'Decide what is actually essential' },
  { id: 'not-today', label: 'Make a not-today list' },
  { id: 'reduce-standard', label: 'Reduce one standard' },
  { id: 'stop-one-part', label: 'Stop after one necessary part' },
  { id: 'prepare-later', label: 'Prepare something now and finish it later' },
  { id: 'custom', label: 'Write my own permission', isCustom: true },
];

export const LOW_ENERGY_ENOUGH_PRESETS: readonly string[] = [
  'The smallest acceptable result',
  'One visible part',
  'A rough version',
  'Only the urgent part',
  'Enough to make tomorrow easier',
];

export const RECHARGE_COMPLETION_COPY: Record<
  RechargeMethod,
  { headline: string; body: string }
> = {
  'real-pause': {
    headline: 'You made room for recovery.',
    body: 'Rest was not a detour. It was the thing your system needed.',
  },
  'body-first': {
    headline: 'You took care of the system carrying the task.',
    body: 'Basic care counts, especially on a low-energy day.',
  },
  'make-today-smaller': {
    headline: 'You protected your energy.',
    body: 'Changing the plan can be wiser than forcing the original one.',
  },
  'low-energy': {
    headline: 'You worked with your capacity.',
    body: 'Enough for today is still real progress.',
  },
};

export const PAUSE_DURATION_PRESETS = [10, 20, 30] as const;
export const LOW_ENERGY_DURATION_PRESETS = [5, 10, 15] as const;

export function makeBodyResetItems(): RechargeChecklistItem[] {
  return BODY_RESET_OPTIONS.map((text, index) => ({
    id: `body-preset-${index}`,
    text,
    completed: false,
    isCustom: false,
  }));
}

export function makeSmallerDayItems(): RechargeChecklistItem[] {
  return SMALLER_DAY_OPTIONS.filter((option) => !option.isCustom).map((option) => ({
    id: option.id,
    text: option.label,
    completed: false,
    isCustom: false,
  }));
}

export function getSuggestedRechargeMethod(
  feeling: TiredFeeling | null,
): RechargeMethod | null {
  if (!feeling) return null;
  return TIRED_FEELING_RECOMMENDATIONS[feeling];
}

function capitalizeSnippet(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const snippet = trimmed.slice(0, maxLength);
  return snippet.charAt(0).toUpperCase() + snippet.slice(1);
}

function joinNaturalList(labels: string[]): string {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;

  const head = labels.slice(0, -1).join(', ');
  return `${head}, and ${labels[labels.length - 1]}`;
}

function softenLabel(label: string, index: number): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  if (index === 0) return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export function formatSmallerDaySummary(labels: string[]): string {
  if (labels.length === 0) return '';

  const softened = labels.map((label, index) => softenLabel(label, index));
  return `Today I’m allowed to ${joinNaturalList(softened)}.`;
}

export function buildRechargeWinTitle(params: {
  method: RechargeMethod;
  pauseLabel?: string;
  completedBodyItems?: string[];
  smallerDayLabel?: string;
  enoughText?: string;
}): string {
  const { method, pauseLabel, completedBodyItems, smallerDayLabel, enoughText } = params;

  let title: string;
  switch (method) {
    case 'real-pause': {
      const pause = capitalizeSnippet(pauseLabel ?? '', 40);
      title = pause ? `Took a real pause: ${pause}` : 'Took a real pause';
      break;
    }
    case 'body-first': {
      const completed = (completedBodyItems ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 2);
      if (completed.length === 0) {
        title = 'Took care of basic needs';
      } else if (completed.length === 1) {
        title = `Body reset: ${capitalizeSnippet(completed[0], 40)}`;
      } else {
        const first = capitalizeSnippet(completed[0], 24);
        const second = capitalizeSnippet(completed[1], 24);
        title = `Body reset: ${first} + ${second.charAt(0).toLowerCase()}${second.slice(1)}`;
      }
      break;
    }
    case 'make-today-smaller': {
      const permission = capitalizeSnippet(smallerDayLabel ?? '', 40);
      title = permission
        ? `Made today smaller: ${permission}`
        : 'Made today smaller';
      break;
    }
    case 'low-energy': {
      const enough = capitalizeSnippet(enoughText ?? '', 40);
      title = enough ? `Did enough today: ${enough}` : 'Did enough today';
      break;
    }
  }

  return title.slice(0, 80);
}

export function getPauseOptionLabel(
  selectedPauseId: string | null,
  customPauseText: string,
): string {
  if (!selectedPauseId) return '';
  if (selectedPauseId === 'custom') {
    return customPauseText.trim();
  }
  return PAUSE_OPTIONS.find((option) => option.id === selectedPauseId)?.label ?? '';
}
