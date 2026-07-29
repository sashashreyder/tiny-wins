import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { IconButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { ProgressBar, XPBadge } from '@/components/design-system/Progress';
import { ToolCard } from '@/components/design-system/Cards';
import { GardenPreview } from '@/components/garden/GardenScene';
import {
  getPrimaryAction,
  getRecommendedTools,
  getSupportModeLabel,
  getTodayWins,
  getXpToNextLevel,
} from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function DashboardScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const profile = useAppStore((s) => s.userProfile);
  const xpToday = useAppStore((s) => s.xpToday);
  const xpTotal = useAppStore((s) => s.xpTotal);
  const tinyWins = useAppStore((s) => s.tinyWins);
  const addWater = useAppStore((s) => s.addWater);
  const storeState = useAppStore();

  const todayWins = getTodayWins(storeState);
  const recommended = getRecommendedTools(profile);
  const primary = getPrimaryAction(profile);
  const xpToNext = getXpToNextLevel(xpTotal);
  const supportMode = getSupportModeLabel(profile);

  const quickActions = [
    { emoji: '🌱', label: "Can't Start", route: '/cant-start' },
    { emoji: '✨', label: 'Log Win', route: '/tiny-wins' },
    { emoji: '💧', label: 'Water', action: () => addWater() },
    { emoji: '📝', label: 'Brain Dump', route: '/journal' },
    { emoji: '⏱️', label: 'Focus', route: '/focus' },
    { emoji: '💭', label: 'Mood', route: '/mood' },
    { emoji: '🌙', label: 'Sleep', route: '/sleep' },
  ];

  return (
    <AppShell title="Dashboard">
      <ScreenContainer padded={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: theme.text }]}>
              Hey, your brain doesn't have to do everything at once.
            </Text>
            <Text style={[styles.mode, { color: theme.textSecondary }]}>
              Today's support mode: {supportMode}
            </Text>
          </View>

          <GlassCard glow onPress={() => router.push(primary.route as never)} style={styles.primary}>
            <Text style={[styles.primaryLabel, { color: theme.textSecondary }]}>Try this first</Text>
            <Text style={[styles.primaryAction, { color: theme.text }]}>{primary.label}</Text>
            <Text style={[styles.primaryHint, { color: theme.accentSecondary }]}>One small thing. Then we'll see →</Text>
          </GlassCard>

          <SectionHeader title="Quick actions" />
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <IconButton
                key={action.label}
                emoji={action.emoji}
                label={action.label}
                onPress={() =>
                  action.action ? action.action() : router.push(action.route as never)
                }
              />
            ))}
          </View>

          <View style={styles.statsRow}>
            <XPBadge xp={xpToday} size="lg" />
            <View style={{ flex: 1 }}>
              <ProgressBar
                progress={xpToNext > 0 ? 1 - xpToNext / (xpToNext + xpToday || 1) : 1}
                label={xpToNext > 0 ? `${xpToNext} XP until next garden item` : 'Garden blooming!'}
              />
            </View>
          </View>

          <SectionHeader
            title="Today's tiny wins"
            subtitle={todayWins.length ? undefined : 'Nothing logged yet — and that is okay.'}
          />
          {todayWins.length ? (
            todayWins.slice(0, 5).map((win) => (
              <GlassCard key={win.id} style={styles.winRow}>
                <Text style={{ fontSize: 18 }}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.winTitle, { color: theme.text }]}>{win.title}</Text>
                  {win.isHardToday ? (
                    <Text style={{ color: theme.accent, ...typography.caption }}>Hard today + bonus</Text>
                  ) : null}
                </View>
                <Text style={{ color: theme.textMuted, fontWeight: '600' }}>+{win.xp}</Text>
              </GlassCard>
            ))
          ) : (
            <SupportiveMessage message="Your day isn't empty until you decide it is. Log one tiny thing?" />
          )}

          <GardenPreview />

          <GlassCard onPress={() => router.push('/progress' as never)}>
            <Text style={[styles.proofTitle, { color: theme.text }]}>Proof of progress</Text>
            <Text style={[styles.proofBody, { color: theme.textSecondary }]}>
              Today you already did {todayWins.length || 'some'} things. That counts.
            </Text>
          </GlassCard>

          <SectionHeader title="Recommended for you" />
          {recommended.slice(0, 4).map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  header: { marginBottom: spacing.sm },
  greeting: { ...typography.h2, fontFamily: 'SpaceGrotesk_600SemiBold' },
  mode: { ...typography.body, marginTop: 4 },
  primary: { marginBottom: spacing.md },
  primaryLabel: { ...typography.caption, marginBottom: 4 },
  primaryAction: { ...typography.h2 },
  primaryHint: { ...typography.bodySmall, marginTop: spacing.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  winRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  winTitle: { ...typography.body, fontWeight: '600' },
  proofTitle: { ...typography.h3, marginBottom: 4 },
  proofBody: { ...typography.body },
});
