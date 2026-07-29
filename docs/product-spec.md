# Product Spec — Tiny Wins Garden

## Vision

Help people with ADHD notice tiny daily actions, start when stuck, track self-care, earn points, unlock cozy rewards, and grow a visual garden from everyday wins.

## Core promise

**Make tiny progress visible.**

## Product philosophy

- Small things count
- No shame, no streak punishment
- Reward starting, not only finishing
- Works on low-energy days
- Restart gently after bad days

## User flow

1. **Landing** — emotional hook + feature overview
2. **Onboarding** (5 quick steps) — struggle, energy, support style, garden vibe
3. **Dashboard** — personalized command center
4. **Tools** — deep screens for each ADHD-friendly tool
5. **Garden / Proof** — emotional payoff

## Personalization

`lib/recommendations.ts` maps `mainStruggle` → prioritized tools and suggested micro-actions. See `data/content.ts` for full mapping.

## XP system

| Action | XP |
|--------|-----|
| Tiny win | 5 |
| Hard today bonus | +5 |
| Can't start quest | 10 (via hard-today win) |
| Focus 3/5/10/25 min | 8/10/15/25 |
| Mood / sleep entry | 5 |
| Water cup | 3 |
| Brain dump | 8 |
| Close the day | 15 |
| Home reset | 10 |
| Low-energy self-care | +10 bonus |

## Garden levels

Seed (0) → Sprout (25) → Tiny Plant (50) → Rooted (100) → Blooming (150) → Cozy Grove (250) → Garden Keeper (400) → Firefly Grove (600) → Little World (900) → Tiny Universe (1200)

## Achievements

Event-driven, not streak-driven. Examples: First Tiny Win, Started While Stuck, Came Back After a Bad Day.

## Future backend integration

Replace `useAppStore` persistence with:
- Supabase / Firebase for sync
- Auth via magic link or OAuth
- Printable files in object storage
- RevenueCat or Stripe for pay-what-you-want printables

Keep the same TypeScript types and content layer.
