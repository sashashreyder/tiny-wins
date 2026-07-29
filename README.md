# Tiny Wins Garden

A gentle, ADHD-friendly self-organization prototype built with Expo, React Native, and TypeScript. Runs as a responsive web app today; architecture is ready for a future native mobile app with minimal rewriting.

**Core promise:** Make tiny progress visible.

## Quick start

```bash
npm install
npm run web
```

Other commands:

```bash
npm start          # Expo dev server (all platforms)
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run typecheck  # TypeScript check
```

## What's included

- **19 screens**: landing, onboarding, dashboard, tools, trackers, garden, rewards, printables, proof of progress, journal, settings, about
- **Local-first state** with Zustand + AsyncStorage persistence
- **XP / garden / achievements** system
- **Personalization engine** based on onboarding struggles
- **Light & dark themes** with reduced-motion support
- **SVG garden** that grows with XP
- **Demo data** loadable from landing page or settings

## Architecture

```
app/                  # Expo Router screens
components/           # Design system + garden visuals
data/content.ts       # Editable content database
lib/recommendations.ts # XP, garden, personalization logic
store/useAppStore.ts  # Zustand store with persistence
types/index.ts        # TypeScript data model
docs/                 # Product & design documentation
```

## Mocked for prototype

- Auth / backend / cloud sync
- Push notifications
- Real printable file downloads
- Payments / pay-what-you-want
- Social links
- Data export (placeholder UI)

See `docs/future-roadmap.md` for how to add these later.

## Disclaimer

This tool is for self-support and reflection, not medical advice.

## Brand names (in code)

- Tiny Wins Garden
- ADHD Tiny Wins
- Brain Garden
- Dopamine Garden
- Little Wins Lab
