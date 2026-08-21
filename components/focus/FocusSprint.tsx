import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { TagPill } from '@/components/design-system/Tags';
import { GentleTimer } from '@/components/tools/GentleTimer';
import { focusModes, focusResults } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { FocusResult } from '@/types';

type Phase = 'setup' | 'running' | 'done';

const SPRINT_CONTENT_MAX_WIDTH = 640;
const START_BUTTON_MAX_WIDTH = 320;
const NARROW_BREAKPOINT = 700;

export function FocusSprint({ onBack }: { onBack: () => void }) {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const completeFocus = useAppStore((s) => s.completeFocus);
  const isNarrow = viewportWidth < NARROW_BREAKPOINT;

  const [phase, setPhase] = useState<Phase>('setup');
  const [minutes, setMinutes] = useState(10);
  const [title, setTitle] = useState('');
  const [smallest, setSmallest] = useState('');
  const [distractions, setDistractions] = useState<string[]>([]);
  const [distractionInput, setDistractionInput] = useState('');

  const start = (mins: number) => {
    setMinutes(mins || minutes);
    setPhase('running');
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

  const handleTimerFinish = useCallback(() => {
    setPhase('done');
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.sprintShell}>
        <View style={styles.sprintInner}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back to focus tools"
            hitSlop={8}
            style={styles.internalBack}>
            <Text style={[styles.internalBackText, { color: theme.textSecondary }]}>
              ← Back to focus tools
            </Text>
          </Pressable>

          <Text style={[styles.headline, { color: theme.text }]}>Just begin.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            ADHD-friendly sprints. Starting earns XP. Finishing optional.
          </Text>

          {phase === 'setup' && (
            <>
              <GlassCard>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  What are you focusing on?
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="One task, one tab..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                />
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  Smallest visible result?
                </Text>
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
              <View style={[styles.startWrap, isNarrow && styles.startWrapMobile]}>
                <GradientButton
                  label={`Start ${minutes}-minute sprint`}
                  onPress={() => start(minutes)}
                  style={styles.startButton}
                />
              </View>
            </>
          )}

          {phase === 'running' && (
            <GentleTimer
              key={`focus-${minutes}`}
              durationMinutes={minutes}
              title={title || 'Focus'}
              goal={smallest || 'Show up'}
              endLabel="End sprint"
              pauseLabel="Pause without shame"
              onFinish={handleTimerFinish}>
              <View style={styles.actionRow}>
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

              <GradientButton
                label="Make task smaller"
                onPress={() => setPhase('done')}
                variant="ghost"
                small
              />
            </GentleTimer>
          )}

          {phase === 'done' && (
            <>
              <SectionHeader title="What happened?" subtitle="Every answer earns XP" />
              {focusResults.map((r) => (
                <GlassCard
                  key={r.id}
                  onPress={() => finish(r.id as FocusResult)}
                  style={styles.resultCard}>
                  <Text style={{ color: theme.text, ...typography.body, fontWeight: '600' }}>
                    {r.label}
                  </Text>
                </GlassCard>
              ))}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  sprintShell: {
    width: '100%',
    alignItems: 'center',
  },
  sprintInner: {
    width: '100%',
    maxWidth: SPRINT_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  internalBack: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  internalBackText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  label: { ...typography.caption, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  startWrap: {
    width: '100%',
    minWidth: 240,
    maxWidth: START_BUTTON_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  startWrapMobile: {
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  startButton: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.sm,
  },
  resultCard: { marginBottom: spacing.sm },
});
