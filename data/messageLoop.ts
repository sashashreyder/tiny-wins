// Local reply templates for the prototype.
// A future optional AI provider may personalize drafts without changing the UI flow.

export type MessageLoopStage =
  | 'menu'
  | 'quick-setup'
  | 'quick-running'
  | 'quick-result'
  | 'reply-builder'
  | 'late-reply'
  | 'protect-energy'
  | 'complete';

export type MessageLoopMethod =
  | 'close-quickly'
  | 'build-reply'
  | 'late-reply'
  | 'protect-energy';

export type ReplyIntent =
  | 'acknowledge'
  | 'need-time'
  | 'answer-main-question'
  | 'clarify'
  | 'confirm'
  | 'decline'
  | 'custom';

export type LateReplyOpener =
  | 'sorry-slow'
  | 'thanks-patience'
  | 'meant-to-return'
  | 'later-than-planned'
  | 'answer-directly';

export type LateReplyAction =
  | 'answer-now'
  | 'ask-for-time'
  | 'confirm'
  | 'decline'
  | 'clarify';

export type EnergyProtectionChoice =
  | 'unsent-draft'
  | 'necessary-only'
  | 'ask-for-time'
  | 'set-boundary'
  | 'no-reply-needed'
  | 'ask-someone-to-check';

export const MESSAGE_LOOP_METHODS: {
  id: MessageLoopMethod;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'close-quickly',
    icon: '⏱',
    title: 'Close the loop quickly',
    description:
      'Start a stopwatch, answer the message, and see how long the task really took.',
  },
  {
    id: 'build-reply',
    icon: '✍️',
    title: "I don't know what to say",
    description: 'Build the smallest acceptable reply and edit it before sending.',
  },
  {
    id: 'late-reply',
    icon: '🕰',
    title: 'It has been too long',
    description: 'Reply after a delay without writing a five-page apology.',
  },
  {
    id: 'protect-energy',
    icon: '🛡',
    title: 'This message drains me',
    description:
      'Protect your energy, set a boundary, or decide what kind of response is actually necessary.',
  },
];

export const QUICK_CLOSE_GOAL_PRESETS: readonly string[] = [
  'Send a short reply',
  'Answer the main question',
  'Ask for more time',
  'Confirm or decline',
  'Make a clear decision',
  'Write my own finish line',
];

export const REPLY_INTENTS: {
  id: ReplyIntent;
  title: string;
  description: string;
}[] = [
  {
    id: 'acknowledge',
    title: 'Acknowledge the message',
    description: 'Let them know you saw it.',
  },
  {
    id: 'need-time',
    title: 'Ask for more time',
    description: 'Reply now without producing the full answer yet.',
  },
  {
    id: 'answer-main-question',
    title: 'Answer the main question only',
    description: 'Skip everything that is not necessary.',
  },
  {
    id: 'clarify',
    title: 'Ask one clarifying question',
    description: 'Find out what they actually need.',
  },
  {
    id: 'confirm',
    title: 'Confirm something',
    description: 'Give a clear yes, agreement, or acknowledgment.',
  },
  {
    id: 'decline',
    title: 'Politely decline',
    description: 'Say no without writing a defence essay.',
  },
  {
    id: 'custom',
    title: 'Write my own intention',
    description: 'Describe what the reply needs to do.',
  },
];

export const LATE_REPLY_OPENERS: {
  id: LateReplyOpener;
  label: string;
}[] = [
  { id: 'sorry-slow', label: 'Sorry for the slow reply.' },
  { id: 'thanks-patience', label: 'Thanks for your patience.' },
  {
    id: 'meant-to-return',
    label: 'I saw this earlier and meant to come back to it.',
  },
  {
    id: 'later-than-planned',
    label: "I'm replying later than I planned, but…",
  },
  { id: 'answer-directly', label: 'Skip the apology and answer directly.' },
];

export const LATE_REPLY_ACTIONS: {
  id: LateReplyAction;
  label: string;
}[] = [
  { id: 'answer-now', label: 'Answer now' },
  { id: 'ask-for-time', label: 'Ask for more time' },
  { id: 'confirm', label: 'Confirm something' },
  { id: 'decline', label: 'Politely decline' },
  { id: 'clarify', label: 'Ask a clarifying question' },
];

