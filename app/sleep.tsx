import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { closingDayPrompts, sleepTags, wakeFeelings } from '@/data/content';
import { calculateXP } from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { WakeFeeling } from '@/types';

export default function SleepScreen() {
  const theme = useAppTheme();
  const addSleep = useAppStore((s) => s.addSleep);
  const addXP = useAppStore((s) => s.addXP);
  const sleepEntries = useAppStore((s) => s.sleepEntries);

  const [bedtime, setBedtime] = useState('23:00');
  const [sleepTime, setSleepTime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [hours, setHours] = useState('7');
  const [quality, setQuality] = useState(3);
  const [wakeFeeling, setWakeFeeling] = useState<WakeFeeling>('okay');
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [showCloseDay, setShowCloseDay] = useState(false);
  const [closeAnswers, setCloseAnswers] = useState(['', '', '']);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const save = () => {
    addSleep({
      bedtime,
      sleepTime,
      wakeTime,
      hours: parseFloat(hours) || 7,
      quality,
      wakeFeeling,
      tags,
      note: note || undefined,
    });
  };

  const closeDay = () => {
    addXP(calculateXP('close-day'));
    setShowCloseDay(false);
    setCloseAnswers(['', '', '']);
  };

  return (
    <AppShell title="Sleep Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Track sleep without judgment</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            No shame. Just data. Close the day gently.
          </Text>

          <GlassCard>
            {[
              { label: 'Bedtime', value: bedtime, set: setBedtime },
              { label: 'Fell asleep', value: sleepTime, set: setSleepTime },
              { label: 'Wake time', value: wakeTime, set: setWakeTime },
              { label: 'Hours slept', value: hours, set: setHours },
            ].map((field) => (
              <View key={field.label} style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{field.label}</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.set}
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
              </View>
            ))}
          </GlassCard>

          <SectionHeader title="Sleep quality" subtitle={`${quality} / 5`} />
          <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TagPill key={n} label={String(n)} selected={quality === n} onPress={() => setQuality(n)} />
            ))}
          </View>

          <SectionHeader title="Wake-up feeling" />
          <View style={styles.row}>
            {wakeFeelings.map((f) => (
              <TagPill
                key={f.id}
                label={f.label}
                selected={wakeFeeling === f.id}
                onPress={() => setWakeFeeling(f.id as WakeFeeling)}
              />
            ))}
          </View>

          <SectionHeader title="Notes / tags" />
          <View style={styles.row}>
            {sleepTags.map((tag) => (
              <TagPill key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>

          <GradientButton label="Save sleep entry" onPress={save} />

          <GlassCard style={styles.insight}>
            <Text style={[styles.insightTitle, { color: theme.text }]}>Gentle insights (demo)</Text>
            <Text style={{ color: theme.textSecondary, ...typography.bodySmall }}>
              • You often feel better after 6.5–7.5h{'\n'}
              • Long sleep sometimes feels heavy{'\n'}
              • Late emotional stress may affect bedtime resistance
            </Text>
            <Text style={{ color: theme.textMuted, ...typography.caption, marginTop: spacing.sm }}>
              Placeholder insights — not medical claims.
            </Text>
          </GlassCard>

          <GradientButton label="Close the Day" onPress={() => setShowCloseDay(true)} variant="secondary" />

          {showCloseDay && (
            <GlassCard glow>
              <Text style={[styles.headline, { color: theme.text, fontSize: 22 }]}>Close the Day</Text>
              {closingDayPrompts.map((prompt, i) => (
                <View key={prompt} style={styles.field}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>{prompt}</Text>
                  <TextInput
                    value={closeAnswers[i]}
                    onChangeText={(t) => {
                      const next = [...closeAnswers];
                      next[i] = t;
                      setCloseAnswers(next);
                    }}
                    multiline
                    style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                  />
                </View>
              ))}
              <Text style={[styles.closeMsg, { color: theme.accentSecondary }]}>
                Today was not perfect, but it is closed.
              </Text>
              <GradientButton label="Close gently (+15 XP)" onPress={closeDay} small />
            </GlassCard>
          )}

          <SectionHeader title="Recent logs" />
          {sleepEntries.slice(0, 3).map((entry) => (
            <GlassCard key={entry.id}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                {entry.hours}h · Quality {entry.quality}/5 · {entry.wakeFeeling}
              </Text>
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
  field: { marginBottom: spacing.sm },
  label: { ...typography.caption, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: spacing.sm, ...typography.body },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  insight: { marginVertical: spacing.md },
  insightTitle: { ...typography.h3, marginBottom: spacing.sm },
  closeMsg: { ...typography.body, fontWeight: '600', marginVertical: spacing.sm, textAlign: 'center' },
});
