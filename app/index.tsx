import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

const STEPS = [
  'Pick what feels hard today',
  'Get tiny tools that match your brain state',
  'Complete small actions',
  'Earn points and grow your garden',
  'See proof that your day counted',
];

export default function LandingPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const profile = useAppStore((s) => s.userProfile);

  const isCompact = width < 700;
  const isTablet = width >= 700 && width < 1024;
  const isDesktop = width >= 1024;

  const stepColWidth = isDesktop ? '31.5%' : isTablet ? '48%' : '100%';
  const toolColWidth = isDesktop ? '31.5%' : isTablet ? '48%' : '100%';

  const goNext = () => {
    if (profile?.onboardingComplete) router.push('/dashboard');
    else router.push('/onboarding');
  };

  const loadDemo = () => {
    useAppStore.getState().loadDemoData();
    router.push('/dashboard');
  };

  const heroText = (
    <>
      <Text style={[styles.eyebrow, { color: theme.accentSecondary }]}>
        {brandNames[0]} · {brandNames[3]}
      </Text>
      <Text style={[styles.heroTitle, { color: theme.text }]}>Make tiny progress visible.</Text>
      <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
        A gentle ADHD-friendly app for starting tasks, tracking tiny wins, collecting rewards,
        and growing a cozy world from the things you actually did.
      </Text>
      <View style={[styles.ctaRow, isDesktop && styles.ctaRowDesktop]}>
        <View style={[styles.ctaButtonWrap, isDesktop && styles.ctaButtonWrapDesktop]}>
          <GradientButton label="Start with my brain today" onPress={goNext} />
        </View>
        <View style={[styles.ctaButtonWrap, isDesktop && styles.ctaButtonWrapDesktop]}>
          <GradientButton
            label="Explore the tools"
            onPress={() => router.push('/tools')}
            variant="secondary"
          />
        </View>
      </View>
      <View style={[styles.ctaButtonWrap, isDesktop && styles.ctaDemoWrap]}>
        <GradientButton label="Try with demo data" onPress={loadDemo} variant="ghost" />
      </View>
    </>
  );

  const heroGarden = (
    <View style={[styles.heroGarden, isDesktop && styles.heroGardenDesktop]}>
      <GardenScene height={isDesktop ? 280 : isTablet ? 240 : 200} />
    </View>
  );

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
            <View style={[styles.heroTextCol, isDesktop && styles.heroTextColDesktop]}>
              {heroText}
            </View>
            {heroGarden}
          </View>

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
            <View style={styles.grid}>
              {STEPS.map((step, i) => (
                <View key={step} style={{ width: stepColWidth }}>
                  <GlassCard style={styles.step}>
                    <Text style={[styles.stepNum, { color: theme.accent }]}>{i + 1}</Text>
                    <Text style={[styles.body, { color: theme.text, flex: 1 }]}>{step}</Text>
                  </GlassCard>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Tools that meet you where you are" />
            <View style={styles.grid}>
              {features.map((tool) => (
                <View key={tool.id} style={{ width: toolColWidth }}>
                  <ToolCard tool={tool} />
                </View>
              ))}
            </View>
          </View>

          <GlassCard style={styles.disclaimer}>
            <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>{disclaimer}</Text>
          </GlassCard>

          <View style={[styles.section, styles.bottomCta]}>
            <View style={[styles.ctaButtonWrap, isDesktop && styles.ctaBottomWrap]}>
              <GradientButton label="Start with my brain today" onPress={goNext} />
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  page: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTextCol: {
    gap: spacing.md,
  },
  heroTextColDesktop: {
    flex: 1,
    maxWidth: 560,
    minWidth: 0,
  },
  heroGarden: {
    width: '100%',
  },
  heroGardenDesktop: {
    flex: 1,
    minWidth: 0,
    maxWidth: 560,
  },
  eyebrow: { ...typography.caption, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { ...typography.hero, fontFamily: 'SpaceGrotesk_700Bold' },
  heroSub: { ...typography.body, maxWidth: 560 },
  ctaRow: {
    gap: spacing.sm,
    width: '100%',
  },
  ctaRowDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 560,
  },
  ctaButtonWrap: {
    width: '100%',
  },
  ctaButtonWrapDesktop: {
    flex: 1,
    minWidth: 200,
    maxWidth: 272,
  },
  ctaDemoWrap: {
    maxWidth: 560,
  },
  ctaBottomWrap: {
    maxWidth: 360,
    alignSelf: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  body: { ...typography.body },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: '100%',
  },
  stepNum: { ...typography.h2, width: 28 },
  disclaimer: { marginTop: spacing.sm },
  disclaimerText: { ...typography.caption, textAlign: 'center' },
  bottomCta: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