export const ENERGY_PROTECTION_OPTIONS: {
  id: EnergyProtectionChoice;
  title: string;
  description: string;
}[] = [
  {
    id: 'unsent-draft',
    title: 'Write it, but do not send it yet',
    description: 'Get the emotional first version out of your head.',
  },
  {
    id: 'necessary-only',
    title: 'Reply with only the necessary information',
    description: 'Remove explanations that the other person does not need.',
  },
  {
    id: 'ask-for-time',
    title: 'Ask for more time',
    description: 'Create space before giving a full response.',
  },
  {
    id: 'set-boundary',
    title: 'Set a boundary',
    description: 'State what you can or cannot do.',
  },
  {
    id: 'no-reply-needed',
    title: 'Decide that no reply is needed',
    description: 'Some messages do not require more access to your energy.',
  },
  {
    id: 'ask-someone-to-check',
    title: 'Ask someone to check my draft',
    description: 'Get another pair of eyes before sending.',
  },
];

export const MINIMUM_REPLY_EXAMPLES: Record<ReplyIntent, string> = {
  acknowledge: 'Hi — I saw your message. Thank you for reaching out.',
  'need-time':
    "Hi — I saw your message. I don't have a full answer yet, but I can get back to you by [day or time].",
  'answer-main-question': 'Hi — the short answer is: [write the main answer here].',
  clarify:
    'Hi — could you clarify [what you need to know]? Then I can give you a more useful answer.',
  confirm: 'Yes, that works for me. Thank you.',
  decline: "Thanks for asking. I won't be able to do that.",
  custom: 'Hi — [write the one thing this reply needs to do].',
};

export const MESSAGE_LOOP_COMPLETION_COPY: Record<
  MessageLoopMethod,
  { headline: string; body: string }
> = {
  'close-quickly': {
    headline: 'Loop closed!',
    body: 'The message is no longer waiting in the background.',
  },
  'build-reply': {
    headline: 'You turned “I don’t know what to say” into words!',
    body: 'The reply did not need to be perfect. It only needed to exist.',
  },
  'late-reply': {
    headline: 'Late still became answered!',
    body: 'You returned without writing an apology novel.',
  },
  'protect-energy': {
    headline: 'You made a clear decision!',
    body: 'A short reply, a boundary, or no reply can all protect your attention.',
  },
};

export const ENERGY_PROTECTION_CTA: Record<EnergyProtectionChoice, string> = {
  'unsent-draft': 'I sent the useful version',
  'necessary-only': 'I sent the necessary reply',
  'ask-for-time': 'I asked for more time',
  'set-boundary': 'I sent my boundary',
  'no-reply-needed': 'I decided no reply is needed',
  'ask-someone-to-check': 'I shared the draft for feedback',
};

const LATE_OPENER_TEXT: Record<LateReplyOpener, string> = {
  'sorry-slow': 'Sorry for the slow reply.',
  'thanks-patience': 'Thanks for your patience.',
  'meant-to-return': 'I saw this earlier and meant to come back to it.',
  'later-than-planned': "I'm replying later than I planned, but",
  'answer-directly': '',
};

const LATE_ACTION_TEXT: Record<LateReplyAction, string> = {
  'answer-now': 'I saw your message, and the short answer is: [answer].',
  'ask-for-time':
    "I don't have a full answer yet, but I can get back to you by [day or time].",
  confirm: 'Yes, that works for me.',
  decline: "Thanks for asking. I won't be able to do that.",
  clarify: 'Could you clarify [what you need to know]?',
};

export function formatStopwatchTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function buildReplyDraft({
  intent,
  context,
}: {
  intent: ReplyIntent;
  context?: string;
}): string {
  const base = MINIMUM_REPLY_EXAMPLES[intent];
  const trimmedContext = context?.trim();
  if (!trimmedContext || intent === 'custom') {
    return base;
  }
  // Context stays local and is never required; templates remain generic.
  return base;
}

