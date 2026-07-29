import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { EnergySelector } from '@/components/garden/GardenScene';
import {
  gardenVibeOptions,
  problemOptions,
  supportStyleOptions,
} from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import {
  EnergyLevel,
  GardenVibe,
  StruggleId,
  SupportStyle,
  UserProfile,
} from '@/types';

const steps = ['struggle', 'energy', 'support', 'garden', 'done'] as const;

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [mainStruggle, setMainStruggle] = useState<StruggleId>('cant-start');
  const [secondary, setSecondary] = useState<StruggleId[]>([]);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('low');
  const [supportStyle, setSupportStyle] = useState<SupportStyle>('tiny-steps');
  const [gardenVibe, setGardenVibe] = useState<GardenVibe>('lilac-greenhouse');

  const toggleSecondary = (id: StruggleId) => {
    setSecondary((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 2 ? [...prev, id] : prev,
    );
  };

  const finish = () => {
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      mainStruggle,
      secondaryStruggles: secondary,
      energyLevel,
      supportStyle,
      gardenVibe,
      theme: 'system',
      onboardingComplete: true,
      lowEnergyMode: energyLevel === 'low' || energyLevel === 'empty-battery',
      reducedMotion: false,
      waterGoal: 5,
      focusDuration: 10,
      claimWithoutSpending: false,
      createdAt: new Date().toISOString(),
    };
    completeOnboarding(profile);
    router.replace('/dashboard');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.progress, { color: theme.textMuted }]}>
          Step {step + 1} of {steps.length}
        </Text>

        {step === 0 && (
          <>
            <SectionHeader
              title="What feels hardest today?"
              subtitle="Pick one main struggle. Optional: add up to 2 more."
            />
            <View style={styles.pillGrid}>
              {problemOptions.map((opt) => (
                <TagPill
                  key={opt.id}
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={mainStruggle === opt.id || secondary.includes(opt.id)}
                  onPress={() => {
                    if (mainStruggle === opt.id) return;
                    if (secondary.includes(opt.id)) toggleSecondary(opt.id);
                    else if (mainStruggle !== opt.id && !secondary.includes(opt.id)) {
                      if (secondary.length === 0 && mainStruggle) {
                        // first selection becomes main
                      }
                    }
                    if (opt.id === mainStruggle) return;
                    const isSecondary = secondary.includes(opt.id);
                    if (isSecondary) toggleSecondary(opt.id);
                    else setMainStruggle(opt.id);
                  }}
                />
              ))}
            </View>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Tap to set main struggle. Long-press secondary coming soon — for now, main only.
            </Text>
          </>
        )}

        {step === 1 && (
          <>
            <SectionHeader title="What's your energy like?" />
            <EnergySelector value={energyLevel} onChange={(v) => setEnergyLevel(v as EnergyLevel)} />
          </>
        )}

        {step === 2 && (
          <>
            <SectionHeader title="What kind of support helps?" />
            <View style={styles.pillGrid}>
              {supportStyleOptions.map((opt) => (
                <TagPill
                  key={opt.id}
                  label={opt.label}
                  selected={supportStyle === opt.id}
                  onPress={() => setSupportStyle(opt.id as SupportStyle)}
                />
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <SectionHeader title="Choose your garden vibe" />
            <View style={styles.vibeGrid}>
              {gardenVibeOptions.map((opt) => (
                <GlassCard
                  key={opt.id}
                  onPress={() => setGardenVibe(opt.id as GardenVibe)}
                  style={{
                    ...styles.vibeCard,
                    ...(gardenVibe === opt.id
                      ? { borderColor: theme.accent, borderWidth: 2 }
                      : {}),
                  }}>
                  <Text style={{ fontSize: 36 }}>{opt.emoji}</Text>
                  <Text style={[styles.vibeLabel, { color: theme.text }]}>{opt.label}</Text>
                </GlassCard>
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <GlassCard glow style={styles.doneCard}>
            <Text style={{ fontSize: 48 }}>🌱</Text>
            <Text style={[styles.doneTitle, { color: theme.text }]}>Your brain garden is ready</Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Tiny is real. Starting counts. Let's go gently.
            </Text>
          </GlassCard>
        )}

        <View style={styles.nav}>
          {step > 0 ? (
            <GradientButton label="Back" onPress={() => setStep(step - 1)} variant="ghost" style={{ flex: 1 }} />
          ) : null}
          <GradientButton
            label={step === 4 ? 'Go to dashboard' : 'Continue'}
            onPress={() => (step === 4 ? finish() : setStep(step + 1))}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  progress: { ...typography.caption, marginBottom: spacing.md },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  hint: { ...typography.bodySmall, marginBottom: spacing.lg },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  vibeCard: { width: '47%', alignItems: 'center', paddingVertical: spacing.lg },
  vibeLabel: { ...typography.bodySmall, fontWeight: '600', textAlign: 'center', marginTop: spacing.sm },
  doneCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  doneTitle: { ...typography.h1, textAlign: 'center' },
  nav: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
