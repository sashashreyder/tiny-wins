import { MoodType } from '@/types';

export type MoodSupportToolId =
  | 'brain-dump'
  | 'focus'
  | 'tiny-wins'
  | 'self-care'
  | 'sleep'
  | 'water'
  | 'garden'
  | 'cant-start';

export type MoodSupportRecommendation = {
  id: MoodSupportToolId;
  icon: string;
  title: string;
  explanation: string;
  actionLabel: string;
  route: string;
};

const TOOLS: Record<MoodSupportToolId, MoodSupportRecommendation> = {
  'brain-dump': {
    id: 'brain-dump',
    icon: '🧠',
    title: 'Brain Dump',
    explanation: 'Get the thoughts out of your head.',
    actionLabel: 'Open Brain Dump',
    route: '/journal',
  },
  focus: {
    id: 'focus',
    icon: '⏱',
    title: 'Focus',
    explanation: 'Give one thing a little structure.',
    actionLabel: 'Open Focus',
    route: '/focus',
  },
  'tiny-wins': {
    id: 'tiny-wins',
    icon: '✨',
    title: 'Tiny Wins',
    explanation: 'Notice something that already counted today.',
    actionLabel: 'Open Tiny Wins',
    route: '/tiny-wins',
  },
  'self-care': {
    id: 'self-care',
    icon: '🧴',
    title: 'Self-Care',
    explanation: 'Do one small thing for your body or brain.',
    actionLabel: 'Open Self-Care',
    route: '/self-care',
  },
  sleep: {
    id: 'sleep',
    icon: '🌙',
    title: 'Sleep',
    explanation: 'Check in with rest and sleep.',
    actionLabel: 'Open Sleep',
    route: '/sleep',
  },
  water: {
    id: 'water',
    icon: '💧',
    title: 'Water',
    explanation: 'Check your water today.',
    actionLabel: 'Open Water',
    route: '/water',
  },
  garden: {
    id: 'garden',
    icon: '🌱',
    title: 'Garden',
    explanation: 'See the progress you’ve already made.',
    actionLabel: 'Open Garden',
    route: '/garden',
  },
  'cant-start': {
    id: 'cant-start',
    icon: '🧩',
    title: "Can't Start",
    explanation: 'Get help entering a task.',
    actionLabel: "Open Can't Start",
    route: '/cant-start',
  },
};

const MOOD_TOOLS: Record<MoodType, MoodSupportToolId[]> = {
  tired: ['sleep', 'water', 'self-care'],
  foggy: ['water', 'self-care', 'focus'],
  anxious: ['brain-dump', 'self-care', 'focus'],
  restless: ['focus', 'brain-dump', 'self-care'],
  wired: ['brain-dump', 'focus', 'self-care'],
  overwhelmed: ['brain-dump', 'cant-start', 'focus'],
  irritated: ['brain-dump', 'self-care'],
  sad: ['self-care', 'tiny-wins'],
  empty: ['self-care', 'tiny-wins'],
  'okay-ish': ['tiny-wins', 'focus'],
  hopeful: ['tiny-wins', 'garden', 'focus'],
  proud: ['tiny-wins', 'garden'],
};

const MAX_RECOMMENDATIONS = 3;

function normalizeFactor(factor: string): string {
  return factor.trim().toLowerCase();
}

function workBoosts(mood: MoodType): MoodSupportToolId[] {
  if (mood === 'overwhelmed') return ['cant-start', 'brain-dump', 'focus'];
  if (mood === 'anxious' || mood === 'irritated' || mood === 'wired' || mood === 'restless') {
    return ['brain-dump', 'focus'];
  }
  return ['focus', 'brain-dump'];
}

function factorBoosts(factor: string, mood: MoodType): MoodSupportToolId[] {
  switch (normalizeFactor(factor)) {
    case 'sleep':
      return ['sleep'];
    case 'food':
      return ['self-care'];
    case 'work':
      return workBoosts(mood);
    case 'too much waiting':
      return ['brain-dump', 'self-care'];
    case 'too much talking':
      return ['self-care'];
    case 'unknown':
      return [];
    default:
      return [];
  }
}

function prependUnique(
  list: MoodSupportToolId[],
  additions: MoodSupportToolId[],
): MoodSupportToolId[] {
  const next = [...list];
  for (let index = additions.length - 1; index >= 0; index -= 1) {
    const id = additions[index];
    const existing = next.indexOf(id);
    if (existing !== -1) next.splice(existing, 1);
    next.unshift(id);
  }
  return next;
}

export function getMoodSupportRecommendations(
  mood: MoodType,
  factors: string[] = [],
): MoodSupportRecommendation[] {
  const ids = [...(MOOD_TOOLS[mood] ?? ['self-care', 'tiny-wins'])];
  const boosted: MoodSupportToolId[] = [];

  for (const factor of factors) {
    for (const id of factorBoosts(factor, mood)) {
      if (!boosted.includes(id)) boosted.push(id);
    }
  }

  const ranked = prependUnique(ids, boosted);
  const unique: MoodSupportToolId[] = [];
  for (const id of ranked) {
    if (!unique.includes(id)) unique.push(id);
  }

  return unique.slice(0, MAX_RECOMMENDATIONS).map((id) => TOOLS[id]);
}
