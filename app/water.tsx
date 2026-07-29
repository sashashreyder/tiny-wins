import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { ProgressBar } from '@/components/design-system/Progress';
import { getTodayWaterCups } from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function WaterScreen() {
  const theme = useAppTheme();
  const addWater = useAppStore((s) => s.addWater);
  const state = useAppStore();
  const goal = state.userProfile?.waterGoal ?? 5;
  const todayCups = getTodayWaterCups(state);
  const progress = todayCups / goal;

  return (
    <AppShell title="Water Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Hydration is not a personality test.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Just tap the cup.</Text>

          <GlassCard glow style={styles.cupCard}>
            <Text style={styles.bigEmoji}>💧</Text>
            <Text style={[styles.count, { color: theme.text }]}>
              {todayCups} / {goal} cups today
            </Text>
            <ProgressBar progress={progress} label={`${Math.round(progress * 100)}% of daily goal`} />
          </GlassCard>

          <GradientButton label="+ Add one cup (+3 XP)" onPress={() => addWater(1)} />

          <View style={styles.cupGrid}>
            {Array.from({ length: goal }).map((_, i) => (
              <GlassCard
                key={i}
                onPress={() => i >= todayCups && addWater(1)}
                style={{
                  ...styles.cup,
                  opacity: i < todayCups ? 1 : 0.7,
                }}>
                <Text style={{ fontSize: 32 }}>{i < todayCups ? '💧' : '🫙'}</Text>
              </GlassCard>
            ))}
          </View>

          <GlassCard>
            <Text style={{ color: theme.textSecondary, ...typography.body }}>
              Gentle reminder copy (no push notifications yet):{'\n\n'}
              "Hey. Water exists. One sip counts."
            </Text>
          </GlassCard>

          <SectionHeader title="Recent" />
          {state.waterEntries.slice(0, 5).map((entry) => (
            <Text key={entry.id} style={{ color: theme.textMuted, ...typography.caption }}>
              +{entry.amount} cup · {new Date(entry.createdAt).toLocaleTimeString()}
            </Text>
          ))}
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  cupCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.md },
  bigEmoji: { fontSize: 64, marginBottom: spacing.sm },
  count: { ...typography.h2, marginBottom: spacing.md },
  cupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md },
  cup: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
});
