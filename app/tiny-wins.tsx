import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { tinyWinTemplates } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { activitySourceLabels, buildActivityTimeline } from '@/lib/activityTimeline';
import { formatTimeForDisplay, todayLocalDateKey } from '@/lib/dateUtils';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { TinyWinCategory } from '@/types';

const categories = Object.keys(tinyWinTemplates) as TinyWinCategory[];

export default function TinyWinsScreen() {
  const theme = useAppTheme();
  const addTinyWin = useAppStore((s) => s.addTinyWin);
  const setHardDay = useAppStore((s) => s.setHardDay);
  const todayKey = todayLocalDateKey();
  const hardToday = useAppStore((s) => s.dayMetadata?.[todayKey]?.isHardDay ?? false);
  const tinyWins = useAppStore((s) => s.tinyWins);
  const waterEntries = useAppStore((s) => s.waterEntries);
  const sleepEntries = useAppStore((s) => s.sleepEntries);
  const moodEntries = useAppStore((s) => s.moodEntries);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const selfCareChecks = useAppStore((s) => s.selfCareChecks);
  const homeCareTasks = useAppStore((s) => s.homeCareTasks);
  const activityTimeline = useMemo(
    () =>
      buildActivityTimeline({
        tinyWins,
        waterEntries,
        sleepEntries,
        moodEntries,
        focusSessions,
        selfCareChecks,
        homeCareTasks,
      }),
    [
      tinyWins,
      waterEntries,
      sleepEntries,
      moodEntries,
      focusSessions,
      selfCareChecks,
      homeCareTasks,
    ],
  );

  const [category, setCategory] = useState<TinyWinCategory>('self-care');
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');

  const logWin = (title: string) => {
    addTinyWin(title, category, hardToday, note || undefined);
    setNote('');
    setCustom('');
  };

  const recent = activityTimeline.slice(0, 10);

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
            label={hardToday ? 'Hard day marked ✓' : 'Mark today as a hard day'}
            selected={hardToday}
            onPress={() => setHardDay(todayKey, !hardToday)}
          />
          <Text style={[styles.hardDayHint, { color: theme.textMuted }]}>
            Small things can count more on hard days.
          </Text>

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

          <SectionHeader
            title="Recent wins"
            subtitle={`${activityTimeline.length} recorded wins`}
          />
          {recent.map((entry) => {
            const time = formatTimeForDisplay(entry.createdAt);
            const meta = [activitySourceLabels[entry.source], time].filter(Boolean).join(' · ');
            const showXp = typeof entry.xp === 'number' && entry.xp > 0;

            return (
              <GlassCard key={entry.id} style={styles.winRow}>
                <View style={styles.winText}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>{entry.title}</Text>
                  {meta ? (
                    <Text style={{ color: theme.textMuted, ...typography.caption }}>{meta}</Text>
                  ) : null}
                </View>
                {showXp ? (
                  <Text style={{ color: theme.textMuted }}>+{entry.xp} XP</Text>
                ) : null}
              </GlassCard>
            );
          })}

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
  hardDayHint: { ...typography.caption, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  winRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  winText: { flex: 1, marginRight: spacing.sm },
});
