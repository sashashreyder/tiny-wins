import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { MoodButton, TagPill } from '@/components/design-system/Tags';
import { moodOptions, moodTags } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { MoodType } from '@/types';

export default function MoodScreen() {
  const theme = useAppTheme();
  const addMood = useAppStore((s) => s.addMood);
  const moodEntries = useAppStore((s) => s.moodEntries);

  const [mood, setMood] = useState<MoodType>('okay-ish');
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const save = () => {
    addMood({ mood, intensity, tags, note: note || undefined });
    setNote('');
    setTags([]);
  };

  return (
    <AppShell title="Mood Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>How does your brain feel?</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            Patterns are data, not proof that you're broken.
          </Text>

          <View style={styles.moodGrid}>
            {moodOptions.map((opt) => (
              <MoodButton
                key={opt.id}
                label={opt.label}
                emoji={opt.emoji}
                selected={mood === opt.id}
                onPress={() => setMood(opt.id)}
              />
            ))}
          </View>

          <SectionHeader title="Intensity" subtitle={`${intensity} / 5`} />
          <View style={styles.intensityRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TagPill key={n} label={String(n)} selected={intensity === n} onPress={() => setIntensity(n)} />
            ))}
          </View>

          <SectionHeader title="What might be affecting it?" />
          <View style={styles.pillGrid}>
            {moodTags.map((tag) => (
              <TagPill key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note..."
            placeholderTextColor={theme.textMuted}
            multiline
            style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
          />

          <GradientButton label="Save mood check-in" onPress={save} />

          <SectionHeader title="Recent entries" />
          {moodEntries.slice(0, 5).map((entry) => (
            <GlassCard key={entry.id} style={styles.entry}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                {moodOptions.find((m) => m.id === entry.mood)?.emoji}{' '}
                {moodOptions.find((m) => m.id === entry.mood)?.label} · {entry.intensity}/5
              </Text>
              {entry.note ? (
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{entry.note}</Text>
              ) : null}
            </GlassCard>
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
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.md },
  intensityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    minHeight: 80,
    marginBottom: spacing.md,
    ...typography.body,
  },
  entry: { marginBottom: spacing.sm },
});
