import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { GardenScene } from '@/components/garden/GardenScene';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

const PAGE_MAX_WIDTH = 1180;
const MOBILE_PAD = 20;

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

const TOOL_GRID_GAP = 12;

const SECTION_GAP = {
  heroPhilosophy: { mobile: 38, desktop: 48 },
  philosophyHow: { mobile: 38, desktop: 52 },
  howTools: { mobile: 40, desktop: 52 },
  toolsFooter: { mobile: 40, desktop: 48 },
} as const;

const MOBILE_CTA_WIDTH = 280;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function BalancedRow({
  gap,
  children,
}: {
  gap: number;
  children: React.ReactNode[];
}) {
  return (
    <View style={[styles.balancedRow, { gap }]}>
      {children.map((child, index) => (
        <View key={index} style={styles.balancedCell}>
          {child}
        </View>
      ))}
    </View>
  );
}

export default function LandingPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const profile = useAppStore((s) => s.userProfile);

  const scrollRef = useRef<ScrollView>(null);
  const toolsSectionY = useRef(0);

  const isNarrow = viewportWidth < 350;
  const isMobile = viewportWidth < 700;
  const isDesktop = viewportWidth >= 1024;

  const pageWidth = Math.min(viewportWidth - (isDesktop ? spacing.lg * 2 : MOBILE_PAD * 2), PAGE_MAX_WIDTH);
  const gridGap = isMobile ? TOOL_GRID_GAP : spacing.md;

  const toolColumns = isNarrow ? 1 : 2;
  const toolRows = useMemo(() => chunk(LANDING_TOOLS, toolColumns), [toolColumns]);

  const gap = (key: keyof typeof SECTION_GAP) =>
    isDesktop ? SECTION_GAP[key].desktop : SECTION_GAP[key].mobile;

  const goNext = () => {
    if (profile?.onboardingComplete) router.push('/dashboard');
    else router.push('/onboarding');
  };

  const scrollToTools = () => {
    scrollRef.current?.scrollTo({ y: toolsSectionY.current, animated: true });
  };

  const gardenHeight = isDesktop ? 280 : isMobile ? 165 : 190;
  const heroTitleSize = isDesktop ? Math.min(58, pageWidth * 0.048) : 42;
  const heroTitleLine = isDesktop ? heroTitleSize * 1.08 : 48;

  const ctaPrimary = (
    <View style={isDesktop ? styles.ctaPrimaryDesktop : styles.ctaPrimaryMobile}>
      <View style={isDesktop ? styles.ctaPrimaryWrapDesktop : styles.ctaPrimaryWrapMobile}>
        <GradientButton label="Show me where to start" onPress={goNext} small />
      </View>
      <Text
        style={[
          styles.ctaHelper,
          !isDesktop && styles.ctaHelperMobile,
          { color: theme.textMuted },
        ]}>
        4 quick questions · No account required
      </Text>
    </View>
  );

  const ctaSecondary = (
    <View style={isDesktop ? styles.ctaSecondaryWrapDesktop : styles.ctaSecondaryWrapMobile}>
      <GradientButton label="See the tools" onPress={scrollToTools} variant="secondary" small />
    </View>
  );

  const trustNote = (
    <View
      style={[
        styles.trustNote,
        {
          backgroundColor: theme.accentTertiary + '18',
          borderColor: theme.surfaceBorder,
        },
      ]}>
      <View style={[styles.trustAccent, { backgroundColor: theme.accentSecondary }]} />
      <Text style={[styles.trustPrimary, { color: theme.text }]}>
        Core tools are free. No subscription required.
      </Text>
      <Text style={[styles.trustSecondary, { color: theme.textMuted }]}>
        Optional paid extras and donations will always be clearly labeled.
      </Text>
    </View>
  );

  const heroCopy = (
    <>
      <Text
        style={[
          styles.heroTitle,
          {
            color: theme.text,
            fontSize: heroTitleSize,
            lineHeight: heroTitleLine,
          },
        ]}>
        Tiny progress.{'\n'}Finally visible.
      </Text>
      <Text style={[styles.heroSub, isMobile && styles.heroSubMobile, { color: theme.textSecondary }]}>
        Start when you're stuck, notice what already counted, and grow a little world from real-life
        wins.
      </Text>
      {isDesktop ? (
        <View style={[styles.ctaGroup, styles.ctaGroupDesktop]}>
          {ctaPrimary}
          {ctaSecondary}
        </View>
      ) : (
        <View style={styles.ctaGroupMobile}>
          {ctaPrimary}
          {ctaSecondary}
        </View>
      )}
      {trustNote}
    </>
  );

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (isDesktop ? 64 : 32),
            paddingHorizontal: isDesktop ? spacing.lg : MOBILE_PAD,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {/* Hero */}
          {isDesktop ? (
            <View style={styles.heroDesktop}>
              <Text style={[styles.eyebrow, styles.eyebrowDesktop, { color: theme.accentSecondary }]}>
                ADHD-friendly self-support
              </Text>
              <View style={styles.heroDesktopRow}>
                <View style={styles.heroDesktopCopy}>{heroCopy}</View>
                <View style={styles.heroDesktopGarden}>
                  <GardenScene height={gardenHeight} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.heroMobile}>
              <Text style={[styles.eyebrow, { color: theme.accentSecondary }]}>
                ADHD-friendly self-support
              </Text>
              {heroCopy}
              <View style={styles.heroMobileGarden}>
                <GardenScene height={gardenHeight} />
              </View>
            </View>
          )}

          {/* Philosophy */}
          <View
            style={[
              styles.philosophy,
              isDesktop ? styles.philosophyDesktop : styles.philosophyMobile,
              {
                marginTop: gap('heroPhilosophy'),
              },
            ]}>
            <View style={isDesktop ? styles.philosophyMarkDesktop : styles.philosophyMarkMobile}>
              <Text
                style={[
                  styles.philosophyMarkLine,
                  isDesktop ? styles.philosophyMarkLineDesktop : styles.philosophyMarkLineMobile,
                  { color: theme.text },
                ]}>
                NOT
              </Text>
              <Text
                style={[
                  styles.philosophyMarkLine,
                  isDesktop ? styles.philosophyMarkLineDesktop : styles.philosophyMarkLineMobile,
                  { color: theme.text },
                ]}>
                NOTHING.
              </Text>
            </View>
            <View style={styles.philosophyCopy}>
              <Text style={[styles.philosophyTitle, { color: theme.text }]}>
                Your brain may say nothing happened.
              </Text>
              <Text style={[styles.philosophyBody, { color: theme.textSecondary }]}>
                <Text style={[styles.philosophyTagline, { color: theme.accentSecondary }]}>
                  The garden keeps the receipts.{' '}
                </Text>
                Every small action leaves a trace — proof that you started, cared, returned, or kept
                going.
              </Text>
            </View>
          </View>

          {/* How it works */}
          <View style={[styles.section, { marginTop: gap('philosophyHow') }]}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>How it works</Text>
            {isMobile ? (
              <View style={[styles.stack, { gap: gridGap }]}>
                {STEPS.map((step, i) => (
                  <StepCard key={step} index={i} label={step} theme={theme} />
                ))}
              </View>
            ) : (
              <BalancedRow gap={gridGap}>
                {STEPS.map((step, i) => (
                  <StepCard key={step} index={i} label={step} theme={theme} />
                ))}
              </BalancedRow>
            )}
          </View>

          {/* Tools preview */}
          <View
            style={[styles.section, { marginTop: gap('howTools') }]}
            onLayout={(e) => {
              toolsSectionY.current = e.nativeEvent.layout.y;
            }}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Tools that meet you where you are
            </Text>
            <View style={[styles.stack, { gap: gridGap }]}>
              {toolRows.map((row, rowIndex) => (
                <BalancedRow key={`tool-row-${rowIndex}`} gap={gridGap}>
                  {row.map((tool) => (
                    <ToolPreviewCard key={tool.title} tool={tool} theme={theme} />
                  ))}
                  {row.length < toolColumns
                    ? Array.from({ length: toolColumns - row.length }).map((_, i) => (
                        <View key={`spacer-${i}`} style={styles.balancedCell} />
                      ))
                    : null}
                </BalancedRow>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { marginTop: gap('toolsFooter') }]}>
            <View style={styles.bottomCtaWrap}>
              <GradientButton label="Show me where to start" onPress={goNext} small />
            </View>
            <View style={styles.disclaimerBlock}>
              <Text style={[styles.disclaimerLine, { color: theme.textMuted }]}>
                This tool is for self-support and reflection,
              </Text>
              <Text style={[styles.disclaimerLine, { color: theme.textMuted }]}>
                not medical advice.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StepBadge({ index, theme }: { index: number; theme: ReturnType<typeof useAppTheme> }) {
  return (
    <View
      style={[
        styles.stepBadge,
        {
          backgroundColor: theme.accentTertiary + '44',
          borderColor: theme.accent + '55',
        },
      ]}>
      <Text style={[styles.stepBadgeText, { color: theme.text }]}>{index + 1}</Text>
    </View>
  );
}

function StepCard({
  index,
  label,
  theme,
}: {
  index: number;
  label: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <GlassCard style={styles.stepCard}>
      <StepBadge index={index} theme={theme} />
      <Text style={[styles.stepText, { color: theme.text }]}>{label}</Text>
    </GlassCard>
  );
}

function ToolPreviewCard({
  tool,
  theme,
}: {
  tool: (typeof LANDING_TOOLS)[number];
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <GlassCard style={styles.toolPreview}>
      <View style={styles.toolHeader}>
        <Text style={[styles.toolTitle, { color: theme.text }]} numberOfLines={2}>
          {tool.title}
        </Text>
        <View style={styles.toolIconSlot}>
          <Text style={styles.toolIcon}>{tool.icon}</Text>
        </View>
      </View>
      <Text style={[styles.toolLine, { color: theme.textSecondary }]} numberOfLines={2}>
        {tool.line}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  page: {
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  balancedRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  balancedCell: {
    flex: 1,
    minWidth: 0,
  },
  stack: {
    width: '100%',
  },

  /* Hero — mobile */
  heroMobile: {
    gap: spacing.md,
  },
  heroMobileGarden: {
    marginTop: spacing.lg,
  },

  /* Hero — desktop */
  heroDesktop: {
    gap: spacing.lg,
    width: '100%',
  },
  heroDesktopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
    width: '100%',
  },
  heroDesktopCopy: {
    flex: 13,
    minWidth: 0,
    gap: spacing.lg,
  },
  heroDesktopGarden: {
    flex: 11,
    minWidth: 0,
    width: '100%',
  },
  eyebrowDesktop: {
    marginBottom: spacing.xs,
  },

  eyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    maxWidth: 520,
  },
  heroSub: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 480,
  },
  heroSubMobile: {
    fontSize: 17,
    lineHeight: 24,
  },

  ctaGroup: {
    gap: spacing.sm,
    alignItems: 'flex-start',
    width: '100%',
  },
  ctaGroupMobile: {
    width: '100%',
    maxWidth: MOBILE_CTA_WIDTH,
    gap: spacing.sm,
  },
  ctaGroupDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    maxWidth: undefined,
  },
  ctaPrimaryMobile: {
    width: '100%',
    gap: spacing.xs,
  },
  ctaPrimaryDesktop: {
    gap: spacing.xs,
  },
  ctaPrimaryWrapMobile: {
    width: '100%',
    maxWidth: MOBILE_CTA_WIDTH,
  },
  ctaPrimaryWrapDesktop: {
    width: 248,
    maxWidth: 255,
  },
  ctaSecondaryWrapMobile: {
    width: '100%',
    maxWidth: MOBILE_CTA_WIDTH,
  },
  ctaSecondaryWrapDesktop: {
    width: 190,
    maxWidth: 205,
    marginTop: 0,
  },
  ctaHelper: {
    ...typography.caption,
    lineHeight: 18,
  },
  ctaHelperMobile: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  trustNote: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    paddingTop: spacing.md,
    maxWidth: 480,
    width: '100%',
    gap: 4,
  },
  trustAccent: {
    position: 'absolute',
    top: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 2,
    borderRadius: 1,
  },
  trustPrimary: {
    ...typography.bodySmall,
    fontWeight: '600',
    lineHeight: 20,
  },
  trustSecondary: {
    ...typography.caption,
    lineHeight: 18,
  },

  philosophy: {
    width: '100%',
  },
  philosophyMobile: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  philosophyDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  philosophyMarkDesktop: {
    width: 200,
    flexShrink: 0,
    gap: 0,
  },
  philosophyMarkMobile: {
    gap: 0,
  },
  philosophyMarkLine: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  philosophyMarkLineDesktop: {
    fontSize: 40,
    lineHeight: 42,
  },
  philosophyMarkLineMobile: {
    fontSize: 32,
    lineHeight: 34,
  },
  philosophyCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  philosophyTitle: {
    ...typography.h3,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontWeight: '600',
    lineHeight: 26,
  },
  philosophyTagline: {
    fontWeight: '700',
  },
  philosophyBody: {
    ...typography.bodySmall,
    lineHeight: 22,
    maxWidth: 560,
  },

  section: {
    width: '100%',
  },
  sectionHeading: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    marginBottom: spacing.md,
  },

  stepCard: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 76,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: {
    ...typography.bodySmall,
    fontWeight: '800',
  },
  stepText: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },

  toolPreview: {
    width: '100%',
    flex: 1,
    minHeight: 102,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 24,
  },
  toolIconSlot: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
    paddingTop: 1,
  },
  toolIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  toolTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
    paddingRight: spacing.xs,
  },
  toolLine: {
    ...typography.caption,
    lineHeight: 18,
  },

  footer: {
    alignItems: 'center',
    width: '100%',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  bottomCtaWrap: {
    width: '100%',
    maxWidth: 260,
  },
  disclaimerBlock: {
    maxWidth: 280,
    alignItems: 'center',
    gap: 2,
  },
  disclaimerLine: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
