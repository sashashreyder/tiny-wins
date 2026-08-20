export type AttentionResetStage = 'reset' | 'complete';

export type AttentionPriority = 'low' | 'medium' | 'high';

export type AttentionTask = {
  id: string;
  title: string;
  priority: AttentionPriority;
  deadline: string;
  completed: boolean;
};

export const ATTENTION_ITEM_MAX = 12;
export const ATTENTION_ITEM_CHAR_MAX = 80;
export const ATTENTION_DEADLINE_MAX = 40;

export const ATTENTION_PRIORITIES: {
  id: AttentionPriority;
  label: string;
}[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export const QUICK_RESET_ITEMS = [
  'Close or hide unrelated windows',
  'Put the phone out of reach for one round',
  'Leave one task visible',
] as const;

export function makeAttentionTaskId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeAttentionTask(
  title: string,
  priority: AttentionPriority,
  deadline: string,
): AttentionTask {
  return {
    id: makeAttentionTaskId(),
    title: title.trim().slice(0, ATTENTION_ITEM_CHAR_MAX),
    priority,
    deadline: deadline.trim().slice(0, ATTENTION_DEADLINE_MAX),
    completed: false,
  };
}

export function attentionTaskTitleKey(title: string): string {
  return title.trim().toLowerCase();
}

export function canAddAttentionTask(
  existing: AttentionTask[],
  title: string,
): 'empty' | 'duplicate' | 'max' | 'ok' {
  const trimmed = title.trim();
  if (!trimmed) return 'empty';
  if (existing.length >= ATTENTION_ITEM_MAX) return 'max';
  const key = attentionTaskTitleKey(trimmed);
  if (existing.some((task) => attentionTaskTitleKey(task.title) === key)) return 'duplicate';
  return 'ok';
}

export function buildAttentionWinTitle(activeItem: string): string {
  const trimmed = activeItem.trim();
  if (trimmed) {
    return `Reduced the noise: ${trimmed}`.slice(0, 80);
  }
  return 'Reduced competing distractions';
}
