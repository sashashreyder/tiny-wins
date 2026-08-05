import {
  Achievement,
  BrainDumpMode,
  MoodType,
  ProblemOption,
  Reward,
  StuckType,
  StuckTypeOption,
  StruggleId,
  TinyWinCategory,
  ToolDefinition,
} from '@/types';

export const problemOptions: ProblemOption[] = [
  { id: 'cant-start', label: "I can't start", emoji: '🌱' },
  { id: 'procrastinating', label: 'I keep procrastinating', emoji: '⏳' },
  { id: 'overwhelmed', label: "I'm overwhelmed", emoji: '🌊' },
  { id: 'cant-focus', label: "I can't focus", emoji: '🎯' },
  { id: 'switching-tasks', label: 'I keep switching tasks', emoji: '🔀' },
  { id: 'low-energy', label: "I'm tired / low energy", emoji: '🔋' },
  { id: 'sleep-mess', label: 'My sleep is a mess', emoji: '🌙' },
  { id: 'forget-self-care', label: 'I forget basic self-care', emoji: '💧' },
  { id: 'home-chaotic', label: 'My home feels chaotic', emoji: '🏠' },
  { id: 'lose-progress', label: 'I lose track of progress', emoji: '📊' },
  { id: 'need-rewards', label: 'I need rewards to stay motivated', emoji: '🎁' },
  { id: 'open-loops', label: 'I have too many open loops', emoji: '🔄' },
];

export const energyOptions = [
  { id: 'empty-battery', label: 'Empty battery', emoji: '🪫' },
  { id: 'low', label: 'Low', emoji: '🌥️' },
  { id: 'okay-ish', label: 'Okay-ish', emoji: '🌤️' },
  { id: 'restless', label: 'Restless', emoji: '⚡' },
  { id: 'wired-tired', label: 'Wired but tired', emoji: '🌀' },
  { id: 'changes-a-lot', label: 'It changes often', emoji: '🎲' },
] as const;

export const supportStyleOptions = [
  { id: 'tiny-steps', label: 'Tiny steps' },
  { id: 'quick-plan', label: 'Quick plan' },
  { id: 'reward', label: 'Rewards' },
  { id: 'calm-down', label: 'Tools to calm down' },
  { id: 'proof', label: 'Visual proof of progress' },
  { id: 'routines', label: 'Ready-made routines' },
] as const;

export const gardenVibeOptions = [
  { id: 'cozy-night', label: 'Cozy night garden', emoji: '🌙' },
  { id: 'lilac-greenhouse', label: 'Soft lilac greenhouse', emoji: '🪴' },
  { id: 'space-planet', label: 'Tiny space planet', emoji: '🪐' },
  { id: 'magic-desk', label: 'Magic desk garden', emoji: '✨' },
] as const;

export const stuckTypes: StuckTypeOption[] = [
  {
    id: 'too-big',
    label: 'Task feels too big',
    emoji: '🏔️',
    hint: 'The whole thing feels heavy before you begin.',
  },
  {
    id: 'no-beginning',
    label: "I don't know how to start",
    emoji: '🧭',
    hint: 'I know what the task is. I need a way to get moving.',
  },
  {
    id: 'scared-bad',
    label: "I'm scared it won't be good",
    emoji: '😬',
    hint: 'The first try feels like it has to prove everything.',
  },
  {
    id: 'bored',
    label: "I'm bored",
    emoji: '🥱',
    hint: 'The task may need more stimulation, not more pressure.',
  },
  {
    id: 'tired',
    label: "I'm tired",
    emoji: '🔋',
    hint: 'Your energy needs protection, not a bigger push.',
  },
  {
    id: 'avoiding-message',
    label: "I'm avoiding a message",
    emoji: '💬',
    hint: 'A reply, email, or text is sitting there.',
  },
  {
    id: 'opened-everything',
    label: 'I opened everything and did nothing',
    emoji: '🌀',
    hint: 'Lots of tabs, zero traction.',
  },
  {
    id: 'forgot-what',
    label: 'I forgot what I was doing',
    emoji: '💭',
    hint: 'The thread slipped away mid-task.',
  },
];

