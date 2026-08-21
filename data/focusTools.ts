export type FocusToolId =
  | 'sprint'
  | 'pomodoro'
  | 'body-double'
  | 'batch'
  | 'challenge';

export type FocusTool = {
  id: FocusToolId;
  emoji: string;
  title: string;
  description: string;
  available: boolean;
};

export const FOCUS_TOOLS: FocusTool[] = [
  {
    id: 'sprint',
    emoji: '⏱',
    title: 'Focus Sprint',
    description: 'Stay with one task for a few minutes.',
    available: true,
  },
  {
    id: 'pomodoro',
    emoji: '🍅',
    title: 'Pomodoro',
    description: 'Focus, take a real break, then come back.',
    available: true,
  },
  {
    id: 'body-double',
    emoji: '👥',
    title: 'Body Double',
    description: 'Work alongside a quiet companion.',
    available: false,
  },
  {
    id: 'batch',
    emoji: '📚',
    title: 'Batch Mode',
    description: 'Group similar little tasks and clear them together.',
    available: false,
  },
  {
    id: 'challenge',
    emoji: '🎲',
    title: 'Challenge Mode',
    description: 'Turn a boring task into a tiny game.',
    available: false,
  },
];

export const FOCUS_TIPS = [
  'Make distractions slightly harder to reach.',
  'One tab is easier to return to than twelve.',
  'If a side thought appears, write it down instead of following it.',
  'Stopping after one focus sprint still counts.',
  'Put the thing you need directly in front of you.',
  'You do not have to finish the task to make progress.',
] as const;

export function pickFocusTip(): string {
  return FOCUS_TIPS[Math.floor(Math.random() * FOCUS_TIPS.length)];
}
