export type VersionZeroStage = 'menu' | 'active' | 'complete';

export type VersionZeroMode = 'private-draft' | 'skeleton' | 'throwaway';

export type VersionZeroTaskKind =
  | 'presentation'
  | 'message'
  | 'design'
  | 'writing'
  | 'code'
  | 'general';

export type PressureRuleState = 'paper' | 'crumpled' | 'trashed';

export const VERSION_ZERO_MODES: {
  id: VersionZeroMode;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'private-draft',
    icon: '🙈',
    title: 'Private draft',
    description: 'Make a version nobody else has to see.',
  },
  {
    id: 'skeleton',
    icon: '🦴',
    title: 'Skeleton only',
    description: 'Use only headings, boxes, bullets, or placeholders.',
  },
  {
    id: 'throwaway',
    icon: '🗑️',
    title: 'Throwaway version',
    description: 'Make one attempt you are completely allowed to delete later.',
  },
];

export const VERSION_ZERO_REMINDERS: readonly string[] = [
  'Bad is editable. Blank is not.',
  'The first draft is material, not a verdict.',
  'Nobody sees Version Zero unless you choose to show it.',
  'You are not proving your talent right now.',
  'Awkward beginnings are part of making good things.',
  'You can improve something that exists.',
  'This version is allowed to be incomplete and weird.',
  'Your job is not to impress anyone yet.',
  'A rough attempt is information, not failure.',
  'Good work is usually edited work.',
  'Mistakes are allowed in a version built to be changed.',
  'The first try does not have to know what it is doing yet.',
];

export const VERSION_ZERO_KEYWORD_GROUPS: {
  kind: VersionZeroTaskKind;
  keywords: string[];
}[] = [
  {
    kind: 'presentation',
    keywords: ['presentation', 'slides', 'powerpoint', 'keynote', 'pitch', 'deck'],
  },
  {
    kind: 'message',
    keywords: ['message', 'email', 'reply', 'text', 'whatsapp', 'call', 'response'],
  },
  {
    kind: 'design',
    keywords: [
      'design',
      'website',
      'page',
      'screen',
      'layout',
      'figma',
      'canva',
      'logo',
      'interface',
      'ui',
    ],
  },
  {
    kind: 'writing',
    keywords: [
      'report',
      'article',
      'essay',
      'text',
      'document',
      'post',
      'caption',
      'script',
      'resume',
      'cv',
      'writing',
    ],
  },
  {
    kind: 'code',
    keywords: [
      'code',
      'component',
      'function',
      'app',
      'bug',
      'feature',
      'react',
      'typescript',
      'javascript',
    ],
  },
];

const TASK_KIND_LABELS: Record<VersionZeroTaskKind, string> = {
  presentation: 'Presentation',
  message: 'Message',
  design: 'Design',
  writing: 'Writing',
  code: 'Code',
  general: 'your task',
};

const MODE_LABELS: Record<VersionZeroMode, string> = {
  'private-draft': 'Private draft',
  skeleton: 'Skeleton only',
  throwaway: 'Throwaway version',
};

export const VERSION_ZERO_PROMPTS: Record<
  VersionZeroTaskKind,
  Record<VersionZeroMode, string>
> = {
  presentation: {
    'private-draft':
      'Create one private slide and put the rough main point in the middle. Nobody else has to see it.',
    skeleton: 'Make three empty slides and give each one a rough title. No design yet.',
    throwaway:
      'Make a deliberately awkward opening slide. You are allowed to delete it later.',
  },
  message: {
    'private-draft':
      'Write the honest, unpolished version somewhere private. Do not send it yet.',
    skeleton:
      'Write three bullets: what happened, what they need to know, and what you need next.',
    throwaway: 'Write a blunt version you will not send. You can soften it later.',
  },
  design: {
    'private-draft': 'Make one private wireframe using only boxes and labels.',
    skeleton:
      'Place the main sections with simple boxes. No colours, icons, or perfect spacing yet.',
    throwaway: 'Make a deliberately awkward layout. Keep only one useful idea from it.',
  },
  writing: {
    'private-draft': 'Write three messy sentences for your eyes only.',
    skeleton: 'Write three rough headings and one bullet under each.',
    throwaway: 'Write an intentionally rough opening paragraph. You may delete it later.',
  },
  code: {
    'private-draft':
      'Create a scratch file and write one rough function, comment, or experiment.',
    skeleton:
      'Write function names, component names, or TODO comments before making anything work.',
    throwaway: 'Make a disposable experiment that only proves one small idea is possible.',
  },
  general: {
    'private-draft': 'Make one private rough attempt that nobody else has to see.',
    skeleton: 'Create only the outline: headings, boxes, bullets, or placeholders.',
    throwaway: 'Make one version you are completely allowed to delete.',
  },
};

export function inferVersionZeroTaskKind(taskText: string): VersionZeroTaskKind {
  const normalized = taskText.toLowerCase().trim();
  if (!normalized) return 'general';

  for (const group of VERSION_ZERO_KEYWORD_GROUPS) {
    for (const keyword of group.keywords) {
      if (normalized.includes(keyword)) {
        return group.kind;
      }
    }
  }

  return 'general';
}

export function getVersionZeroPrompt(
  taskKind: VersionZeroTaskKind,
  mode: VersionZeroMode,
): string {
  return VERSION_ZERO_PROMPTS[taskKind][mode];
}

export function getVersionZeroTaskKindLabel(kind: VersionZeroTaskKind): string {
  return TASK_KIND_LABELS[kind];
}

export function getVersionZeroModeLabel(mode: VersionZeroMode): string {
  return MODE_LABELS[mode];
}

export function pickVersionZeroReminder(exclude?: string): string {
  const pool = exclude
    ? VERSION_ZERO_REMINDERS.filter((reminder) => reminder !== exclude)
    : [...VERSION_ZERO_REMINDERS];
  return pool[Math.floor(Math.random() * pool.length)] ?? VERSION_ZERO_REMINDERS[0];
}

export function buildVersionZeroWinTitle(
  taskText: string,
  taskKind: VersionZeroTaskKind,
): string {
  if (taskText.trim()) {
    if (taskKind !== 'general') {
      return `Made Version Zero: ${getVersionZeroTaskKindLabel(taskKind)}`;
    }
    const snippet = taskText.trim().slice(0, 40);
    const capitalized = snippet.charAt(0).toUpperCase() + snippet.slice(1);
    return `Made Version Zero: ${capitalized}`;
  }
  return 'Made a Version Zero';
}
