import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { AchievementBadge } from '@/components/design-system/Cards';
import { XPBadge } from '@/components/design-system/Progress';
import { GardenScene } from '@/components/garden/GardenScene';
import { gardenVibeLabels } from '@/lib/theme';
import {
  getGardenLevel,
  getGardenStage,
  getNextGardenLevel,
  getXpToNextLevel,
} from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function GardenScreen() {
  const theme = useAppTheme();
  const xpTotal = useAppStore((s) => s.xpTotal);
  const gardenItems = useAppStore((s) => s.gardenItems);
  const achievements = useAppStore((s) => s.achievements);
  const profile = useAppStore((s) => s.userProfile);

  const level = getGardenLevel(xpTotal);
  const next = getNextGardenLevel(xpTotal);
  const stage = getGardenStage(xpTotal);
  const xpToNext = getXpToNextLevel(xpTotal);
  const vibe = profile?.gardenVibe ? gardenVibeLabels[profile.gardenVibe] : 'Soft lilac greenhouse';

  return (
    <AppShell title="Garden">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>
            Your garden grows from things your brain tried to erase.
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>{vibe}</Text>

          <GardenScene height={280} fit="contain" />

          <View style={styles.stats}>
            <XPBadge xp={xpTotal} size="lg" />
            <GlassCard style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>
                Level {level.level}: {level.name}
              </Text>
              <Text style={{ color: theme.textSecondary }}>{stage}</Text>
              {next ? (
                <Text style={{ color: theme.textMuted, ...typography.caption, marginTop: 4 }}>
                  {xpToNext} XP to {next.name}
                </Text>
              ) : null}
            </GlassCard>
          </View>

          <SectionHeader title="Recent growth" />
          {gardenItems.length ? (
            gardenItems.slice(-6).reverse().map((item) => (
              <GlassCard key={item.id} style={styles.growthItem}>
                <Text style={{ fontSize: 20 }}>🌿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>{item.type.replace('-', ' ')}</Text>
                  {item.unlockedBy ? (
                    <Text style={{ color: theme.textSecondary, ...typography.caption }}>
                      From: {item.unlockedBy}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: theme.textMuted, ...typography.caption }}>{item.unlockedAtXp} XP</Text>
              </GlassCard>
            ))
          ) : (
            <Text style={{ color: theme.textSecondary }}>Complete tiny wins to grow your world.</Text>
          )}

          <SectionHeader title="Achievements" subtitle="Returns over streaks" />
          <View style={styles.badgeGrid}>
            {achievements.map((a) => (
              <AchievementBadge key={a.id} {...a} />
            ))}
          </View>
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h2, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  growthItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
