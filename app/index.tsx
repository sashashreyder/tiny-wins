import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { ToolCard } from '@/components/design-system/Cards';
import { GardenScene } from '@/components/garden/GardenScene';
import { disclaimer, toolDefinitions } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { brandNames, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

const features = toolDefinitions.slice(0, 6);

export default function LandingPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.userProfile);

  const goNext = () => {
    if (profile?.onboardingComplete) router.push('/dashboard');
    else router.push('/onboarding');
  };

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.accentSecondary }]}>
            {brandNames[0]} · {brandNames[3]}
          </Text>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Make tiny progress visible.</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            A gentle ADHD-friendly app for starting tasks, tracking tiny wins, collecting rewards,
            and growing a cozy world from the things you actually did.
          </Text>
          <View style={styles.ctaRow}>
            <GradientButton label="Start with my brain today" onPress={goNext} />
            <GradientButton label="Explore the tools" onPress={() => router.push('/tools')} variant="secondary" />
          </View>
          <GradientButton
            label="Try with demo data"
            onPress={() => {
              useAppStore.getState().loadDemoData();
              router.push('/dashboard');
            }}
            variant="ghost"
          />
        </View>

        <GardenScene height={200} />

        <View style={styles.section}>
          <SectionHeader
            title="Your brain says you did nothing."
            subtitle="But you probably did more than you think."
          />
          <GlassCard>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              Starting is hard. Switching is hard. Progress is invisible. This app helps you notice
              tiny actions, restart gently, and see proof that your day counted.
            </Text>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <SectionHeader title="How it works" />
          {[
            'Pick what feels hard today',
            'Get tiny tools that match your brain state',
            'Complete small actions',
            'Earn points and grow your garden',
            'See proof that your day counted',
          ].map((step, i) => (
            <GlassCard key={step} style={styles.step}>
              <Text style={[styles.stepNum, { color: theme.accent }]}>{i + 1}</Text>
              <Text style={[styles.body, { color: theme.text, flex: 1 }]}>{step}</Text>
            </GlassCard>
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Tools that meet you where you are" />
          {features.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </View>

        <GlassCard style={styles.disclaimer}>
          <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>{disclaimer}</Text>
        </GlassCard>

        <View style={styles.section}>
          <GradientButton label="Start with my brain today" onPress={goNext} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { gap: spacing.md, marginBottom: spacing.md },
  eyebrow: { ...typography.caption, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { ...typography.hero, fontFamily: 'SpaceGrotesk_700Bold' },
  heroSub: { ...typography.body, maxWidth: 560 },
  ctaRow: { gap: spacing.sm },
  section: { gap: spacing.sm },
  body: { ...typography.body },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: { ...typography.h2, width: 28 },
  disclaimer: { marginTop: spacing.sm },
  disclaimerText: { ...typography.caption, textAlign: 'center' },
});
