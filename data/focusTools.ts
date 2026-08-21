export type FocusToolId =
  | 'sprint'
  | 'pomodoro'
  | 'one-thing'
  | 'distraction-dump'
  | 'reset'
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
    title: 'Focus sprint',
    description: 'Stay with one task for a few minutes.',
    available: true,
  },
  {
    id: 'pomodoro',
    emoji: '🍅',
    title: 'Pomodoro',
    description: 'Focus for a while, then take a real break.',
    available: false,
  },
  {
    id: 'one-thing',
    emoji: '🎯',
    title: 'One thing only',
    description: 'Put one task in front of you. Park everything else.',
    available: false,
  },
  {
    id: 'distraction-dump',
    emoji: '🧠',
    title: 'Distraction dump',
    description: 'Catch side thoughts without leaving your task.',
    available: false,
  },
  {
    id: 'reset',
    emoji: '⚡',
    title: 'Reset my focus',
    description: 'Lost the thread? Reconnect to what you were doing.',
    available: false,
  },
  {
    id: 'challenge',
    emoji: '🎲',
    title: 'Make it a challenge',
    description: 'Give a boring task a small target and beat the clock.',
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
