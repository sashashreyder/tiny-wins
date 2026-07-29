import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { GardenScene } from '@/components/garden/GardenScene';
import { disclaimer } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

const STEPS = [
  'Tell us what feels hard',
  'Use one tiny tool',
  'Watch your progress grow',
];

const LANDING_TOOLS = [
  { icon: '🌱', title: "I Can't Start", line: 'Make the first step smaller.' },
  { icon: '✨', title: 'Tiny Wins', line: 'Notice what already counted.' },
  { icon: '⏱️', title: 'Focus Sprint', line: 'Focus for a few minutes.' },
  { icon: '💭', title: 'Mood', line: 'A quick emotional check-in.' },
  { icon: '🌙', title: 'Sleep', line: 'Track patterns gently.' },
  { icon: '💧', title: 'Water', line: 'One-tap hydration.' },
];

export default function LandingPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const profile = useAppStore((s) => s.userProfile);

  const scrollRef = useRef<ScrollView>(null);
  const toolsSectionY = useRef(0);

  const isNarrow = width < 360;
  const isCompact = width < 700;
  const isTablet = width >= 700 && width < 1024;
  const isDesktop = width >= 1024;

  const stepColWidth = isCompact && !isTablet ? '100%' : isTablet ? '31.5%' : '31.5%';
  const toolColWidth = isNarrow
    ? '100%'
    : isCompact
      ? '48%'
      : isTablet
        ? width >= 820
          ? '31.5%'
          : '48%'
        : '31.5%';

  const goNext = () => {
    if (profile?.onboardingComplete) router.push('/dashboard');
    else router.push('/onboarding');
  };

  const scrollToTools = () => {
    scrollRef.current?.scrollTo({ y: toolsSectionY.current, animated: true });
  };

  const gardenHeight = isDesktop ? 240 : isTablet ? 200 : 160;

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {/* Hero */}
          <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
            <View style={[styles.heroTextCol, isDesktop && styles.heroTextColDesktop]}>
              <Text style={[styles.eyebrow, { color: theme.accentSecondary }]}>
                ADHD-friendly self-support
              </Text>
              <Text style={[styles.heroTitle, { color: theme.text }]}>
                Make tiny progress visible.
              </Text>
              <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
                Start when you're stuck, notice what already counted, and grow a little world from
                real-life wins.
              </Text>

              <View style={[styles.ctaRow, (isTablet || isDesktop) && styles.ctaRowInline]}>
                <View
                  style={[
                    styles.ctaButtonWrap,
                    (isTablet || isDesktop) && styles.ctaButtonWrapInline,
                  ]}>
                  <GradientButton label="Show me where to start" onPress={goNext} small />
                </View>
                <View
                  style={[
                    styles.ctaButtonWrap,
                    (isTablet || isDesktop) && styles.ctaButtonWrapInline,
                  ]}>
                  <GradientButton
                    label="See the tools"
                    onPress={scrollToTools}
                    variant="secondary"
                    small
                  />
                </View>
              </View>

              <Text style={[styles.ctaHelper, { color: theme.textMuted }]}>
                4 quick questions · No account required
              </Text>

              <View style={styles.trustBlock}>
                <View style={[styles.trustDot, { backgroundColor: theme.accentSecondary }]} />
                <View style={styles.trustText}>
                  <Text style={[styles.trustLine, { color: theme.textSecondary }]}>
                    Core tools are free. No subscription required.
                  </Text>
                  <Text style={[styles.trustLine, { color: theme.textMuted }]}>
                    Optional paid extras and donations will always be clearly labeled.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.heroGarden, isDesktop && styles.heroGardenDesktop]}>
              <GardenScene height={gardenHeight} />
            </View>
          </View>

          {/* Philosophy */}
          <View style={styles.philosophy}>
            <Text style={[styles.philosophyTitle, { color: theme.text }]}>
              Your brain may say nothing happened.
            </Text>
            <Text style={[styles.philosophyTagline, { color: theme.accentSecondary }]}>
              The garden keeps the receipts.
            </Text>
            <Text style={[styles.philosophyBody, { color: theme.textSecondary }]}>
              Tiny actions become visible progress you can return to later.
            </Text>
          </View>

          {/* How it works */}
          <View style={styles.section}>
            <SectionHeader title="How it works" />
            <View style={styles.grid}>
              {STEPS.map((step, i) => (
                <View key={step} style={{ width: stepColWidth }}>
                  <GlassCard style={styles.stepCard}>
                    <Text style={[styles.stepNum, { color: theme.accent }]}>{i + 1}</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
                  </GlassCard>
                </View>
              ))}
            </View>
          </View>

          {/* Tools preview */}
          <View
            style={styles.section}
            onLayout={(e) => {
              toolsSectionY.current = e.nativeEvent.layout.y;
            }}>
            <SectionHeader title="Tools that meet you where you are" />
            <View style={styles.grid}>
              {LANDING_TOOLS.map((tool) => (
                <View key={tool.title} style={{ width: toolColWidth }}>
                  <GlassCard style={styles.toolPreview}>
                    <Text style={styles.toolIcon}>{tool.icon}</Text>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>{tool.title}</Text>
                    <Text style={[styles.toolLine, { color: theme.textSecondary }]}>
                      {tool.line}
                    </Text>
                  </GlassCard>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.bottomCtaWrap}>
              <GradientButton label="Show me where to start" onPress={goNext} small />
            </View>
            <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>{disclaimer}</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  page: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroTextCol: {
    gap: spacing.sm,
  },
  heroTextColDesktop: {
    flex: 1,
    maxWidth: 520,
    minWidth: 0,
  },
  heroGarden: {
    width: '100%',
    marginTop: spacing.xs,
  },
  heroGardenDesktop: {
    flex: 1,
    minWidth: 0,
    maxWidth: 480,
    marginTop: 0,
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.hero,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    lineHeight: 38,
  },
  heroSub: {
    ...typography.body,
    maxWidth: 480,
    lineHeight: 22,
  },
  ctaRow: {
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  ctaRowInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  ctaButtonWrap: {
    width: '100%',
    maxWidth: 320,
  },
  ctaButtonWrapInline: {
    width: 240,
    maxWidth: 260,
    flexGrow: 0,
  },
  ctaHelper: {
    ...typography.caption,
    marginTop: -spacing.xs,
  },
  trustBlock: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    maxWidth: 480,
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  trustText: {
    flex: 1,
    gap: 2,
  },
  trustLine: {
    ...typography.caption,
    lineHeight: 18,
  },
  philosophy: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  philosophyTitle: {
    ...typography.h2,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  philosophyTagline: {
    ...typography.body,
    fontWeight: '600',
  },
  philosophyBody: {
    ...typography.bodySmall,
    maxWidth: 420,
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
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 56,
  },
  stepNum: {
    ...typography.h3,
    width: 22,
    fontWeight: '700',
  },
  stepText: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  toolPreview: {
    padding: spacing.sm,
    minHeight: 108,
    justifyContent: 'flex-start',
    gap: 4,
  },
  toolIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  toolTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  toolLine: {
    ...typography.caption,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  bottomCtaWrap: {
    width: '100%',
    maxWidth: 280,
  },
  disclaimerText: {
    ...typography.caption,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 16,
  },
});
