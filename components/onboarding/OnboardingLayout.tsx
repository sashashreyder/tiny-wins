import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';

const CONTENT_MAX_WIDTH = 980;
const COMPLETION_MAX_WIDTH = 680;
const MOBILE_PAD = 20;
const BTN_WIDTH_DESKTOP = 168;
const BTN_WIDTH_MOBILE = 148;

interface OnboardingLayoutProps {
  stepIndex: number;
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  hint?: string;
  secondaryHint?: string;
  textAction?: { label: string; onPress: () => void };
  compactFooter?: boolean;
  children?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  canContinue?: boolean;
  completion?: boolean;
  completionBody?: string;
}

export function OnboardingLayout({
  stepIndex,
  totalSteps = 5,
  title,
  subtitle,
  hint,
  secondaryHint,
  textAction,
  compactFooter,
  children,
  showBack,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  canContinue = true,
  completion = false,
  completionBody,
}: OnboardingLayoutProps) {
  const theme = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const isWide = viewportWidth >= 768;
  const progress = (stepIndex + 1) / totalSteps;

  const handleContinue = () => {
    if (canContinue) onContinue();
  };

  const nav = (
    <View
      style={[
        styles.nav,
        isWide ? styles.navDesktop : styles.navMobile,
        !showBack && styles.navSingle,
      ]}>
      {showBack && onBack ? (
        <View style={[styles.btnWrap, isWide ? styles.btnDesktop : styles.btnMobile]}>
          <GradientButton label="Back" onPress={onBack} variant="ghost" small />
        </View>
      ) : null}
      <View
        style={[
          styles.btnWrap,
          isWide ? styles.btnDesktop : styles.btnMobile,
          !showBack && styles.btnSingle,
          !canContinue && styles.btnDisabled,
        ]}>
        <GradientButton label={continueLabel} onPress={handleContinue} small />
      </View>
    </View>
  );

  if (completion) {
    return (
      <ScrollView
        contentContainerStyle={[styles.scroll, styles.completionScroll]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.completionWrap}>
          <GlassCard glow style={styles.completionCard}>
            <Text style={styles.completionEmoji}>🌱</Text>
            <Text style={[styles.completionTitle, { color: theme.text }]}>{title}</Text>
            {completionBody ? (
              <Text style={[styles.completionBody, { color: theme.textSecondary }]}>
                {completionBody}
              </Text>
            ) : null}
          </GlassCard>
          {nav}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.container,
          { paddingHorizontal: isWide ? spacing.lg : MOBILE_PAD },
        ]}>
        <Text style={[styles.stepLabel, { color: theme.textMuted }]}>
          Step {stepIndex + 1} of {totalSteps}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceBorder }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: theme.accentSecondary },
            ]}
          />
        </View>

        {title ? (
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        ) : null}
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
        {hint ? (
          <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text>
        ) : null}
        {secondaryHint ? (
          <Text style={[styles.secondaryHint, { color: theme.textMuted }]}>{secondaryHint}</Text>
        ) : null}
        {textAction ? (
          <Pressable
            onPress={textAction.onPress}
            accessibilityRole="button"
            accessibilityLabel={textAction.label}
            style={({ pressed }) => [styles.textActionBtn, pressed && styles.textActionPressed]}>
            <Text style={[styles.textActionLabel, { color: theme.accentSecondary }]}>
              {textAction.label}
            </Text>
          </Pressable>
        ) : null}

        <View style={[styles.optionsArea, compactFooter && styles.optionsAreaCompact]}>{children}</View>
        <View style={[styles.nav, compactFooter && styles.navCompact, isWide ? styles.navDesktop : styles.navMobile, !showBack && styles.navSingle]}>
          {showBack && onBack ? (
            <View style={[styles.btnWrap, isWide ? styles.btnDesktop : styles.btnMobile]}>
              <GradientButton label="Back" onPress={onBack} variant="ghost" small />
            </View>
          ) : null}
          <View
            style={[
              styles.btnWrap,
              isWide ? styles.btnDesktop : styles.btnMobile,
              !showBack && styles.btnSingle,
              !canContinue && styles.btnDisabled,
            ]}>
            <GradientButton label={continueLabel} onPress={handleContinue} small />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: spacing.md,
  },
  stepLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  title: {
    ...typography.h1,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.bodySmall,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  secondaryHint: {
    ...typography.caption,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  textActionBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: 2,
  },
  textActionPressed: {
    opacity: 0.7,
  },
  textActionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  optionsArea: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionsAreaCompact: {
    marginBottom: spacing.md,
  },
  nav: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  navCompact: {
    marginTop: spacing.sm,
  },
  navDesktop: {
    justifyContent: 'flex-start',
  },
  navMobile: {
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: BTN_WIDTH_MOBILE * 2 + spacing.sm,
  },
  navSingle: {
    maxWidth: BTN_WIDTH_MOBILE,
  },
  btnWrap: {
    overflow: 'hidden',
  },
  btnDesktop: {
    width: BTN_WIDTH_DESKTOP,
    maxWidth: BTN_WIDTH_DESKTOP,
  },
  btnMobile: {
    flex: 1,
    minWidth: BTN_WIDTH_MOBILE,
    maxWidth: BTN_WIDTH_MOBILE,
  },
  btnSingle: {
    flex: 0,
    width: BTN_WIDTH_MOBILE,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  completionScroll: {
    justifyContent: 'center',
    minHeight: '100%',
    paddingHorizontal: MOBILE_PAD,
  },
  completionWrap: {
    width: '100%',
    maxWidth: COMPLETION_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  completionCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderRadius: radii.lg,
  },
  completionEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  completionTitle: {
    ...typography.h2,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
    lineHeight: 30,
  },
  completionBody: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 420,
  },
});
