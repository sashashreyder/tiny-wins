# Design System

## Visual direction

Modern editorial + soft futuristic + playful digital garden. Adult but fun. Cozy glass cards, gentle gradients, soft glows.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Soft Lilac | `#C8B6FF` | Accents, dark theme glow |
| Periwinkle | `#B8C0FF` | Secondary accent |
| Aqua | `#7DE2D1` | Success, progress, water |
| Soft Coral | `#FF8A7A` | Energy CTA |
| Warm Cream | `#FFF8EE` | Light base alt |
| Ink Violet | `#211A3A` | Light text |
| Deep Night | `#141222` | Dark background |
| Card Dark | `#211F35` | Dark surfaces |
| Success Mint | `#9BF6C3` | Garden, wins |
| Warning Peach | `#FFD6A5` | Fireflies, warmth |

## Typography

- **Display:** Space Grotesk (700/600)
- **Body:** Inter / system fallback
- Short text blocks, large friendly headlines

## Components

Located in `components/design-system/`:

- `AppShell` — responsive sidebar (web) + bottom tabs (mobile)
- `ScreenContainer` — gradient background wrapper
- `GlassCard` — frosted card with optional glow
- `GradientButton` — primary/secondary/ghost variants
- `ProgressBar`, `XPBadge`
- `TagPill`, `MoodButton`
- `ToolCard`, `TrackerCard`, `TinyQuestCard`
- `GardenScene`, `GardenPreview`
- `AppModal`, `EmptyState`, `SupportiveMessage`

## Motion

- Slow, gentle animations via Reanimated
- Firefly pulse in garden (disabled with reduced motion)
- Press states on buttons/cards

## Themes

`lib/theme.ts` exports `lightTheme` and `darkTheme`. User preference: light / dark / system.
