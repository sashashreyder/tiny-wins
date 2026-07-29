# Tiny Wins Garden — Current State Audit

**Audit date:** July 29, 2026  
**Scope:** Full repository inspection (read-only; no application code modified)  
**Stack:** Expo 57, React Native 0.86, Expo Router 57, Zustand + AsyncStorage, React Native Web

---

## Executive summary

Tiny Wins Garden is a **functional local-first prototype** with 19 user-facing routes, a working XP loop, persistent state, and responsive landing + desktop sidebar layout (post AppShell fix). The **core loop works**: log actions → earn XP → see garden/proof grow → spend XP on rewards/printables.

Major gaps are **intentional prototype mocks** (downloads, export, backend), **partial personalization** (support style, secondary struggles, garden vibe stored but barely used visually), **incomplete UI affordances** (Save for later, Custom focus, secondary onboarding struggles), and **one TypeScript error** in unused template code.

---

## Typecheck result

```bash
npm run typecheck
# Exit code: 2 (FAILED)
```

| File | Error |
|------|-------|
| `components/ExternalLink.tsx:11` | `Type 'string' is not assignable to type` Expo Router typed `href` union |

**Note:** `ExternalLink` is leftover Expo tabs template code and is **not imported by any app screen**. Runtime is unaffected; CI/typecheck would fail.

---

## Persistence (AsyncStorage)

**Storage key:** `tiny-wins-garden-storage`  
**Mechanism:** Zustand `persist` middleware → `@react-native-async-storage/async-storage`

**Entire `AppState` is persisted**, including:

| Field | Persisted |
|-------|-----------|
| `userProfile` | Yes |
| `xpTotal`, `xpToday`, `lastXpDate`, `returns` | Yes |
| `tinyWins[]` | Yes |
| `moodEntries[]`, `sleepEntries[]`, `waterEntries[]` | Yes |
| `rewards[]`, `gardenItems[]`, `achievements[]` | Yes |
| `brainDumpEntries[]`, `focusSessions[]` | Yes |
| `selfCareChecks[]`, `homeCareTasks[]` | Yes |
| `claimedPrintables[]` | Yes |

**Not persisted separately:** UI-only React state (modals, form inputs, focus timer phase, onboarding step index).

---

## XP — what adds points

| User action | Store method | XP amount | Notes |
|-------------|--------------|-----------|-------|
| Log tiny win | `addTinyWin` | 5 | Base |
| Mark tiny win “hard today” | `addTinyWin` | +5 | Stacks on base → 10 total |
| Self-care tiny win while low-energy mode | `addTinyWin` | +10 | When `category === 'self-care'` and `lowEnergyMode` |
| Complete Can't Start quest | `completeCantStartQuest` → `addTinyWin(..., isHardToday: true)` | 10 | Quest text truncated to 80 chars as win title |
| Log mood | `addMood` | 5 | |
| Log sleep entry | `addSleep` | 5 | |
| Add water cup | `addWater` | 3 | Dashboard quick action uses same |
| Brain dump save | `addBrainDump` | 8 | |
| Focus sprint result | `completeFocus` → `addXP` | 8 / 10 / 15 / 25 / 25 | By duration: ≤3, ≤5, ≤10, ≤25, >25 min |
| Close the Day (sleep screen) | `addXP('close-day')` | 15 | Does not create a tiny win |
| First self-care check (per item/day) | `toggleSelfCare` | 5 or 10 | 10 if low-energy mode; **unchecking does not remove XP** |
| First home task complete (per zone/task/day) | `toggleHomeTask` | 10 | **Unchecking does not remove XP** |
| Claim reward | `claimReward` | 0 (spends XP) | Deducts `cost` unless `claimWithoutSpending` |
| Unlock printable | `spendXP` via printables screen | 0 (spends XP) | Free items cost 0 |

**Defined in `calculateXP` but not used as standalone action:** `cant-start-quest` (10) — folded into hard-today tiny win instead.

---

## Garden items — what creates them

**Only `addTinyWin`** calls `createGardenItemForWin`, which adds a `gardenItems[]` entry when **total XP crosses a threshold** (25, 50, 100, 150, 250, 400, 600, 900, 1200) on that win.

