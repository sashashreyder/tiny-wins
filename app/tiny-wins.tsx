import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { tinyWinTemplates } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { TinyWinCategory } from '@/types';

const categories = Object.keys(tinyWinTemplates) as TinyWinCategory[];

export default function TinyWinsScreen() {
  const theme = useAppTheme();
  const addTinyWin = useAppStore((s) => s.addTinyWin);
  const tinyWins = useAppStore((s) => s.tinyWins);

  const [category, setCategory] = useState<TinyWinCategory>('self-care');
  const [custom, setCustom] = useState('');
  const [hardToday, setHardToday] = useState(false);
  const [note, setNote] = useState('');

  const logWin = (title: string) => {
    addTinyWin(title, category, hardToday, note || undefined);
    setNote('');
    setCustom('');
  };

  return (
    <AppShell title="Tiny Wins">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Tiny is real.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            Log small actions. Starting counts. Finishing optional.
          </Text>

          <SectionHeader title="Category" />
          <View style={styles.pillGrid}>
            {categories.map((cat) => (
              <TagPill
                key={cat}
                label={cat.replace('-', ' ')}
                selected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </View>

          <TagPill
            label={hardToday ? 'Hard today ✓ (+bonus XP)' : 'Mark as hard today'}
            selected={hardToday}
            onPress={() => setHardToday(!hardToday)}
          />

          <SectionHeader title="Quick log" subtitle="Tap to log instantly" />
          <View style={styles.pillGrid}>
            {tinyWinTemplates[category].map((title) => (
              <TagPill key={title} label={title} onPress={() => logWin(title)} />
            ))}
          </View>

          <SectionHeader title="Custom tiny win" />
          <GlassCard>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="What did you do?"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional note"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
            />
            <GradientButton
              label="Log custom win"
              onPress={() => custom.trim() && logWin(custom.trim())}
              small
            />
          </GlassCard>

          <SectionHeader title="Recent wins" subtitle={`${tinyWins.length} total · no streak shame`} />
          {tinyWins.slice(0, 10).map((win) => (
            <GlassCard key={win.id} style={styles.winRow}>
              <Text style={{ color: theme.text, flex: 1, fontWeight: '600' }}>{win.title}</Text>
              <Text style={{ color: theme.textMuted }}>+{win.xp} XP</Text>
            </GlassCard>
          ))}

          <SupportiveMessage message="Progress is not only finished projects." />
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.sm },
  headline: { ...typography.h1 },
  sub: { ...typography.body, marginBottom: spacing.md },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  winRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
});