export const tinyQuests: Record<StuckType, string[]> = {
  'too-big': [
    'Open the file. That\'s all.',
    'Write the title only.',
    'Make a messy first version for 3 minutes.',
    'Choose the smallest visible piece.',
  ],
  'no-beginning': [
    'Write: "The next tiny action is…"',
    'Pick one object, one tab, or one sentence.',
    'Do a 60-second scan.',
    'Stand up and look at the task from across the room.',
  ],
  'scared-bad': [
    'Make a deliberately bad first draft.',
    'Create version 0.1.',
    'Your only goal is to make it exist.',
    'Write one ugly sentence on purpose.',
  ],
  bored: [
    'Add a timer.',
    'Change location.',
    'Make it a game.',
    'Do the weirdest first step.',
  ],
  tired: [
    'Drink water.',
    'Sit somewhere comfortable.',
    'Do the horizontal version.',
    'Choose a low-energy win.',
  ],
  'avoiding-message': [
    'Open the chat/email only.',
    'Write one ugly draft.',
    'Send a tiny reply.',
    'Schedule it for later.',
  ],
  'opened-everything': [
    'Close 3 tabs.',
    'Choose one tab.',
    'Write down the other tasks in Parking Lot.',
    'Do 2 minutes only.',
  ],
  'forgot-what': [
    'Look at the last open screen.',
    'Write a reset sentence.',
    'Return to dashboard.',
    'Pick any tiny win.',
  ],
};

export const struggleSuggestions: Record<StruggleId, string[]> = {
  'cant-start': [
    'Open the task, don\'t do it yet',
    'Move one object',
    'Write one bad sentence',
    'Stand up and reset',
    'Choose the tiniest possible version',
  ],
  procrastinating: [
    'Make the task ugly and small',
    'Set a 10-minute fake deadline',
    'Do the first visible action',
    'Promise only 5 minutes',
  ],
  overwhelmed: [
    'Dump everything',
    'Pick only one next step',
    'Remove 3 fake urgent tasks',
    'Make a not-now list',
  ],
  'cant-focus': [
    'One tab / one task',
    'Write distractions here',
    '25/10 or 10/3 sprint',
    'Start with body reset',
  ],
  'switching-tasks': [
    'Park the new idea',
    'Return to the original task',
    'Choose a switching rule',
    'Close one tiny loop',
  ],
  'low-energy': [
    'Minimum viable day',
    'Horizontal reset',
    'Drink water',
    'Eat something',
    'One tiny maintenance task',
  ],
  'sleep-mess': [
    'Close the day',
    'Write tomorrow\'s bridge',
    'Reduce decision loops',
    'Track sleep without judgment',
  ],
  'forget-self-care': [
    'Drink water',
    'Eat something simple',
    'Brush teeth',
    'Shower or wash face',
    'Take meds if prescribed',
  ],
  'home-chaotic': [
    'Clear one surface',
    'Take out one trash item',
    'Put laundry in one place',
    'Wash 3 dishes',
    'Sweep one small area',
  ],
  'lose-progress': [
    'What counted today?',
    'Show me my wins',
    'Progress is not only finished projects',
    'Look at the last 7 days',
  ],
  'need-rewards': [
    'Create personal rewards',
    'Small reward after starting',
    'Bigger reward after repeated effort',
    'Unlock a printable',
  ],
  'open-loops': [
    'Capture everything',
    'Pick one loop to close',
    'Move ideas to later',
    'Stop carrying it in your head',
  ],
};

export const tinyWinTemplates: Record<TinyWinCategory, string[]> = {
  'self-care': [
    'Drank water', 'Ate something', 'Took meds if prescribed', 'Brushed teeth',
    'Washed face', 'Showered', 'Changed clothes', 'Went outside', 'Rested without guilt',
  ],
  home: [
    'Washed one dish', 'Cleared one surface', 'Started laundry', 'Folded one item',
    'Took out trash', 'Swept one area', 'Fed pet', 'Refilled pet water',
  ],
  'work-study': [
    'Opened the project', 'Sent one application', 'Wrote one sentence', 'Made one design draft',
    'Posted one video', 'Uploaded one printable', 'Read one page', 'Saved one idea',
  ],
  'social-admin': [
    'Answered one message', 'Sent one email', 'Paid one bill', 'Checked calendar',
    'Made one appointment', 'Asked for help',
  ],
  'pet-care': ['Fed pet', 'Refilled pet water', 'Walked pet', 'Cleaned pet area'],
  'body-reset': ['Stretched', 'Walked around', 'Deep breath reset', 'Changed posture'],
  emotional: [
    'Took a breath', 'Wrote the scary thought down', 'Went for a walk',
    'Played one calming game', 'Closed the laptop', 'Let myself cry', 'Did not believe the worst thought',
  ],
  creative: ['Sketched one thing', 'Wrote one line', 'Made one tiny edit', 'Saved one idea'],
  'sleep-support': ['Started wind-down', 'Dimmed lights', 'Closed the day', 'Set tomorrow bridge'],
};

