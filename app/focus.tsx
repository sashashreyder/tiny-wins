import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { focusModes, focusResults } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { FocusResult } from '@/types';

type Phase = 'setup' | 'running' | 'done';

export default function FocusScreen() {
  const theme = useAppTheme();
  const completeFocus = useAppStore((s) => s.completeFocus);

  const [phase, setPhase] = useState<Phase>('setup');
  const [minutes, setMinutes] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [title, setTitle] = useState('');
  const [smallest, setSmallest] = useState('');
  const [distractions, setDistractions] = useState<string[]>([]);
  const [distractionInput, setDistractionInput] = useState('');
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, paused]);

  const start = (mins: number) => {
    setMinutes(mins || minutes);
    setSecondsLeft((mins || minutes) * 60);
    setPhase('running');
    setPaused(false);
  };

  const finish = (result: FocusResult) => {
    completeFocus(
      { title: title || 'Focus session', duration: minutes, distractions, result },
      result,
    );
    setPhase('setup');
    setTitle('');
    setSmallest('');
    setDistractions([]);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <AppShell title="Focus Sprint">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Just begin.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            ADHD-friendly sprints. Starting earns XP. Finishing optional.
          </Text>

          {phase === 'setup' && (
            <>
              <GlassCard>
                <Text style={[styles.label, { color: theme.textSecondary }]}>What are you focusing on?</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="One task, one tab..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.label, { color: theme.textSecondary }]}>Smallest visible result?</Text>
                <TextInput
                  value={smallest}
                  onChangeText={setSmallest}
                  placeholder="Open the doc, write one line..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
              </GlassCard>

              <SectionHeader title="Pick a sprint" />
              <View style={styles.modeGrid}>
                {focusModes.map((mode) => (
                  <TagPill
                    key={mode.label}
                    label={mode.minutes ? `${mode.minutes} min` : 'Custom'}
                    selected={minutes === mode.minutes && mode.minutes > 0}
                    onPress={() => mode.minutes && setMinutes(mode.minutes)}
                  />
                ))}
              </View>
              <GradientButton label={`Start ${minutes}-minute sprint`} onPress={() => start(minutes)} />
            </>
          )}

          {phase === 'running' && (
            <GlassCard glow style={styles.timerCard}>
              <Text style={[styles.timer, { color: theme.text }]}>{formatTime(secondsLeft)}</Text>
              <Text style={[styles.focusTitle, { color: theme.textSecondary }]}>{title || 'Focus'}</Text>
              <Text style={{ color: theme.textMuted, marginBottom: spacing.md }}>
                Goal: {smallest || 'Show up'}
              </Text>

              <View style={styles.actionRow}>
                <GradientButton
                  label={paused ? 'Resume' : 'Pause without shame'}
                  onPress={() => setPaused(!paused)}
                  variant="ghost"
                  small
                  style={{ flex: 1 }}
                />
                <GradientButton
                  label="I got distracted"
                  onPress={() => {
                    if (distractionInput.trim()) {
                      setDistractions([...distractions, distractionInput.trim()]);
                      setDistractionInput('');
                    }
                  }}
                  variant="secondary"
                  small
                  style={{ flex: 1 }}
                />
              </View>

              <TextInput
                value={distractionInput}
                onChangeText={setDistractionInput}
                placeholder="Distraction parking lot..."
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
              />

              <GradientButton label="Make task smaller" onPress={() => setPhase('done')} variant="ghost" small />
              <GradientButton label="End sprint" onPress={() => setPhase('done')} small />
            </GlassCard>
          )}

          {phase === 'done' && (
            <>
              <SectionHeader title="What happened?" subtitle="Every answer earns XP" />
              {focusResults.map((r) => (
                <GlassCard key={r.id} onPress={() => finish(r.id as FocusResult)} style={styles.resultCard}>
                  <Text style={{ color: theme.text, ...typography.body, fontWeight: '600' }}>{r.label}</Text>
                </GlassCard>
              ))}
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  label: { ...typography.caption, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, ...typography.body },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  timerCard: { alignItems: 'center', paddingVertical: spacing.xl },
  timer: { fontSize: 64, fontWeight: '700', fontVariant: ['tabular-nums'] },
  focusTitle: { ...typography.h3, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginBottom: spacing.sm },
  resultCard: { marginBottom: spacing.sm },
});