- Item `type` maps from tiny win **category** (e.g. self-care → `water-drop`, home → `stone-path`).
- **Water, focus, mood, sleep, brain dump, self-care toggles, home tasks do not directly create garden items.**
- **GardenScene** visual stages (sprout, tree, pond, etc.) derive from **`xpTotal`**, not from `gardenItems` count.
- **`gardenVibe`** (onboarding/settings) affects **label text only** on Garden screen — **not** SVG colors or layout.

---

## Achievements — what unlocks them

| Achievement ID | Title | Trigger (`markAchievementEvent` / `checkAchievements`) |
|----------------|-------|--------------------------------------------------------|
| a1 | First Tiny Win | First `addTinyWin` |
| a2 | Started While Stuck | `completeCantStartQuest` |
| a3 | Drank Water | `addWater` or tiny win title contains "water" |
| a4 | Fed Myself | Tiny win title contains "ate" or "food" |
| a5 | Left the House | Tiny win title contains "outside" or "walk" |
| a6 | Closed One Loop | `addBrainDump` with mode `open-loops` |
| a7 | Sent One Message | Tiny win title contains "message" or "email" |
| a8 | 3-Minute Hero | Focus session duration ≤ 3 min |
| a9 | Low Energy Legend | Self-care toggle while `lowEnergyMode` |
| a10 | Rage Cleaned Responsibly | First home task toggle per task |
| a11 | Came Back After a Bad Day | **`recordReturn`** — **never called from UI** |
| a12 | Proof Collector | Visiting `/progress` (`useEffect` → `view-progress`) |
| a13 | Sleep Detective | `addSleep` |
| a14 | Garden Starter | `xpTotal >= 25` |
| a15 | Tiny But Real | `tinyWins.length >= 10` |

**Also:** `completeOnboarding` sets `returns: 1` but does not unlock a11.

---

## Zustand actions — usage map

| Action | Used by screens |
|--------|-----------------|
| `setProfile` | *(none directly)* |
| `updateProfile` | `settings` |
| `completeOnboarding` | `onboarding` |
| `loadDemoData` | `index`, `settings` |
| `resetData` | `settings` |
| `addXP` | `sleep` (Close the Day) |
| `spendXP` | `printables` |
| `addTinyWin` | `tiny-wins` |
| `completeCantStartQuest` | `cant-start` |
| `addMood` | `mood` |
| `addSleep` | `sleep` |
| `addWater` | `water`, `dashboard` (quick action) |
| `addBrainDump` | `journal` |
| `completeFocus` | `focus` |
| `toggleSelfCare` | `self-care` |
| `toggleHomeTask` | `home-care` |
| `claimReward` | `rewards` |
| `unlockPrintable` | `printables` |
| `addCustomReward` | `rewards` |
| `recordReturn` | **Unused in UI** |
| `markAchievementEvent` | `progress` (side effect on mount) |

**Read-only store access:** `dashboard`, `garden`, `tools` (none), `about` (none), `index` (profile check only).

---

## Route & screen inventory

### Screens table

