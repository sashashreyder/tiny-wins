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

const MOOD_TOOLS: Partial<Record<MoodType, MoodSupportToolId[]>> = {
  tired: ['sleep', 'water', 'self-care'],
  foggy: ['water', 'self-care', 'focus'],
  anxious: ['brain-dump', 'self-care', 'focus'],
  worried: ['brain-dump', 'self-care', 'focus'],
  restless: ['focus', 'brain-dump', 'self-care'],
  wired: ['brain-dump', 'focus', 'self-care'],
  overwhelmed: ['brain-dump', 'cant-start', 'focus'],
  irritated: ['brain-dump', 'self-care'],
  frustrated: ['brain-dump', 'cant-start', 'focus'],
  angry: ['brain-dump', 'self-care'],
  sad: ['self-care', 'tiny-wins'],
  lonely: ['self-care', 'tiny-wins'],
  empty: ['self-care', 'tiny-wins'],
  numb: ['self-care', 'brain-dump'],
  detached: ['self-care', 'tiny-wins'],
  guilty: ['brain-dump', 'self-care'],
  disappointed: ['self-care', 'tiny-wins'],
  rejected: ['brain-dump', 'self-care'],
  'okay-ish': ['tiny-wins', 'focus'],
  calm: ['self-care', 'garden'],
  content: ['tiny-wins', 'garden'],
  hopeful: ['tiny-wins', 'garden', 'focus'],
  proud: ['tiny-wins', 'garden'],
  grateful: ['tiny-wins', 'garden'],
  relieved: ['self-care', 'tiny-wins'],
  excited: ['focus', 'tiny-wins'],
  energized: ['focus', 'tiny-wins'],
  confident: ['focus', 'tiny-wins'],
  connected: ['tiny-wins', 'garden'],
  motivated: ['focus', 'tiny-wins', 'cant-start'],
  curious: ['focus', 'brain-dump'],
  happy: ['tiny-wins', 'garden'],
  playful: ['tiny-wins', 'garden'],
  distracted: ['focus', 'brain-dump', 'water'],
  uncertain: ['brain-dump', 'focus'],
  bored: ['focus', 'tiny-wins'],
  surprised: ['brain-dump', 'focus'],
  thoughtful: ['brain-dump', 'garden'],
  stressed: ['self-care', 'brain-dump', 'focus'],
  scared: ['self-care', 'brain-dump'],
};

const MAX_RECOMMENDATIONS = 3;

function normalizeFactor(factor: string): string {
  return factor.trim().toLowerCase();
}

function toolsForMood(mood: MoodType): MoodSupportToolId[] {
  return MOOD_TOOLS[mood] ?? ['self-care', 'tiny-wins'];
}

function factorBoosts(factor: string, moods: MoodType[]): MoodSupportToolId[] {
  switch (normalizeFactor(factor)) {
    case 'sleep':
      return ['sleep'];
    case 'health':
    case 'food':
    case 'fitness':
    case 'self-care':
      return ['self-care'];
    case 'hobbies':
      return ['tiny-wins', 'garden'];
    case 'work':
    case 'tasks':
    case 'education':
      if (moods.includes('overwhelmed')) return ['cant-start', 'brain-dump', 'focus'];
      if (moods.some((mood) => ['anxious', 'worried', 'irritated', 'wired', 'restless', 'frustrated'].includes(mood))) {
        return ['brain-dump', 'focus'];
      }
      return ['focus', 'brain-dump'];
    case 'waiting':
    case 'too much waiting':
      return ['brain-dump', 'self-care'];
    case 'overstimulation':
    case 'too much talking':
      return ['self-care', 'brain-dump'];
    case 'family':
    case 'friends':
    case 'relationship':
    case 'partner / relationship':
    case 'dating':
    case 'social life':
    case 'community':
    case 'identity':
      return ['self-care', 'brain-dump'];
    case 'home':
      return ['cant-start', 'tiny-wins'];
    case 'money':
    case 'current events':
      return ['brain-dump', 'self-care'];
    case 'hormones':
    case 'medication':
      return ['self-care', 'sleep'];
    case 'travel':
    case 'weather':
      return ['self-care'];
    case 'unknown':
    case 'not sure':
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
  moods: MoodType | MoodType[],
  factors: string[] = [],
): MoodSupportRecommendation[] {
  const selected = (Array.isArray(moods) ? moods : [moods]).filter(Boolean);
  const ids: MoodSupportToolId[] = [];

  for (const mood of selected) {
    for (const id of toolsForMood(mood)) {
      if (!ids.includes(id)) ids.push(id);
    }
  }

  const boosted: MoodSupportToolId[] = [];
  for (const factor of factors) {
    for (const id of factorBoosts(factor, selected)) {
      if (!boosted.includes(id)) boosted.push(id);
    }
  }

  const ranked = prependUnique(ids.length ? ids : ['self-care', 'tiny-wins'], boosted);
  const unique: MoodSupportToolId[] = [];
  for (const id of ranked) {
    if (!unique.includes(id)) unique.push(id);
  }

  return unique.slice(0, MAX_RECOMMENDATIONS).map((id) => TOOLS[id]);
}