export const moodOptions: { id: MoodType; label: string; emoji: string }[] = [
  { id: 'okay-ish', label: 'Okay-ish', emoji: '🙂' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'irritated', label: 'Irritated', emoji: '😤' },
  { id: 'foggy', label: 'Foggy', emoji: '🌫️' },
  { id: 'wired', label: 'Wired', emoji: '⚡' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'restless', label: 'Restless', emoji: '🌀' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌱' },
  { id: 'proud', label: 'Proud', emoji: '✨' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
  { id: 'empty', label: 'Empty', emoji: '🫥' },
];

export const moodTags = [
  'sleep', 'food', 'work', 'rejection', 'family', 'money', 'social',
  'hormones', 'weather', 'medication', 'too much talking', 'too much waiting', 'unknown',
];

export const sleepTags = [
  'melatonin', 'caffeine', 'alcohol', 'late screen', 'stress', 'noise', 'nap', 'unknown',
];

export const wakeFeelings = [
  { id: 'refreshed', label: 'Refreshed' },
  { id: 'okay', label: 'Okay' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'foggy', label: 'Foggy' },
  { id: 'wired', label: 'Wired' },
] as const;

export const selfCareItems = [
  'Water', 'Food', 'Meds if prescribed', 'Shower / wash face', 'Brush teeth',
  'Change clothes', 'Step outside', 'Rest', 'Move body gently',
];

export const homeZones = [
  'Kitchen', 'Desk', 'Floor', 'Laundry', 'Bathroom', 'Pet area', 'Trash', 'Bedroom',
];

export const homeTasks = [
  'Wash 3 dishes', 'Put 5 things away', 'Wipe one surface', 'Start laundry',
  'Collect trash', 'Sweep one visible area', 'Change one towel', 'Make bed-ish', 'Clean pet mess',
];

export const homeModes = [
  '1-minute reset', '5-minute reset', 'Rage cleaning mode', 'Low-energy home mode', 'One object only',
];

export const focusModes = [
  { label: '3-minute starter', minutes: 3 },
  { label: '5-minute tiny sprint', minutes: 5 },
  { label: '10-minute just begin', minutes: 10 },
  { label: '25-minute focus', minutes: 25 },
  { label: '45-minute deep-ish work', minutes: 45 },
  { label: 'Custom', minutes: 0 },
];

export const focusResults = [
  { id: 'started', label: 'I started' },
  { id: 'progress', label: 'I made progress' },
  { id: 'finished', label: 'I finished' },
  { id: 'stuck', label: 'I got stuck' },
  { id: 'came-back', label: 'I got distracted but came back' },
] as const;

export const rewardTemplates: Omit<Reward, 'unlocked' | 'claimed'>[] = [
  { id: 'r1', title: '10 minutes of game', cost: 30, category: 'fun', icon: '🎮', isCustom: false },
  { id: 'r2', title: 'Watch one episode', cost: 50, category: 'fun', icon: '📺', isCustom: false },
  { id: 'r3', title: 'Make coffee / tea', cost: 15, category: 'cozy', icon: '☕', isCustom: false },
  { id: 'r4', title: 'Coloring page break', cost: 25, category: 'creative', icon: '🎨', isCustom: false },
  { id: 'r5', title: 'Buy a small treat', cost: 75, category: 'treat', icon: '🍫', isCustom: false },
  { id: 'r6', title: 'Guilt-free rest', cost: 20, category: 'rest', icon: '🛋️', isCustom: false },
  { id: 'r7', title: 'Scroll timer', cost: 35, category: 'fun', icon: '📱', isCustom: false },
  { id: 'r8', title: 'Cozy shower', cost: 40, category: 'cozy', icon: '🚿', isCustom: false },
];

export const printableTemplates = [
  { id: 'p1', title: 'Tiny Wins Daily Sheet', cost: 0, category: 'free', description: 'Log tiny wins without pressure.' },
  { id: 'p2', title: "I Can't Start Checklist", cost: 50, category: 'start', description: 'Tiny quests for stuck moments.' },
  { id: 'p3', title: 'Low Energy Day Planner', cost: 75, category: 'energy', description: 'Minimum viable day planning.' },
  { id: 'p4', title: 'Reward Menu Builder', cost: 100, category: 'rewards', description: 'Build your personal reward menu.' },
  { id: 'p5', title: 'Sleep Wind-Down Sheet', cost: 75, category: 'sleep', description: 'Gentle evening closing ritual.' },
  { id: 'p6', title: 'Brain Dump Sheet', cost: 50, category: 'reflect', description: 'Park thoughts outside your head.' },
  { id: 'p7', title: 'Weekly Proof of Progress', cost: 150, category: 'proof', description: 'See what actually counted.' },
  { id: 'p8', title: 'ADHD Coloring Page: Tiny Wins Count', cost: 100, category: 'creative', description: 'Gentle coloring break.' },
  { id: 'p9', title: 'ADHD Coloring Page: Cool, Calm, Collected', cost: 100, category: 'creative', description: 'Calm your nervous system.' },
  { id: 'p10', title: 'Garden Progress Tracker', cost: 200, category: 'garden', description: 'Track your growing world.' },
  { id: 'p11', title: 'Premium Bundle (coming soon)', cost: 999, category: 'coming-soon', description: 'Pay what you want bundle.' },
];

export const achievementTemplates: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'a1', title: 'First Tiny Win', description: 'Logged your first tiny win.' },
  { id: 'a2', title: 'Started While Stuck', description: 'Completed an I Can\'t Start quest.' },
  { id: 'a3', title: 'Drank Water', description: 'Logged hydration.' },
  { id: 'a4', title: 'Fed Myself', description: 'Ate something. That counts.' },
  { id: 'a5', title: 'Left the House', description: 'Stepped outside.' },
  { id: 'a6', title: 'Closed One Loop', description: 'Closed an open loop.' },
  { id: 'a7', title: 'Sent One Message', description: 'Answered or sent a message.' },
  { id: 'a8', title: '3-Minute Hero', description: 'Completed a 3-minute focus sprint.' },
  { id: 'a9', title: 'Low Energy Legend', description: 'Won on a low-energy day.' },
  { id: 'a10', title: 'Rage Cleaned Responsibly', description: 'Did a home reset.' },
  { id: 'a11', title: 'Came Back After a Bad Day', description: 'Returned without starting over.' },
  { id: 'a12', title: 'Proof Collector', description: 'Checked proof of progress.' },
  { id: 'a13', title: 'Sleep Detective', description: 'Logged sleep data.' },
  { id: 'a14', title: 'Garden Starter', description: 'Your garden sprouted.' },
  { id: 'a15', title: 'Tiny But Real', description: '10 tiny wins logged.' },
];

