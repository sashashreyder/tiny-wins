import { TinyWinCategory } from '@/types';

export type TaskContext =
  | 'screen'
  | 'physical-home'
  | 'message-call'
  | 'self-care'
  | 'going-somewhere'
  | 'other';

export type TaskFlowTemplate = {
  category: TinyWinCategory;
  singleSteps: string[];
  checklistSteps: string[];
};

export const taskFlowTemplates: Record<TaskContext, TaskFlowTemplate> = {
  screen: {
    category: 'work-study',
    singleSteps: [
      'Open the file, page, or app you need.',
      'Choose the smallest visible part of the task.',
      'Make one rough placeholder, sentence, slide, or change.',
      'Work on only that piece for two minutes.',
    ],
    checklistSteps: [
      'Open the file, page, or app',
      'Name the smallest visible result',
      'Make one rough first piece',
      'Choose whether to continue or stop',
    ],
  },
  'physical-home': {
    category: 'home',
    singleSteps: [
      'Go to the place where the task happens.',
      'Move, remove, or prepare one item.',
      'Choose one very small area or action.',
      'Work only on that part for two minutes.',
    ],
    checklistSteps: [
      'Go to the task area',
      'Prepare or move one item',
      'Do one small visible part',
      'Pause and decide what is next',
    ],
  },
  'message-call': {
    category: 'social-admin',
    singleSteps: [
      'Open the conversation or find the contact.',
      'Write one rough first sentence. Do not send it yet.',
      'Finish a short imperfect draft.',
      'Choose: send it, save it, or schedule it.',
    ],
    checklistSteps: [
      'Open the conversation or contact',
      'Write a rough first sentence',
      'Finish a short draft',
      'Send, save, or schedule it',
    ],
  },
  'self-care': {
    category: 'self-care',
    singleSteps: [
      'Bring one thing you need closer.',
      'Prepare the smallest possible version of the task.',
      'Do one basic action only.',
      'Decide whether your body has capacity for one more.',
    ],
    checklistSteps: [
      'Bring what you need closer',
      'Prepare the smallest version',
      'Do one basic self-care action',
      'Pause and check what you need now',
    ],
  },
  'going-somewhere': {
    category: 'body-reset',
    singleSteps: [
      'Put one thing you need by the door.',
      'Get ready in one small way.',
      'Open the address, map, or appointment details.',
      'Move to the door. You do not have to leave yet.',
    ],
    checklistSteps: [
      'Put one needed item by the door',
      'Get ready in one small way',
      'Check the address or details',
      'Move to the door',
    ],
  },
  other: {
    category: 'work-study',
    singleSteps: [
      'Bring the task one small step closer.',
      'Name one visible action you could take.',
      'Do the roughest possible version of that action.',
      'Pause and decide whether to continue.',
    ],
    checklistSteps: [
      'Bring the task closer',
      'Name one visible action',
      'Do a rough first version',
      'Pause and choose what is next',
    ],
  },
};
