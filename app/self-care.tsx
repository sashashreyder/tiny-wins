import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { selfCareItems } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function SelfCareScreen() {
  const theme = useAppTheme();
  const toggleSelfCare = useAppStore((s) => s.toggleSelfCare);
  const selfCareChecks = useAppStore((s) => s.selfCareChecks);
  const lowEnergy = useAppStore((s) => s.userProfile?.lowEnergyMode);
  const today = new Date().toDateString();

  const isDone = (label: string) =>
    selfCareChecks.some((c) => c.label === label && c.date === today && c.done);

  return (
    <AppShell title="Self-Care Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Basic care counts.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {lowEnergy
              ? 'Low energy mode on — extra XP for any self-care ✨'
              : 'Tap what you did. No perfect days required.'}
          </Text>

          {selfCareItems.map((item) => (
            <GlassCard
              key={item}
              onPress={() => toggleSelfCare(item)}
              style={{
                ...styles.item,
                ...(isDone(item)
                  ? { borderColor: theme.accentSecondary, borderWidth: 2 }
                  : {}),
              }}>
              <Text style={{ fontSize: 24 }}>{isDone(item) ? '✅' : '⬜'}</Text>
              <Text style={[styles.itemLabel, { color: theme.text }]}>{item}</Text>
            </GlassCard>
          ))}

          <SupportiveMessage message="A low-energy win is still a win." />
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  itemLabel: { ...typography.body, fontWeight: '600', flex: 1 },
});