export const gardenLevels = [
  { level: 1, name: 'Seed', minXp: 0 },
  { level: 2, name: 'Sprout', minXp: 25 },
  { level: 3, name: 'Tiny Plant', minXp: 50 },
  { level: 4, name: 'Rooted', minXp: 100 },
  { level: 5, name: 'Blooming', minXp: 150 },
  { level: 6, name: 'Cozy Grove', minXp: 250 },
  { level: 7, name: 'Garden Keeper', minXp: 400 },
  { level: 8, name: 'Firefly Grove', minXp: 600 },
  { level: 9, name: 'Little World', minXp: 900 },
  { level: 10, name: 'Tiny Universe', minXp: 1200 },
];

export const gardenStageThresholds = [
  { xp: 0, label: 'Empty soil' },
  { xp: 25, label: 'First sprout' },
  { xp: 50, label: 'Small plant' },
  { xp: 100, label: 'Tree' },
  { xp: 150, label: 'Flowers' },
  { xp: 250, label: 'Glowing pond' },
  { xp: 400, label: 'Tiny greenhouse' },
  { xp: 600, label: 'Stars & fireflies' },
  { xp: 900, label: 'Second island' },
  { xp: 1200, label: 'Cozy village' },
];

export const supportiveMessages = [
  'That counts.',
  'Starting is progress.',
  'Tiny is not fake.',
  'Your brain showed up.',
  'One small thing is still a thing.',
  'You made the invisible visible.',
  'Not nothing.',
  'A low-energy win is still a win.',
  'You can come back without starting over.',
];

export const closingDayPrompts = [
  'What was hard today?',
  'What still counted?',
  'What is one bridge to tomorrow?',
];

export const brainDumpModes: { id: BrainDumpMode; label: string; prompt: string }[] = [
  { id: 'brain-dump', label: 'Brain dump', prompt: 'What is taking up space in your head?' },
  { id: 'open-loops', label: 'Open loops', prompt: 'What can be parked for later?' },
  { id: 'scary-thought', label: 'Scary thought', prompt: 'What is the loudest thought?' },
  { id: 'idea-parking', label: 'Idea parking lot', prompt: 'Park it here. You don\'t have to carry it.' },
  { id: 'tomorrow-bridge', label: 'Tomorrow bridge', prompt: 'What is one tiny next action for tomorrow?' },
  { id: 'rejection', label: 'Rejection processing', prompt: 'What happened, and what can wait?' },
  { id: 'sleep-closing', label: 'Sleep closing note', prompt: 'What counted today?' },
];

