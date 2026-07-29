import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';

export function OnboardingOptionCard({
  label,
  emoji,
  selected,
  badge,
  onPress,
}: {
  label: string;
  emoji?: string;
  selected?: boolean;
  badge?: 'Main' | 'Also';
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      style={({ pressed }) => [pressed && styles.pressed, styles.fill]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: selected ? theme.accentTertiary + 'CC' : theme.surface,
            borderColor: selected ? theme.accent : theme.surfaceBorder,
          },
        ]}>
        {badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badge === 'Main' ? theme.accent + '33' : theme.accentSecondary + '33',
              },
            ]}>
            <Text
              style={[
                styles.badgeText,
                { color: badge === 'Main' ? theme.accent : theme.accentSecondary },
              ]}>
              {badge}
            </Text>
          </View>
        ) : null}
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={3}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function OnboardingVibeCard({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && styles.pressed, styles.fill]}>
      <View
        style={[
          styles.vibeCard,
          {
            backgroundColor: selected ? theme.accentTertiary + 'CC' : theme.surface,
            borderColor: selected ? theme.accent : theme.surfaceBorder,
            borderWidth: selected ? 2 : 1,
          },
        ]}>
        <Text style={styles.vibeEmoji}>{emoji}</Text>
        <Text style={[styles.vibeLabel, { color: theme.text }]} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    flex: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  card: {
    flex: 1,
    minHeight: 72,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  vibeCard: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 140,
    borderRadius: radii.lg,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  vibeEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  vibeLabel: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
