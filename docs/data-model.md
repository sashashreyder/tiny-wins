# Data Model

See `types/index.ts` for full TypeScript definitions.

## Core entities

### UserProfile
Onboarding + preferences: struggle, energy, support style, garden vibe, theme, toggles.

### TinyWin
Logged micro-action with category, XP, optional hard-today flag and note.

### MoodEntry / SleepEntry / WaterEntry
Tracker entries with tags and optional notes.

### FocusSession
Timed sprint with distractions list and result enum.

### BrainDumpEntry
Journal capture with mode (brain dump, open loops, scary thought, etc.).

### Reward
Personal or template reward with XP cost, unlock/claimed state.

### GardenItem
Visual world element unlocked at XP thresholds, optionally linked to a win.

### Achievement
Badge unlocked by events (not streaks).

## AppState

Central store shape persisted via Zustand + AsyncStorage:

```
userProfile, xpTotal, xpToday, lastXpDate, returns,
tinyWins[], moodEntries[], sleepEntries[], waterEntries[],
rewards[], gardenItems[], achievements[], brainDumpEntries[],
focusSessions[], selfCareChecks[], homeCareTasks[], claimedPrintables[]
```

## Persistence

Key: `tiny-wins-garden-storage`

Future: sync AppState JSON to backend on change with conflict resolution.