export const toolDefinitions: ToolDefinition[] = [
  { id: 'cant-start', title: "I Can't Start", description: 'Tiny quests when starting feels impossible.', bestFor: 'Task paralysis', estimatedTime: '3 min', category: 'start', route: '/cant-start', icon: '🌱' },
  { id: 'tiny-wins', title: 'Tiny Wins', description: 'Log small actions that count.', bestFor: 'Invisible progress', estimatedTime: '30 sec', category: 'reflect', route: '/tiny-wins', icon: '✨' },
  { id: 'focus', title: 'Focus Sprint', description: 'ADHD-friendly timed focus.', bestFor: 'Getting started', estimatedTime: '3–45 min', category: 'focus', route: '/focus', icon: '⏱️' },
  { id: 'mood', title: 'Mood Tracker', description: 'Notice patterns without judgment.', bestFor: 'Emotional awareness', estimatedTime: '1 min', category: 'reflect', route: '/mood', icon: '💭' },
  { id: 'sleep', title: 'Sleep Tracker', description: 'Track sleep gently, no shame.', bestFor: 'Sleep patterns', estimatedTime: '2 min', category: 'sleep', route: '/sleep', icon: '🌙' },
  { id: 'water', title: 'Water Tracker', description: 'One tap hydration logging.', bestFor: 'Basic self-care', estimatedTime: '10 sec', category: 'self-care', route: '/water', icon: '💧' },
  { id: 'self-care', title: 'Self-Care Tracker', description: 'Gentle daily care checklist.', bestFor: 'Forgotten basics', estimatedTime: '2 min', category: 'self-care', route: '/self-care', icon: '🫶' },
  { id: 'home-care', title: 'Home Care', description: 'ADHD-friendly home resets.', bestFor: 'Chaotic spaces', estimatedTime: '1–5 min', category: 'home', route: '/home-care', icon: '🏠' },
  { id: 'rewards', title: 'Rewards', description: 'Spend XP on cozy rewards.', bestFor: 'Motivation', estimatedTime: '1 min', category: 'rewards', route: '/rewards', icon: '🎁' },
  { id: 'garden', title: 'Garden', description: 'Watch your world grow.', bestFor: 'Visual progress', estimatedTime: '2 min', category: 'rewards', route: '/garden', icon: '🪴' },
  { id: 'printables', title: 'Printables', description: 'Unlock digital reward sheets.', bestFor: 'Tangible tools', estimatedTime: '2 min', category: 'rewards', route: '/printables', icon: '📄' },
  { id: 'progress', title: 'Proof of Progress', description: 'Receipt that today existed.', bestFor: 'I did nothing feeling', estimatedTime: '2 min', category: 'reflect', route: '/progress', icon: '📊' },
  { id: 'journal', title: 'Brain Dump', description: 'Park thoughts outside your head.', bestFor: 'Overwhelm & loops', estimatedTime: '5 min', category: 'calm', route: '/journal', icon: '📝' },
];

export const struggleToolPriority: Record<StruggleId, string[]> = {
  'cant-start': ['cant-start', 'tiny-wins', 'rewards', 'journal', 'focus'],
  procrastinating: ['focus', 'rewards', 'tiny-wins', 'progress'],
  overwhelmed: ['journal', 'progress', 'tiny-wins', 'focus'],
  'cant-focus': ['focus', 'water', 'journal', 'tiny-wins'],
  'switching-tasks': ['journal', 'focus', 'progress', 'tiny-wins'],
  'low-energy': ['self-care', 'tiny-wins', 'rewards', 'water'],
  'sleep-mess': ['sleep', 'journal', 'progress', 'tiny-wins'],
  'forget-self-care': ['water', 'self-care', 'tiny-wins', 'mood'],
  'home-chaotic': ['home-care', 'tiny-wins', 'focus', 'rewards'],
  'lose-progress': ['progress', 'tiny-wins', 'mood', 'garden'],
  'need-rewards': ['rewards', 'garden', 'printables', 'tiny-wins'],
  'open-loops': ['journal', 'tiny-wins', 'focus', 'progress'],
};

export const disclaimer =
  'This tool is for self-support and reflection, not medical advice.';
