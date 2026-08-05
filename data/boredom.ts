// Local suggestion data for the prototype.
// A future optional AI provider can replace these helpers without changing the UI flow.

export type BoredomStage =
  | 'menu'
  | 'challenge'
  | 'interesting-part'
  | 'break-setup'
  | 'break-running'
  | 'break-result'
  | 'boring-tax'
  | 'complete';

export type BoredomMethod =
  | 'challenge'
  | 'interesting-part'
  | 'fun-break'
  | 'boring-tax';

export type BoredomTaskKind =
  | 'home'
  | 'screen-work'
  | 'writing-design'
  | 'messages-admin'
  | 'self-care'
  | 'general';

export type BoredomChallenge = {
  id: string;
  categoryLabel: string;
  text: string;
  explanation?: string;
  kinds: BoredomTaskKind[];
};

export type BoringTaxOption = {
  id: string;
  label: string;
};

export const BOREDOM_METHODS: {
  id: BoredomMethod;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'challenge',
    icon: '🎲',
    title: 'Roll a challenge',
    description: 'Add one playful rule and see whether it wakes the task up.',
  },
  {
    id: 'interesting-part',
    icon: '✨',
    title: 'Start with the interesting part',
    description: 'Ignore the correct order and begin with the part you care about most.',
  },
  {
    id: 'fun-break',
    icon: '🍬',
    title: 'Take a timed fun break',
    description: 'Switch on purpose, enjoy something briefly, and leave yourself a way back.',
  },
  {
    id: 'boring-tax',
    icon: '✂️',
    title: 'Remove the boring tax',
    description:
      'Use a shortcut, template, tool, or smaller standard instead of doing everything the hard way.',
  },
];

export const INTERESTING_PART_PRESETS: readonly string[] = [
  'The visual part',
  'The easiest part',
  'The part with a clear result',
  'The part I can finish quickly',
  'The part I already have an idea for',
];

export const BREAK_ACTIVITY_PRESETS: readonly string[] = [
  'Make coffee or tea',
  'Watch one short video',
  'Play one round',
  'Step outside',
  'Stretch',
  'Listen to one song',
];

export const BORING_TAX_OPTIONS: BoringTaxOption[] = [
  { id: 'template', label: 'Use a template' },
  { id: 'batch', label: 'Batch similar actions together' },
  { id: 'ask-help', label: 'Ask someone for help' },
  { id: 'tool-shortcut', label: 'Use a tool or shortcut' },
  { id: 'ai-draft', label: 'Let an AI tool draft one repetitive piece' },
  { id: 'minimum', label: 'Do the minimum useful version' },
  { id: 'skip', label: 'Skip one non-essential part' },
  { id: 'prepare-later', label: 'Prepare everything now and finish later' },
  { id: 'copy-structure', label: 'Copy a structure that already works' },
  { id: 'easier-next', label: 'Set up an easier version for next time' },
];

export const BOREDOM_COMPLETION_COPY: Record<
  BoredomMethod,
  { headline: string; body: string }
> = {
  challenge: {
    headline: 'You gave the task some novelty!',
    body: 'The task did not change, but the way you entered it did.',
  },
  'interesting-part': {
    headline: 'You followed the interesting thread!',
    body: 'Working out of order still counts as moving forward.',
  },
  'fun-break': {
    headline: 'You came back on purpose!',
    body: 'The break was part of the plan, not proof that you failed.',
  },
  'boring-tax': {
    headline: 'You made the task cheaper for your brain!',
    body: 'Using a shortcut is not cheating. It is good design.',
  },
};

