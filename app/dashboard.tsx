import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { ProgressBar } from '@/components/design-system/Progress';
import { GardenPreview } from '@/components/garden/GardenScene';
import {
  getDashboardRecommendedTools,
  getGardenMilestoneProgress,
  getPrimaryAction,
  getSupportModeLabel,
  getTodayWins,
} from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radii } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { ToolDefinition } from '@/types';

const PAGE_MAX_WIDTH = 1160;
const MOBILE_PAD = 20;
const QUICK_GAP = 10;

const SECTION_GAP = {
  headerFeature: { mobile: 22, desktop: 26 },
  featureQuick: { mobile: 35, desktop: 40 },
  quickToday: { mobile: 36, desktop: 40 },
  todayGarden: { mobile: 36, desktop: 40 },
  gardenRecs: { mobile: 36, desktop: 40 },
} as const;

const FEATURE_CARD_MIN_HEIGHT = 152;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function DashboardQuickAction({
  emoji,
  label,
  onPress,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dashboardQuickBtn,
        { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
        pressed && styles.quickPressed,
      ]}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={[styles.quickLabel, { color: theme.textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuickActionsGrid({
  columns,
  gap,
  children,
}: {
  columns: number;
  gap: number;
  children: React.ReactNode[];
}) {
  const rows = chunk(children, columns);
  return (
    <View style={[styles.quickGrid, { gap }]}>
      {rows.map((row, rowIndex) => (
        <View key={`quick-row-${rowIndex}`} style={[styles.quickRow, { gap }]}>
          {row.map((child, colIndex) => (
            <View key={`quick-cell-${rowIndex}-${colIndex}`} style={styles.quickCell}>
              <View style={styles.quickActionWrap}>{child}</View>
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`quick-spacer-${rowIndex}-${i}`} style={styles.quickCell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function DashboardToolCard({ tool }: { tool: ToolDefinition }) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <GlassCard onPress={() => router.push(tool.route as never)} style={styles.recCard}>
      <View style={styles.recBody}>
        <View style={styles.recHeader}>
          <Text style={styles.recIcon}>{tool.icon}</Text>
          <Text style={[styles.recTitle, { color: theme.text }]} numberOfLines={2}>
            {tool.title}
          </Text>
        </View>
        <Text style={[styles.recDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {tool.description}
        </Text>
      </View>
    </GlassCard>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const profile = useAppStore((s) => s.userProfile);
  const xpTotal = useAppStore((s) => s.xpTotal);
  const addWater = useAppStore((s) => s.addWater);
  const storeState = useAppStore();

  const isWide = viewportWidth >= 900;
  const isDesktopRecs = viewportWidth >= 768;
  const quickColumns = isWide ? 8 : 4;
  const recColumns = isDesktopRecs ? 3 : 1;

  const gap = (key: keyof typeof SECTION_GAP) =>
    isWide ? SECTION_GAP[key].desktop : SECTION_GAP[key].mobile;

  const todayWins = getTodayWins(storeState);
  const primary = getPrimaryAction(profile);
  const recommended = getDashboardRecommendedTools(profile, primary.route);
  const milestone = getGardenMilestoneProgress(xpTotal);
  const supportMode = getSupportModeLabel(profile);

  const quickActions = [
    { emoji: '🌱', label: "Can't Start", route: '/cant-start' },
    { emoji: '✨', label: 'Log Win', route: '/tiny-wins' },
    { emoji: '💧', label: 'Water', action: () => addWater() },
    { emoji: '📝', label: 'Brain Dump', route: '/journal' },
    { emoji: '⏱️', label: 'Focus', route: '/focus' },
    { emoji: '💭', label: 'Mood', route: '/mood' },
    { emoji: '🌙', label: 'Sleep', route: '/sleep' },
    { emoji: '🫶', label: 'Self-Care', route: '/self-care' },
  ];

  const featureCardStyle = isWide ? styles.featureCardDesktop : styles.fillCard;

  const primaryCard = (
    <GlassCard
      glow
      onPress={() => router.push(primary.route as never)}
      style={featureCardStyle}>
      <Text style={[styles.primaryLabel, { color: theme.textSecondary }]}>Try this first</Text>
      <Text style={[styles.primaryAction, { color: theme.text }]}>{primary.label}</Text>
      <Text style={[styles.primaryHint, { color: theme.accentSecondary }]}>
        One small thing. Then we'll see →
      </Text>
    </GlassCard>
  );

  const progressCard = (
    <GlassCard
      onPress={() => router.push('/garden' as never)}
      style={featureCardStyle}
      accessibilityRole="button"
      accessibilityLabel="Garden progress, go to garden">
      <Text style={[styles.progressTitle, { color: theme.text }]}>Garden progress →</Text>
      {milestone.isComplete ? (
        <>
          <Text style={[styles.progressTotal, { color: theme.textSecondary }]}>
            {xpTotal} total XP
          </Text>
          <Text style={[styles.progressRemaining, { color: theme.textMuted }]}>
            Your garden is fully grown for now.
          </Text>
          <ProgressBar progress={1} />
        </>
      ) : (
        <>
          <Text style={[styles.progressTotal, { color: theme.textSecondary }]}>
            {xpTotal} / {milestone.nextMinXp} total XP
          </Text>
          <Text style={[styles.progressRemaining, { color: theme.textMuted }]}>
            {milestone.remainingXp} XP to unlock {milestone.nextLabel}
          </Text>
          <ProgressBar progress={milestone.progress} />
        </>
      )}
    </GlassCard>
  );

  const recRows = chunk(recommended, recColumns);

  return (
    <AppShell title="Dashboard">
      <ScreenContainer padded={false}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingHorizontal: isWide ? spacing.lg : MOBILE_PAD,
              paddingTop: isWide ? 30 : 24,
              paddingBottom: isWide ? 44 : 20,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.page}>
            <View style={styles.sectionTrack}>
              <View style={styles.header}>
                <Text style={[styles.greeting, { color: theme.text }]}>
                  Hey, your brain doesn't have to do everything at once.
                </Text>
                <Text style={[styles.mode, { color: theme.textSecondary }]}>
                  Today's support mode: {supportMode}
                </Text>
              </View>
            </View>

            <View style={[styles.sectionTrack, { marginTop: gap('headerFeature') }]}>
              {isWide ? (
                <View style={styles.featureRow}>
                  <View style={styles.featureCardWrap}>{primaryCard}</View>
                  <View style={styles.featureCardWrap}>{progressCard}</View>
                </View>
              ) : (
                <View style={styles.featureStack}>
                  {primaryCard}
                  {progressCard}
                </View>
              )}
            </View>

            <View style={[styles.sectionTrack, { marginTop: gap('featureQuick') }]}>
              <SectionHeader title="Quick actions" />
              <QuickActionsGrid columns={quickColumns} gap={QUICK_GAP}>
                {quickActions.map((action) => (
                  <DashboardQuickAction
                    key={action.label}
                    emoji={action.emoji}
                    label={action.label}
                    onPress={() =>
                      action.action ? action.action() : router.push(action.route as never)
                    }
                  />
                ))}
              </QuickActionsGrid>
            </View>

            <View style={[styles.sectionTrack, { marginTop: gap('quickToday') }]}>
              <SectionHeader
                title="Today's tiny wins"
                action={
                  todayWins.length ? (
                    <Pressable
                      onPress={() => router.push('/progress' as never)}
                      accessibilityRole="link"
                      accessibilityLabel="View proof of progress">
                      <Text style={[styles.headerAction, { color: theme.accentSecondary }]}>
                        View proof →
                      </Text>
                    </Pressable>
                  ) : undefined
                }
              />
              {todayWins.length ? (
                todayWins.slice(0, 5).map((win) => (
                  <GlassCard key={win.id} style={[styles.winRow, styles.fullWidthCard]}>
                    <Text style={{ fontSize: 18 }}>✨</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.winTitle, { color: theme.text }]}>{win.title}</Text>
                      {win.isHardToday ? (
                        <Text style={{ color: theme.accent, ...typography.caption }}>
                          Hard today + bonus
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ color: theme.textMuted, fontWeight: '600' }}>+{win.xp}</Text>
                  </GlassCard>
                ))
              ) : (
                <GlassCard
                  onPress={() => router.push('/tiny-wins' as never)}
                  style={[styles.emptyWins, styles.fullWidthCard]}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Nothing logged yet — and that is okay.
                  </Text>
                  <Text style={[styles.emptyAction, { color: theme.accentSecondary }]}>
                    Log one tiny win →
                  </Text>
                </GlassCard>
              )}
            </View>

            <View style={[styles.sectionTrack, { marginTop: gap('todayGarden') }]}>
              <View style={styles.fullWidthCard}>
                <GardenPreview />
              </View>
            </View>

            <View style={[styles.sectionTrack, { marginTop: gap('gardenRecs') }]}>
              <SectionHeader title="Recommended for you" />
              <View style={styles.recGrid}>
                {recRows.map((row, rowIndex) => (
                  <View key={`rec-row-${rowIndex}`} style={[styles.recRow, { gap: QUICK_GAP }]}>
                    {row.map((tool) => (
                      <View key={tool.id} style={styles.recCell}>
                        <DashboardToolCard tool={tool} />
                      </View>
                    ))}
                    {row.length < recColumns
                      ? Array.from({ length: recColumns - row.length }).map((_, i) => (
                          <View key={`rec-spacer-${rowIndex}-${i}`} style={styles.recCell} />
                        ))
                      : null}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  page: {
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  sectionTrack: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
  },
  fullWidthCard: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
  },
  header: {
    marginBottom: 0,
  },
  greeting: {
    ...typography.h2,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    lineHeight: 30,
  },
  mode: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
    width: '100%',
    alignSelf: 'stretch',
  },
  featureCardWrap: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  featureStack: {
    gap: spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  fillCard: {
    width: '100%',
  },
  featureCardDesktop: {
    flex: 1,
    width: '100%',
    minHeight: FEATURE_CARD_MIN_HEIGHT,
    justifyContent: 'space-between',
  },
  primaryLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  primaryAction: {
    ...typography.h2,
    lineHeight: 28,
  },
  primaryHint: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
  },
  progressTitle: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  progressTotal: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressRemaining: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  quickGrid: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
  },
  quickRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  quickCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  quickActionWrap: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
  },
  dashboardQuickBtn: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'stretch',
    flex: 1,
    minWidth: 0,
  },
  quickEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  quickPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  headerAction: {
    ...typography.caption,
    fontWeight: '700',
  },
  winRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  winTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  emptyWins: {
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  emptyAction: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  recGrid: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
    gap: QUICK_GAP,
  },
  recRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  recCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  recCard: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
    minHeight: 92,
    justifyContent: 'center',
  },
  recBody: {
    gap: spacing.xs,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  recTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  recDesc: {
    ...typography.caption,
    lineHeight: 18,
  },
});
