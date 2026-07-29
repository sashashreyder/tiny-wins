import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { brainDumpModes } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { BrainDumpMode } from '@/types';

export default function JournalScreen() {
  const theme = useAppTheme();
  const addBrainDump = useAppStore((s) => s.addBrainDump);
  const entries = useAppStore((s) => s.brainDumpEntries);

  const [mode, setMode] = useState<BrainDumpMode>('brain-dump');
  const [text, setText] = useState('');
  const [scaryStep, setScaryStep] = useState(0);
  const [thoughtType, setThoughtType] = useState('');

  const currentMode = brainDumpModes.find((m) => m.id === mode)!;

  const save = () => {
    if (!text.trim()) return;
    addBrainDump({ mode, text: text.trim(), tags: thoughtType ? [thoughtType] : [] });
    setText('');
    setScaryStep(0);
    setThoughtType('');
  };

  return (
    <AppShell title="Brain Dump">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Park it here.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            You don't have to carry it. Simple capture, not therapy-heavy.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRow}>
            {brainDumpModes.map((m) => (
              <TagPill
                key={m.id}
                label={m.label}
                selected={mode === m.id}
                onPress={() => {
                  setMode(m.id);
                  setScaryStep(0);
                }}
              />
            ))}
          </ScrollView>

          <GlassCard glow>
            <Text style={[styles.prompt, { color: theme.textSecondary }]}>{currentMode.prompt}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder="Write freely..."
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
            />

            {mode === 'scary-thought' && text.length > 0 && (
              <View style={styles.scaryFlow}>
                {scaryStep === 0 && (
                  <>
                    <Text style={{ color: theme.text, marginBottom: spacing.sm }}>
                      Is this a fact, fear, prediction, or memory?
                    </Text>
                    {['fact', 'fear', 'prediction', 'memory'].map((t) => (
                      <TagPill
                        key={t}
                        label={t}
                        onPress={() => {
                          setThoughtType(t);
                          setScaryStep(1);
                        }}
                      />
                    ))}
                  </>
                )}
                {scaryStep === 1 && (
                  <Text style={{ color: theme.textSecondary, ...typography.bodySmall }}>
                    What is one fact you know right now? What can wait until tomorrow?
                  </Text>
                )}
              </View>
            )}

            <GradientButton label="Save (+8 XP)" onPress={save} small />
          </GlassCard>

          <SectionHeader title="Recent entries" />
          {entries.slice(0, 8).map((entry) => (
            <GlassCard key={entry.id} style={styles.entry}>
              <Text style={{ color: theme.accent, ...typography.caption, fontWeight: '700' }}>
                {brainDumpModes.find((m) => m.id === entry.mode)?.label}
              </Text>
              <Text style={{ color: theme.text, marginTop: 4 }} numberOfLines={3}>
                {entry.text}
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
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  prompt: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    minHeight: 120,
    marginBottom: spacing.md,
    ...typography.body,
    textAlignVertical: 'top',
  },
  scaryFlow: { marginBottom: spacing.md },
  entry: { marginBottom: spacing.sm },
});
