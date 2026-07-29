import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { ToolCard } from '@/components/design-system/Cards';
import { toolDefinitions } from '@/data/content';
import { ToolCategory } from '@/types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';

const filters: { id: ToolCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'start', label: 'Start' },
  { id: 'focus', label: 'Focus' },
  { id: 'calm', label: 'Calm' },
  { id: 'self-care', label: 'Self-care' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'home', label: 'Home' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'reflect', label: 'Reflect' },
  { id: 'low-energy', label: 'Low energy' },
];

export default function ToolsScreen() {
  const theme = useAppTheme();
  const [filter, setFilter] = useState<ToolCategory | 'all'>('all');

  const tools =
    filter === 'all'
      ? toolDefinitions
      : toolDefinitions.filter((t) => t.category === filter);

  return (
    <AppShell title="Tool Library">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Tools for every brain state</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            Every tool has a 10-second version. Pick what fits.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((f) => (
              <TagPill
                key={f.id}
                label={f.label}
                selected={filter === f.id}
                onPress={() => setFilter(f.id)}
              />
            ))}
          </ScrollView>

          <SectionHeader title={`${tools.length} tools`} />
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
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
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
});
