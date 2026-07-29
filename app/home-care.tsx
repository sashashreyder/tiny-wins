import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { homeModes, homeTasks, homeZones } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function HomeCareScreen() {
  const theme = useAppTheme();
  const toggleHomeTask = useAppStore((s) => s.toggleHomeTask);
  const homeCareTasks = useAppStore((s) => s.homeCareTasks);

  const [zone, setZone] = useState(homeZones[0]);
  const [mode, setMode] = useState(homeModes[1]);
  const today = new Date().toDateString();

  const isDone = (label: string) =>
    homeCareTasks.some((t) => t.zone === zone && t.label === label && t.date === today && t.done);

  return (
    <AppShell title="Home Care">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Cleaning does not need to become a full personality arc.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            Pick a zone. Pick a mode. Do one tiny thing.
          </Text>

          <SectionHeader title="Zone" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {homeZones.map((z) => (
              <TagPill key={z} label={z} selected={zone === z} onPress={() => setZone(z)} />
            ))}
          </ScrollView>

          <SectionHeader title="Mode" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {homeModes.map((m) => (
              <TagPill key={m} label={m} selected={mode === m} onPress={() => setMode(m)} />
            ))}
          </ScrollView>

          <SectionHeader title={`${zone} tasks`} subtitle={mode} />
          {homeTasks.map((task) => (
            <GlassCard
              key={task}
              onPress={() => toggleHomeTask(zone, task)}
              style={{
                ...styles.task,
                ...(isDone(task) ? { borderColor: theme.accent } : {}),
              }}>
              <Text style={{ fontSize: 20 }}>{isDone(task) ? '✨' : '🏠'}</Text>
              <Text style={{ color: theme.text, flex: 1, fontWeight: '600' }}>{task}</Text>
            </GlassCard>
          ))}
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs, fontSize: 24 },
  sub: { ...typography.body, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  task: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
});