export function buildLateReplyDraft({
  opener,
  action,
  context: _context,
}: {
  opener: LateReplyOpener;
  action: LateReplyAction;
  context?: string;
}): string {
  const openerText = LATE_OPENER_TEXT[opener];
  const actionText = LATE_ACTION_TEXT[action];

  if (!openerText) {
    return actionText;
  }

  if (opener === 'later-than-planned') {
    const actionBody =
      actionText.charAt(0).toLowerCase() + actionText.slice(1);
    return `${openerText} ${actionBody}`;
  }

  return `${openerText} ${actionText}`;
}

export function buildBoundaryDraft(choice: EnergyProtectionChoice): string {
  switch (choice) {
    case 'necessary-only':
      return 'Hi — the information you need is: [write only the necessary facts].';
    case 'ask-for-time':
      return "I saw your message. I need a little more time before I can respond properly. I'll get back to you by [day or time].";
    case 'set-boundary':
      return "I'm not able to continue this conversation in this way. I can [state what you can offer], but I can't [state the boundary].";
    case 'ask-someone-to-check':
      return '';
    case 'unsent-draft':
      return '';
    case 'no-reply-needed':
      return '';
  }
}

function sanitizeWinContext(context?: string): string {
  if (!context) return '';
  return context.trim().replace(/\s+/g, ' ');
}

function clipForTitle(text: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (text.length <= maxLength) return text;
  if (maxLength <= 1) return text.slice(0, maxLength);
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function titleWithContext(prefix: string, context: string, suffix = ''): string {
  const safeContext = sanitizeWinContext(context);
  if (!safeContext) {
    return `${prefix}${suffix}`.slice(0, 80);
  }
  const joiner = ' ';
  const available = 80 - prefix.length - suffix.length - joiner.length;
  const clipped = clipForTitle(safeContext, available);
  if (!clipped) {
    return `${prefix}${suffix}`.slice(0, 80);
  }
  return `${prefix}${joiner}${clipped}${suffix}`.slice(0, 80);
}

export function buildMessageWinTitle(params: {
  method: MessageLoopMethod;
  elapsedSeconds?: number;
  energyChoice?: EnergyProtectionChoice | null;
  context?: string;
}): string {
  const { method, elapsedSeconds, energyChoice, context } = params;
  const safeContext = sanitizeWinContext(context);

  let title: string;
  switch (method) {
    case 'close-quickly': {
      const time =
        typeof elapsedSeconds === 'number'
          ? formatStopwatchTime(elapsedSeconds)
          : null;
      if (safeContext && time) {
        title = titleWithContext('Replied to', safeContext, ` in ${time}`);
      } else if (time) {
        title = `Closed an avoided message in ${time}`;
      } else if (safeContext) {
        title = titleWithContext('Replied to', safeContext);
      } else {
        title = 'Closed an avoided message';
      }
      break;
    }
    case 'build-reply':
    case 'late-reply':
      title = safeContext
        ? titleWithContext('Replied to', safeContext)
        : 'Replied to an avoided message';
      break;
    case 'protect-energy': {
      switch (energyChoice) {
        case 'ask-for-time':
          title = safeContext
            ? titleWithContext('Asked for more time about', safeContext)
            : 'Asked for more time';
          break;
        case 'set-boundary':
          title = safeContext
            ? titleWithContext('Set a boundary about', safeContext)
            : 'Set a boundary in a difficult conversation';
          break;
        case 'no-reply-needed':
          title = safeContext
            ? titleWithContext('Decided not to reply about', safeContext)
            : 'Decided that no reply was needed';
          break;
        case 'ask-someone-to-check':
          title = safeContext
            ? titleWithContext('Shared a draft about', safeContext)
            : 'Shared a draft for feedback';
          break;
        case 'necessary-only':
          title = safeContext
            ? titleWithContext('Replied to', safeContext)
            : 'Sent a necessary short reply';
          break;
        case 'unsent-draft':
          title = safeContext
            ? titleWithContext('Set a boundary about', safeContext)
            : 'Made a clear communication boundary';
          break;
        default:
          title = safeContext
            ? titleWithContext('Replied to', safeContext)
            : 'Replied to an avoided message';
      }
      break;
    }
  }

  return title.slice(0, 80);
}
