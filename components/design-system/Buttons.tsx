import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  small?: boolean;
  accessibilityLabel?: string;
}

export function GradientButton({
  label,
  onPress,
  variant = 'primary',
  style,
  small,
  accessibilityLabel,
}: GradientButtonProps) {
  const theme = useAppTheme();

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        {...(accessibilityLabel
          ? { accessibilityRole: 'button' as const, accessibilityLabel }
          : null)}
        style={({ pressed }) => [
          styles.ghost,
          { borderColor: theme.surfaceBorder },
          small && styles.small,
          pressed && styles.pressed,
          style,
        ]}>
        <Text style={[styles.ghostText, { color: theme.text }, small && styles.smallText]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  }

  const gradientColors: [string, string] =
    variant === 'primary'
      ? [colors.softCoral, '#FF9E8F']
      : [colors.aqua, colors.periwinkle];

  return (
    <Pressable
      onPress={onPress}
      {...(accessibilityLabel
        ? { accessibilityRole: 'button' as const, accessibilityLabel }
        : null)}
      style={({ pressed }) => [
        { minHeight: small ? 40 : 52, justifyContent: 'center' },
        pressed && styles.pressed,
        style,
      ]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, small && styles.small, styles.buttonFill]}>
        <Text style={[styles.text, small && styles.smallText]} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export function IconButton({
  emoji,
  onPress,
  label,
}: {
  emoji: string;
  onPress: () => void;
  label?: string;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
        pressed && styles.pressed,
      ]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {label ? (
        <Text style={[styles.iconLabel, { color: theme.textSecondary }]} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonFill: {
    width: '100%',
    flex: 1,
  },
  small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 40 },
  text: { ...typography.body, color: colors.inkViolet, fontWeight: '700' },
  smallText: { fontSize: 14 },
  ghost: {
    borderRadius: radii.full,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  ghostText: { ...typography.body, fontWeight: '600' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  iconBtn: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 72,
    flex: 1,
  },
  emoji: { fontSize: 24, marginBottom: 4 },
  iconLabel: { ...typography.caption, textAlign: 'center' },
});