const BOREDOM_KEYWORD_GROUPS: {
  kind: BoredomTaskKind;
  keywords: string[];
}[] = [
  {
    kind: 'home',
    keywords: [
      'clean',
      'cleaning',
      'kitchen',
      'dishes',
      'laundry',
      'room',
      'floor',
      'organize',
      'tidy',
      'vacuum',
      'shelf',
      'closet',
      'cook',
    ],
  },
  {
    kind: 'screen-work',
    keywords: [
      'spreadsheet',
      'data',
      'research',
      'project',
      'task',
      'computer',
      'laptop',
      'file',
      'admin',
      'work',
      'form',
    ],
  },
  {
    kind: 'writing-design',
    keywords: [
      'presentation',
      'slides',
      'design',
      'website',
      'layout',
      'figma',
      'canva',
      'article',
      'report',
      'script',
      'caption',
      'text',
      'document',
      'code',
      'component',
      'app',
    ],
  },
  {
    kind: 'messages-admin',
    keywords: [
      'message',
      'reply',
      'email',
      'whatsapp',
      'call',
      'respond',
      'invoice',
      'schedule',
      'appointment',
      'application',
    ],
  },
  {
    kind: 'self-care',
    keywords: [
      'shower',
      'teeth',
      'food',
      'eat',
      'meal',
      'medication',
      'meds',
      'dressed',
      'exercise',
      'walk',
    ],
  },
];

