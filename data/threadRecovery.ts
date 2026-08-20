export type ThreadRecoveryStage = 'find' | 'complete';

export type ThreadContextKind =
  | 'screen'
  | 'message'
  | 'home'
  | 'errand'
  | 'writing'
  | 'other';

export const THREAD_CONTEXT_MAX = 80;
export const THREAD_MEMORY_MAX = 160;
export const THREAD_TEXT_MAX = 160;
export const THREAD_NOTE_MAX = 180;

export const THREAD_CONTEXT_OPTIONS: {
  id: ThreadContextKind;
  emoji: string;
  label: string;
}[] = [
  { id: 'screen', emoji: '💻', label: 'Something on a screen' },
  { id: 'message', emoji: '💬', label: 'A message or conversation' },
  { id: 'home', emoji: '🏠', label: 'A physical / home task' },
  { id: 'errand', emoji: '🚶', label: 'An errand or somewhere outside' },
  { id: 'writing', emoji: '📝', label: 'Writing or creating' },
  { id: 'other', emoji: '✨', label: 'Something else' },
];

export const THREAD_SUGGESTIONS: Record<ThreadContextKind, string[]> = {
  screen: [
    'Reopen the file or page I was using',
    'Look at the last thing I changed',
    'Find the unfinished section',
    'Check the last open tab that belongs to this task',
  ],
  message: [
    'Open the conversation',
    'Read the last message',
    'Find the question I was answering',
    'Look at my unfinished reply',
  ],
  home: [
    'Go back to the task area',
    'Look at what is already moved or unfinished',
    'Pick up the item I was using',
    'Find the last visible change I made',
  ],
  errand: [
    'Check where I am in the route',
    'Look at the last thing I completed',
    'Find the next place or item I needed',
    'Open the note or list I was following',
  ],
  writing: [
    'Read the last paragraph or section',
    'Look at the last thing I edited',
    'Find the unfinished piece',
    'Reopen the reference I was using',
  ],
  other: [
    'Return to the last visible clue',
    'Look at what changed most recently',
    'Find the unfinished part',
    'Write one sentence about where I left off',
  ],
};

export function getThreadSuggestions(kind: ThreadContextKind | null): string[] {
  if (!kind) return THREAD_SUGGESTIONS.other;
  return THREAD_SUGGESTIONS[kind];
}

export function getThreadContextLabel(kind: ThreadContextKind | null): string {
  if (!kind) return '';
  return THREAD_CONTEXT_OPTIONS.find((option) => option.id === kind)?.label ?? '';
}

export function formatComebackTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildThreadWinTitle(context: string): string {
  const trimmed = context.trim();
  if (trimmed) {
    return `Found my thread: ${trimmed}`.slice(0, 80);
  }
  return 'Found my way back into a task';
}

export function buildFutureNoteDraft(threadText: string): string {
  const trimmed = threadText.trim();
  if (!trimmed) return '';
  const prefixed = trimmed.toLowerCase().startsWith('next:') ? trimmed : `Next: ${trimmed}`;
  return prefixed.slice(0, THREAD_NOTE_MAX);
}
