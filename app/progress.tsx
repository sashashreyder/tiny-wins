import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { AppShell } from '@/components/design-system/AppShell';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { XPBadge } from '@/components/design-system/Progress';
import {
  getCategoriesTouched,
  getFocusAttemptsToday,
  getTodayWins,
  getWeekWins,
} from '@/lib/recommendations';
import { colors, spacing, typography } from '@/lib/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';

export default function ProgressScreen() {
  const theme = useAppTheme();
  const state = useAppStore();
  const markEvent = useAppStore((s) => s.markAchievementEvent);

  const todayWins = getTodayWins(state);
  const weekWins = getWeekWins(state);
  const categories = getCategoriesTouched(state, weekWins);
  const hardWins = weekWins.filter((w) => w.isHardToday);
  const focusAttempts = getFocusAttemptsToday(state);
  const claimedRewards = state.rewards.filter((r) => r.claimed);

  useEffect(() => {
    markEvent('view-progress');
  }, [markEvent]);

  return (
    <AppShell title="Proof of Progress">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>
            Your brain may say nothing happened. Here is the receipt.
          </Text>

          <LinearGradient
            colors={[colors.softLilac, colors.aqua, colors.softCoral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareCard}>
            <Text style={styles.shareTitle}>Today I counted {todayWins.length} tiny wins.</Text>
            <Text style={styles.shareSub}>Not nothing.</Text>
            <Text style={styles.shareBrand}>Tiny Wins Garden ✨</Text>
          </LinearGradient>

          <View style={styles.statsGrid}>
            <GlassCard style={styles.stat}>
              <Text style={[styles.statNum, { color: theme.text }]}>{todayWins.length}</Text>
              <Text style={{ color: theme.textSecondary }}>Today</Text>
            </GlassCard>
            <GlassCard style={styles.stat}>
              <Text style={[styles.statNum, { color: theme.text }]}>{weekWins.length}</Text>
              <Text style={{ color: theme.textSecondary }}>This week</Text>
            </GlassCard>
            <GlassCard style={styles.stat}>
              <Text style={[styles.statNum, { color: theme.text }]}>{state.returns}</Text>
              <Text style={{ color: theme.textSecondary }}>Returns</Text>
            </GlassCard>
            <GlassCard style={styles.stat}>
              <Text style={[styles.statNum, { color: theme.text }]}>{hardWins.length}</Text>
              <Text style={{ color: theme.textSecondary }}>Hard today</Text>
            </GlassCard>
          </View>

          <XPBadge xp={state.xpToday} size="lg" />

          <SectionHeader title="Today's wins" />
          {todayWins.length ? (
            todayWins.map((w) => (
              <GlassCard key={w.id} style={styles.row}>
                <Text style={{ color: theme.text, flex: 1 }}>{w.title}</Text>
                <Text style={{ color: theme.textMuted }}>+{w.xp}</Text>
              </GlassCard>
            ))
          ) : (
            <Text style={{ color: theme.textSecondary }}>No wins logged yet today.</Text>
          )}

          <SectionHeader title="Categories touched this week" />
          <View style={styles.tagRow}>
            {categories.map((c) => (
              <Text key={c} style={[styles.tag, { backgroundColor: theme.accentTertiary + '44', color: theme.text }]}>
                {c}
              </Text>
            ))}
          </View>

          <SectionHeader title="Invisible effort" />
          <GlassCard>
            <Text style={{ color: theme.textSecondary, ...typography.body }}>
              • Focus attempts: {focusAttempts.length}{'\n'}
              • Mood check-ins: {state.moodEntries.length}{'\n'}
              • Brain dumps: {state.brainDumpEntries.length}{'\n'}
              • Rewards claimed: {claimedRewards.length}{'\n'}
              • Garden items: {state.gardenItems.length}{'\n'}
              • Total wins ever: {state.tinyWins.length}
            </Text>
          </GlassCard>

          <SectionHeader title="Hard things attempted" />
          {hardWins.slice(0, 5).map((w) => (
            <Text key={w.id} style={{ color: theme.text, marginBottom: 4 }}>
              💪 {w.title}
            </Text>
          ))}
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h2, marginBottom: spacing.lg },
  shareCard: {
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: 180,
    justifyContent: 'center',
  },
  shareTitle: { ...typography.h2, color: colors.inkViolet, fontWeight: '700' },
  shareSub: { ...typography.hero, color: colors.inkViolet, marginTop: spacing.sm },
  shareBrand: { ...typography.caption, color: colors.inkViolet, marginTop: spacing.md, opacity: 0.7 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  stat: { width: '47%', alignItems: 'center', paddingVertical: spacing.md },
  statNum: { ...typography.h1, fontSize: 32 },
  row: { flexDirection: 'row', marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, ...typography.caption },
});