export const BOREDOM_CHALLENGES: BoredomChallenge[] = [
  {
    id: 'gen-easiest',
    categoryLabel: 'General',
    text: 'Do the easiest part first.',
    explanation: 'Skip the hard entrance and give your brain a quick win.',
    kinds: ['general'],
  },
  {
    id: 'gen-wrong-order',
    categoryLabel: 'General',
    text: 'Do it in the wrong order.',
    explanation: 'Correct order can wait. Momentum first.',
    kinds: ['general'],
  },
  {
    id: 'gen-three-moves',
    categoryLabel: 'General',
    text: 'Use only three moves.',
    explanation: 'Limit the steps so the task stops feeling endless.',
    kinds: ['general'],
  },
  {
    id: 'gen-ugly',
    categoryLabel: 'General',
    text: 'Make the ugliest acceptable version.',
    explanation: 'Ugly-and-done beats perfect-and-stuck.',
    kinds: ['general'],
  },
  {
    id: 'gen-friend',
    categoryLabel: 'General',
    text: 'Pretend you are helping a friend with it.',
    explanation: 'Helping someone else often feels lighter.',
    kinds: ['general'],
  },
  {
    id: 'gen-tomorrow',
    categoryLabel: 'General',
    text: 'Do only the part that will make tomorrow easier.',
    explanation: 'One helpful move is enough for now.',
    kinds: ['general'],
  },
  {
    id: 'gen-move-seat',
    categoryLabel: 'General',
    text: 'Change where you are sitting for one round.',
    explanation: 'A new spot can make the same task feel new.',
    kinds: ['general'],
  },
  {
    id: 'gen-tiny-reward',
    categoryLabel: 'General',
    text: 'Pick a tiny reward before you begin.',
    explanation: 'Decide the treat first, then take one step.',
    kinds: ['general'],
  },
  {
    id: 'gen-one-song',
    categoryLabel: 'General',
    text: 'Race one song, not the whole task.',
    explanation: 'Work until the song ends, then decide again.',
    kinds: ['general'],
  },
  {
    id: 'gen-visible',
    categoryLabel: 'General',
    text: 'Stop after one visible result.',
    explanation: 'One thing you can see is a real finish line.',
    kinds: ['general'],
  },
  {
    id: 'home-ten-items',
    categoryLabel: 'Home',
    text: 'Put away ten items before one song ends.',
    explanation: 'Race the song, not the whole room.',
    kinds: ['home'],
  },
  {
    id: 'home-square',
    categoryLabel: 'Home',
    text: 'Clear one visible square, not the whole room.',
    explanation: 'Shrink the battlefield to one small patch.',
    kinds: ['home'],
  },
  {
    id: 'home-one-type',
    categoryLabel: 'Home',
    text: 'Choose one type of object and collect only those.',
    explanation: 'Cups, papers, or clothes — pick a lane.',
    kinds: ['home'],
  },
  {
    id: 'home-before-photo',
    categoryLabel: 'Home',
    text: 'Take a before photo and improve one tiny area.',
    explanation: 'Make a small change you can actually see.',
    kinds: ['home'],
  },
  {
    id: 'home-timer-surface',
    categoryLabel: 'Home',
    text: 'Clear one surface for the length of one song.',
    kinds: ['home'],
  },
  {
    id: 'screen-one-window',
    categoryLabel: 'Screen / work',
    text: 'Close everything except the one window you need.',
    explanation: 'Give the task the whole screen for a minute.',
    kinds: ['screen-work'],
  },
  {
    id: 'screen-seven',
    categoryLabel: 'Screen / work',
    text: 'Give yourself seven minutes to make one visible change.',
    explanation: 'One change is enough to break the freeze.',
    kinds: ['screen-work'],
  },
  {
    id: 'screen-satisfying',
    categoryLabel: 'Screen / work',
    text: 'Start with the most satisfying part of the screen.',
    kinds: ['screen-work'],
  },
  {
    id: 'screen-batch-three',
    categoryLabel: 'Screen / work',
    text: 'Batch three tiny similar actions.',
    explanation: 'Same kind of click, three times, then stop.',
    kinds: ['screen-work'],
  },
  {
    id: 'screen-rename',
    categoryLabel: 'Screen / work',
    text: 'Rename the file or tab so the next step is obvious.',
    kinds: ['screen-work'],
  },
  {
    id: 'write-liked',
    categoryLabel: 'Writing / design',
    text: 'Start with the section, image, or title you actually like.',
    explanation: 'Interest first, polish later.',
    kinds: ['writing-design'],
  },
  {
    id: 'write-placeholders',
    categoryLabel: 'Writing / design',
    text: 'Use placeholders for everything boring.',
    explanation: 'Put “TBD” where your brain stalls.',
    kinds: ['writing-design'],
  },
  {
    id: 'write-dramatic',
    categoryLabel: 'Writing / design',
    text: 'Make one intentionally dramatic version.',
    explanation: 'Overdo it on purpose, then dial it back.',
    kinds: ['writing-design'],
  },
  {
    id: 'write-fun-first',
    categoryLabel: 'Writing / design',
    text: 'Design the fun part before filling in the rest.',
    kinds: ['writing-design'],
  },
  {
    id: 'write-ugly-draft',
    categoryLabel: 'Writing / design',
    text: 'Write or sketch the messiest acceptable draft for five minutes.',
    kinds: ['writing-design'],
  },
  {
    id: 'msg-shortest',
    categoryLabel: 'Messages / admin',
    text: 'Write the shortest acceptable version.',
    explanation: 'Clarity beats polish when you are stuck.',
    kinds: ['messages-admin'],
  },
  {
    id: 'msg-batch',
    categoryLabel: 'Messages / admin',
    text: 'Batch three similar replies.',
    kinds: ['messages-admin'],
  },
  {
    id: 'msg-yes-no',
    categoryLabel: 'Messages / admin',
    text: 'Turn the task into three yes-or-no decisions.',
    explanation: 'Shrink admin work into tiny choices.',
    kinds: ['messages-admin'],
  },
  {
    id: 'msg-template',
    categoryLabel: 'Messages / admin',
    text: 'Use one reusable sentence as a template.',
    kinds: ['messages-admin'],
  },
  {
    id: 'msg-subject-first',
    categoryLabel: 'Messages / admin',
    text: 'Write only the subject line or opening sentence first.',
    kinds: ['messages-admin'],
  },
  {
    id: 'care-smallest',
    categoryLabel: 'Self-care',
    text: 'Do the smallest version that still counts.',
    explanation: 'A partial reset still helps.',
    kinds: ['self-care'],
  },
  {
    id: 'care-setup',
    categoryLabel: 'Self-care',
    text: 'Set up the next step without finishing the whole thing.',
    kinds: ['self-care'],
  },
  {
    id: 'care-song',
    categoryLabel: 'Self-care',
    text: 'Do one self-care action for the length of one song.',
    kinds: ['self-care'],
  },
  {
    id: 'care-body-first',
    categoryLabel: 'Self-care',
    text: 'Start with the body part that feels easiest right now.',
    kinds: ['self-care'],
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesKeyword(normalizedText: string, keyword: string): boolean {
  const normalizedKeyword = keyword.toLowerCase().trim();
  if (!normalizedKeyword) return false;

  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword);
  }

  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}(?:$|[^a-z0-9])`);
  return pattern.test(normalizedText);
}

export function inferBoredomTaskKind(taskText: string): BoredomTaskKind {
  const normalized = taskText.toLowerCase().trim();
  if (!normalized) return 'general';

  for (const group of BOREDOM_KEYWORD_GROUPS) {
    for (const keyword of group.keywords) {
      if (matchesKeyword(normalized, keyword)) {
        return group.kind;
      }
    }
  }

  return 'general';
}

function challengePoolForKind(taskKind: BoredomTaskKind): BoredomChallenge[] {
  const specific = BOREDOM_CHALLENGES.filter((challenge) => challenge.kinds.includes(taskKind));
  const general = BOREDOM_CHALLENGES.filter((challenge) => challenge.kinds.includes('general'));

  if (taskKind === 'general') {
    return general.length > 0 ? general : BOREDOM_CHALLENGES;
  }

  const combined = [...specific, ...general];
  return combined.length > 0 ? combined : BOREDOM_CHALLENGES;
}

export function pickBoredomChallenge(
  taskKind: BoredomTaskKind,
  previousChallengeId?: string,
): BoredomChallenge {
  const pool = challengePoolForKind(taskKind);
  const filtered =
    previousChallengeId && pool.length > 1
      ? pool.filter((challenge) => challenge.id !== previousChallengeId)
      : pool;

  return filtered[Math.floor(Math.random() * filtered.length)] ?? BOREDOM_CHALLENGES[0];
}

export function getBoredomChallengeById(id: string | null | undefined): BoredomChallenge | null {
  if (!id) return null;
  return BOREDOM_CHALLENGES.find((challenge) => challenge.id === id) ?? null;
}

function capitalizeSnippet(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const snippet = trimmed.slice(0, maxLength);
  return snippet.charAt(0).toUpperCase() + snippet.slice(1);
}

export function buildBoredomWinTitle(params: {
  method: BoredomMethod;
  challengeText?: string;
  interestingPart?: string;
  taskText?: string;
  boringTaxLabel?: string;
}): string {
  const { method, challengeText, interestingPart, taskText, boringTaxLabel } = params;

  let title: string;
  switch (method) {
    case 'challenge': {
      const challenge = capitalizeSnippet(challengeText ?? '', 40);
      title = challenge
        ? `Tried a boredom challenge: ${challenge}`
        : 'Tried a boredom challenge';
      break;
    }
    case 'interesting-part': {
      const part = capitalizeSnippet(interestingPart ?? '', 40);
      title = part
        ? `Started with the interesting part: ${part}`
        : 'Started with the interesting part';
      break;
    }
    case 'fun-break': {
      const task = capitalizeSnippet(taskText ?? '', 40);
      title = task
        ? `Returned after an intentional break: ${task}`
        : 'Returned after an intentional break';
      break;
    }
    case 'boring-tax': {
      const shortcut = capitalizeSnippet(boringTaxLabel ?? '', 40);
      title = shortcut ? `Removed boring tax: ${shortcut}` : 'Removed boring tax';
      break;
    }
  }

  return title.slice(0, 80);
}

export function formatBoringTaxSummary(labels: string[]): string {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];

  return labels
    .map((label, index) => {
      if (index === 0) return label;
      const trimmed = label.trim();
      if (!trimmed) return trimmed;
      return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    })
    .join(' + ');
}