| Route | Screen | Main functionality | State actions used | Persistence | Mobile status | Desktop status | Functional status | Known limitations | Priority |
|-------|--------|-------------------|-------------------|-------------|---------------|----------------|-------------------|-------------------|----------|
| `/` | Landing (`index.tsx`) | Marketing hero, feature overview, CTAs to onboarding/tools/demo | `loadDemoData` (read profile) | Reads/writes via demo load | Good — responsive breakpoints (compact/tablet/desktop) | Good — centered max 1240px, 2-col hero | **Working** | No AppShell; demo load skips onboarding | P3 |
| `/onboarding` | Onboarding | 5-step profile setup | `completeOnboarding` | Writes profile | Good — stacked flow | Good — same layout, no sidebar | **Partial** | Secondary struggles UI broken; supportStyle/gardenVibe saved but underused downstream | P1 |
| `/dashboard` | Dashboard | Personalized hub, quick actions, wins preview, garden teaser | `addWater`; reads profile, wins, XP | Full | Good — bottom tabs; 7 quick actions wrap | Good — sidebar + content (AppShell fixed) | **Working** | Works without onboarding (generic recommendations); progress bar formula approximate | P2 |
| `/cant-start` | I Can't Start | Stuck-type picker → tiny quests → complete | `completeCantStartQuest` | Full | Good | Good | **Partial** | No "Save for later"; no way to change stuck type after selection except modal reset; energy level barely affects quests | P2 |
| `/tiny-wins` | Tiny Wins | Category picker, quick log, custom win | `addTinyWin` | Full | Good | Good | **Working** | No empty-state component; lists all wins without pagination | P3 |
| `/focus` | Focus Sprint | Timer, distraction parking, result capture | `completeFocus` | Full | Good | Good | **Partial** | Custom duration not implemented; timer effect restarts on pause/resume; "I got distracted" requires typed text; no background timer | P1 |
| `/mood` | Mood Tracker | Mood + intensity + tags + note | `addMood` | Full | Good | Good | **Working** | No trend charts (copy mentions patterns only) | P3 |
| `/sleep` | Sleep Tracker | Sleep log + Close the Day ritual | `addSleep`, `addXP` | Full | Good | Good | **Partial** | Demo insights are static placeholder; bedtime fields are free text not time pickers | P2 |
| `/water` | Water Tracker | Cup counter vs daily goal | `addWater` | Full | Good | Good | **Working** | Reminder copy only — no notifications; cup grid tap logic slightly confusing | P3 |
| `/self-care` | Self-Care | Daily checklist toggles | `toggleSelfCare` | Full | Good | Good | **Working** | Toggle off doesn't revoke XP; no empty state | P2 |
| `/home-care` | Home Care | Zone + mode + task toggles | `toggleHomeTask` | Full | Good | Good | **Working** | Mode selection is visual only (doesn't filter tasks); toggle off doesn't revoke XP | P2 |
| `/rewards` | Rewards | XP shop + custom rewards | `claimReward`, `addCustomReward` | Full | Good | Good | **Working** | Shows "unlocked" when XP ≥ cost before claim; claim always opens modal even if insufficient XP silently fails | P2 |
| `/garden` | Garden | SVG world + level + achievements grid | Read-only | Full | Good | Good | **Working** | Garden vibe doesn't change visuals; category-based items only from tiny-win thresholds | P2 |
| `/printables` | Printables | Unlock library + preview modal | `spendXP`, `unlockPrintable` | Full | Good | Good | **Mock** | Preview/download not implemented; `unlocked` UI true when XP ≥ cost before spending; coming-soon item unlockable at 999 XP | P2 |
| `/progress` | Proof of Progress | Stats, share card, weekly summary | `markAchievementEvent('view-progress')`; read-only | Full | Good | Good | **Working** | Share card not exportable; unlocks Proof Collector on every visit; "some" when 0 today wins in dashboard cross-ref | P2 |
| `/journal` | Brain Dump | Multi-mode journal entries | `addBrainDump` | Full | Good | Good | **Working** | Scary-thought flow is minimal; no edit/delete | P3 |
| `/tools` | Tool Library | Filterable list of 13 tools | None | N/A | Good | Good | **Working** | Filter "Low energy" returns 0 tools (no tools use that category); 13 tools not 19 screens | P3 |
| `/settings` | Settings | Theme, vibe, toggles, data reset/demo | `updateProfile`, `loadDemoData`, `resetData` | Full | Good (under "More" tab) | Good | **Partial** | Export placeholder; `focusDuration` stored never used; settings without profile still render toggles | P2 |
| `/about` | Build in Public | Product story, roadmap teasers | None | N/A | Reachable via sidebar only | Good | **Static** | Social links + suggest-tool placeholders | P3 |
| `+not-found` | 404 | Template fallback | None | N/A | Works | Works | **Template** | Uses old `Themed` components, not design system | P3 |

### Internal / non-user routes

| Route | Purpose |
|-------|---------|
| `app/_layout.tsx` | Root stack, fonts, theme status bar |
| `app/+html.tsx` | Web static HTML shell |
| `app/+not-found.tsx` | 404 |

---

## Demo vs empty state support

| Screen | Empty state (no user data) | Demo state (`loadDemoData`) |
|--------|---------------------------|----------------------------|
| Landing | Default marketing | CTA loads demo → dashboard |
| Onboarding | N/A | Independent of demo |
| Dashboard | SupportiveMessage if no wins today; generic recommendations if no profile | Rich wins, XP, garden preview |
| Can't Start | Works without profile | Profile energy affects quest list (same data) |
| Tiny Wins | Empty recent list | Shows demo wins after load |
| Focus | Works | Prior sessions in demo |
| Mood / Sleep / Water | Empty history sections | Demo entries |
| Self-Care / Home Care | All unchecked | Demo may have partial checks from fresh demo |
| Rewards | Default template rewards | One reward pre-claimed in demo |
| Garden | Empty soil at 0 XP | Sprout stage + items in demo |
| Printables | Free sheet only initially | p1 claimed in demo |
| Progress | Zeros / empty lists | Populated stats |
| Journal | Empty recent | Demo brain dump |
| Tools / About | Static content | Unaffected |
| Settings | Toggles inert without profile | Full profile in demo |

**`EmptyState` component exists** in `components/design-system/Feedback.tsx` but is **never used** in any screen.

---

## Placeholder & demo-only content

| Location | Content |
|----------|---------|
| `sleep.tsx` | "Gentle insights (demo)" — static bullet points, labeled placeholder |
| `water.tsx` | Reminder copy — "no push notifications yet" |
| `printables.tsx` | Preview/download modals — "coming soon" |
| `settings.tsx` | Export data — "coming soon" |
| `about.tsx` | Social links, feature request form — "coming soon" |
| `onboarding.tsx` | Secondary struggles — "Long-press coming soon" |
| `data/content.ts` | Premium Bundle printable — `coming-soon` category |
| `progress.tsx` | Share card — visual only, no image export |
| `garden.tsx` / `GardenScene` | Stage labels from XP; not personalized medical insights |

---

## Interactive but incomplete controls

| Control | Screen | Issue |
|---------|--------|-------|
| "Save for later" | Can't Start (spec) | **Not implemented** |
| Custom focus duration | Focus | Tag shows "Custom" but `minutes: 0`; no input |
| Secondary struggle selection | Onboarding | UI hint promises multi-select; only main struggle works |
| "Low energy" filter | Tools | Filter exists; zero matching tools |
| Export data | Settings | Text only |
| Preview / Download | Printables | Modal stub |
| Claim reward (insufficient XP) | Rewards | `claimReward` no-ops; modal may still show if wired wrong |
| Printable Unlock | Printables | `unlocked` prop true when XP ≥ cost before purchase |
| Sidebar nav (desktop) | AppShell | 17 items, **no ScrollView** — may clip on short viewports |
| Focus "I got distracted" | Focus | Button only saves if input non-empty |
| Water cup grid tap | Water | Tapping empty cups adds water (intended) but UX unclear |
| `recordReturn` | — | Never wired — "Came Back" achievement unreachable |
| `focusDuration` preference | Settings/onboarding | Saved, never applied to Focus default |
| `supportStyle` | Onboarding | Saved, **not used** in `getRecommendedTools` |
| `secondaryStruggles` | Onboarding | Saved, **not used** in recommendations |
| `gardenVibe` | Onboarding/settings | Label only; **no visual change** in GardenScene |

---

## Layout, routing, scroll & safe-area risks

| Risk | Severity | Details |
|------|----------|---------|
| Nested `ScrollView` | P2 | Most AppShell screens wrap `ScreenContainer` → inner `ScrollView`; tools also nests horizontal `ScrollView` inside vertical |
| Desktop sidebar overflow | P2 | Fixed height sidebar with 17 links, no scroll — content may clip below fold on laptop screens |
| Mobile bottom tab coverage | P2 | `paddingBottom: 80 + insets.bottom` on content — generally OK; tall devices fine |
| Landing / onboarding without AppShell | OK | Full-width gradient; landing has max-width container |
| Dashboard double horizontal padding | P3 | AppShell content + ScreenContainer padded=false but scroll has own padding |
| `router.push(route as never)` | P3 | Typed routes bypassed throughout — works at runtime |
| Focus timer `useEffect` | P1 | Re-runs interval on `paused` toggle — can create duplicate intervals briefly |
| Static web export | P3 | `expo export --platform web` works; hydration depends on AsyncStorage on client |
| `+not-found` | P3 | Off-brand template styling |

**AppShell wide layout:** Fixed with `flexDirection: 'row'`, `flexShrink: 0` sidebar, `minWidth: 0` main (≥900px breakpoint).

**Landing responsive:** compact <700, tablet 700–1023, desktop ≥1024, maxWidth 1240.

---

## Data consistency issues

| Issue | Impact |
|-------|--------|
| Unchecking self-care / home tasks | XP and achievements remain |
| `addWater` vs tiny win "Drank water" | Separate entries; duplicate XP paths |
| Dashboard quick water | Adds water + XP but not tiny win or garden threshold linkage |
| `completeCantStartQuest` | Always logs as `work-study` category regardless of quest |
| Garden items only on tiny wins | Spec implied category actions add items — only threshold crossing on wins |
| `xpToday` reset | Uses `toDateString()` — timezone edge cases at midnight |
| `loadDemoData` | Overwrites entire state including profile — no merge |
| `resetData` | Clears profile; user lands in odd state if they open dashboard without onboarding |
| Proof progress bar on dashboard | `1 - xpToNext / (xpToNext + xpToday)` — not aligned to level thresholds |
| Achievement a12 | Fires every time user opens Proof screen |
| Printable sections | Free items with cost 0 appear in "Free/unlocked" when claimed OR cost 0 — logic overlap |

---

## TypeScript & React Native Web risks

| Risk | File / area | Notes |
|------|-------------|-------|
| **TS error (active)** | `components/ExternalLink.tsx` | Typed `href` mismatch; unused |
| `as never` route casts | All navigation | Hides route typos from compiler |
| `require()` in GardenScene | `EnergySelector` | Dynamic require of content — works but untyped |
| Reanimated + SVG | `GardenScene` | Works on web export; native needs dev client |
| AsyncStorage on web | `useAppStore` | Uses localStorage under hood — OK for prototype |
| Font loading gate | `_layout.tsx` | Returns null until fonts load — flash on slow network |
| `Switch` trackColor | settings | Incomplete type on Android vs web |
| Percentage widths in grids | `index.tsx` landing | RN Web supports; older RN Android can be finicky |
| Template files | `components/Themed.tsx`, `EditScreenInfo.tsx`, etc. | Dead code from Expo template |

---

## README / docs vs implementation

| Documented | Actually implemented? |
|------------|----------------------|
| 19 screens | **Yes** (19 user routes + not-found) |
| Local-first Zustand + AsyncStorage | **Yes** |
| XP / garden / achievements | **Partial** — garden items only via tiny-win thresholds; not all spec XP paths |
| Personalization from onboarding | **Partial** — only `mainStruggle` + `energyLevel` affect recommendations |
| Light/dark/system themes | **Yes** |
| Reduced motion support | **Partial** — only firefly animations respect it |
| SVG garden grows with XP | **Yes** — stage visuals from `xpTotal` |
| Demo data from landing/settings | **Yes** |
| Auth / backend / sync | **No** (documented as mocked) |
| Push notifications | **No** (documented as mocked) |
| Real printable downloads | **No** (documented as mocked) |
| Payments / PWYW | **No** (documented as mocked) |
| Social links | **No** (documented as mocked) |
| Data export | **No** — placeholder text only |
| Share card export | **No** — mentioned in roadmap, not README core |
| Onboarding secondary struggles | **No** — documented in product spec, UI incomplete |
| "Save for later" on Can't Start | **No** — in original spec, not built |
| `recordReturn` / came-back tracking | **No** — store exists, no UI |
| Garden vibe visual variants | **No** — labels only |
| Tool library low-energy filter | **Misleading** — filter with zero results |
| Inter font in typography | **Partial** — loaded but most styles use system/Space Grotesk only |

---

## Current working core loop

```
Landing or Onboarding
    → Dashboard (personalized tool order if profile exists)
        → User picks a tool (Can't Start / Tiny Wins / Focus / trackers)
            → Action writes to Zustand (tiny win, water, mood, etc.)
                → XP increases (xpTotal, xpToday)
                    → Garden stage visuals update (xpTotal)
                    → Optional gardenItems[] entry on threshold cross (tiny wins)
                    → Optional achievement unlock
        → Garden / Proof screens show accumulated progress
        → Rewards / Printables spend XP (optional)
    → State persists to AsyncStorage → survives refresh
```

**Fastest demo path:** Landing → "Try with demo data" → Dashboard with pre-filled wins and garden.

---

## Five highest-priority technical issues

1. **P1 — TypeScript check fails** (`ExternalLink.tsx` typed href) — blocks strict CI.
2. **P1 — Focus timer `useEffect`** — interval lifecycle on pause/resume may duplicate timers or drift.
3. **P1 — Personalization data ignored** — `supportStyle`, `secondaryStruggles`, `gardenVibe`, `focusDuration` stored but unused in logic/visuals.
4. **P2 — `recordReturn` never wired** — achievement a11 and returns metric incomplete vs spec.
5. **P2 — XP / garden inconsistency** — garden items only from tiny wins at thresholds; other actions don't match product spec category items.

---

## Five highest-priority UX issues

1. **P1 — Onboarding secondary struggles** — UI promises multi-select; only main struggle works.
2. **P1 — Focus "Custom" mode** — appears selectable but non-functional.
3. **P2 — Printables/rewards "unlocked" state** — shows unlocked before XP is spent; confuses spend flow.
4. **P2 — Mobile nav discoverability** — About, Can't Start, Tiny Wins, Journal, etc. only in sidebar on desktop; mobile limited to 5 tabs.
5. **P2 — Desktop sidebar scroll** — 17 nav items may clip on shorter screens without scroll container.

---

## Features that should NOT be expanded yet

- Backend / auth / cloud sync
- Push notifications
- Real PDF generation / printable downloads
- Payments / pay-what-you-want
- Social sharing integrations
- New tools or screens beyond stabilizing existing 19 routes
- Medication reminder module (mentioned in spec conceptually, not built)
- Weekly review / distraction parking lot as standalone screens
- Haptics, widgets, native store release

**Reason:** Core loop and data integrity should be fixed before expanding surface area.

---

## Recommended order of future work

1. **Fix typecheck** — remove or fix `ExternalLink.tsx`; reduce `as never` casts.
2. **Complete onboarding** — secondary struggles UX; wire `supportStyle` into recommendations.
3. **Fix Focus sprint** — custom duration, timer lifecycle, optional `focusDuration` default from settings.
4. **Align reward/printable unlock UX** — distinguish "can afford" vs "owned/claimed".
5. **Wire `recordReturn`** — on app open after 24h+ or dashboard visit after gap.
6. **Garden vibe visuals** — at least palette/background variants per vibe.
7. **JSON export/import** — settings placeholder → real download/upload.
8. **Share card export** — Proof screen image capture for social.
9. **Printable preview pages** — in-app static preview before real PDFs.
10. **Accessibility pass** — labels, contrast, reduced motion globally, sidebar scroll.

---

## Remaining layout limitations (post recent fixes)

- AppShell desktop breakpoint (900px) differs from landing breakpoints (700/1024) — intentional but inconsistent.
- Tool/reward grids on desktop use `47%` / `31.5%` widths — last row may look uneven.
- Garden SVG uses fixed viewBox — scales but doesn't reflow for ultra-wide monitors.
- No max-width constraint on AppShell main content — inner screens rely on their own padding only (dashboard cards can stretch wide on ultrawide).
- Horizontal filter scroll on Tools may hide filters off-screen without scroll hint on mobile.

---

*End of audit. No application files were modified except this document.*
