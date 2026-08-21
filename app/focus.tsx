import { ReactNode, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { FocusSprint } from '@/components/focus/FocusSprint';
import { Pomodoro } from '@/components/focus/Pomodoro';
import { FOCUS_TOOLS, FocusTool, FocusToolId, pickFocusTip } from '@/data/focusTools';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';

const HUB_MAX_WIDTH = 1040;
const SIDEBAR_WIDTH = 260;
const WIDE_BREAKPOINT = 900;
const THREE_COL_MIN = 780;
const TWO_COL_MIN = 420;
const GRID_GAP_DESKTOP = 16;
const GRID_GAP_MOBILE = 12;
const CARD_MIN_HEIGHT = 156;

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
};

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, size + i));
  }
  return rows;
}

function FocusToolCard({
  tool,
  onPress,
}: {
  tool: FocusTool;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const available = tool.available;

  return (
    <Pressable
      onPress={available ? onPress : undefined}
      disabled={!available}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      accessibilityLabel={
        available ? tool.title : `${tool.title}, Coming next`
      }
      style={({ pressed, hovered, focused }: PressableState) => [
        styles.cardPressable,
        {
          backgroundColor: theme.surface,
          borderColor: available ? theme.accent : theme.surfaceBorder,
          borderWidth: available && (hovered || focused) ? 2 : 1.5,
        },
        pressed && available && styles.pressed,
        focused && Platform.OS === 'web' ? styles.focusRing : null,
        Platform.OS === 'web'
          ? ({ cursor: available ? 'pointer' : 'default' } as object)
          : null,
      ]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{tool.emoji}</Text>
        {!available ? (
          <View style={[styles.badge, { borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.badgeText, { color: theme.textMuted }]}>Coming next</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{tool.title}</Text>
      <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{tool.description}</Text>
    </Pressable>
  );
}

function FocusToolsGrid({
  columns,
  gap,
  children,
}: {
  columns: number;
  gap: number;
  children: ReactNode[];
}) {
  const rows = chunk(children, columns);

  return (
    <View style={[styles.grid, { gap }]}>
      {rows.map((row, rowIndex) => (
        <View key={`focus-row-${rowIndex}`} style={[styles.gridRow, { gap }]}>
          {row.map((child, colIndex) => (
            <View key={`focus-cell-${rowIndex}-${colIndex}`} style={styles.gridCell}>
              {child}
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`focus-spacer-${rowIndex}-${i}`} style={styles.gridCell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

export default function FocusScreen() {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const [selectedTool, setSelectedTool] = useState<FocusToolId | null>(null);
  const [sprintMounted, setSprintMounted] = useState(false);
  const [pomodoroMounted, setPomodoroMounted] = useState(false);
  const [tip] = useState(() => pickFocusTip());

  const openTool = (id: FocusToolId) => {
    if (id === 'sprint') {
      setSprintMounted(true);
      setSelectedTool('sprint');
      return;
    }
    if (id === 'pomodoro') {
      setPomodoroMounted(true);
      setSelectedTool('pomodoro');
    }
  };

  const isWide = viewportWidth >= WIDE_BREAKPOINT;
  const contentWidth = isWide ? viewportWidth - SIDEBAR_WIDTH : viewportWidth;
  const innerWidth = Math.min(contentWidth - spacing.lg * 2, HUB_MAX_WIDTH);
  const columns = innerWidth >= THREE_COL_MIN ? 3 : innerWidth >= TWO_COL_MIN ? 2 : 1;
  const gap = isWide ? GRID_GAP_DESKTOP : GRID_GAP_MOBILE;

  const showingSprint = selectedTool === 'sprint';
  const showingPomodoro = selectedTool === 'pomodoro';
  const showingHub = !showingSprint && !showingPomodoro;

  return (
    <AppShell title={showingSprint ? 'Focus Sprint' : showingPomodoro ? 'Pomodoro' : 'Focus'}>
      <ScreenContainer>
        <View style={showingHub ? styles.visible : styles.hidden}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.hubShell}>
              <View style={styles.hubInner}>
                <Text style={[styles.headline, { color: theme.text }]}>Focus</Text>
                <Text style={[styles.lede, { color: theme.text }]}>Stay with one thing, gently.</Text>
                <Text style={[styles.sub, { color: theme.textSecondary }]}>
                  Pick the kind of support your brain needs right now.
                </Text>

                <FocusToolsGrid columns={columns} gap={gap}>
                  {FOCUS_TOOLS.map((tool) => (
                    <FocusToolCard
                      key={tool.id}
                      tool={tool}
                      onPress={tool.available ? () => openTool(tool.id) : undefined}
                    />
                  ))}
                </FocusToolsGrid>

                <View
                  style={[
                    styles.tipPanel,
                    { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                  ]}>
                  <Text style={[styles.tipLabel, { color: theme.textMuted }]}>Quick focus tip</Text>
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {sprintMounted ? (
          <View style={showingSprint ? styles.visible : styles.hidden}>
            <FocusSprint onBack={() => setSelectedTool(null)} />
          </View>
        ) : null}

        {pomodoroMounted ? (
          <View style={showingPomodoro ? styles.visible : styles.hidden}>
            <Pomodoro onBack={() => setSelectedTool(null)} />
          </View>
        ) : null}
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  visible: { flex: 1 },
  hidden: { display: 'none' },
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  hubShell: {
    width: '100%',
    alignItems: 'center',
  },
  hubInner: {
    width: '100%',
    maxWidth: HUB_MAX_WIDTH,
    alignSelf: 'center',
  },
  headline: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  lede: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  grid: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  cardPressable: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  focusRing: {
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'solid',
          outlineWidth: 2,
          outlineColor: 'rgba(255, 138, 122, 0.55)',
          outlineOffset: 2,
        } as object)
      : null),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  badge: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardDesc: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  tipPanel: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tipLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tipText: {
    ...typography.bodySmall,
  },
});
