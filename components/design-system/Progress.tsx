import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, radii, spacing, typography } from '@/lib/theme';

export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  const theme = useAppTheme();
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      ) : null}
      <View style={[styles.track, { backgroundColor: theme.surfaceBorder }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped * 100}%`,
              backgroundColor: theme.accentSecondary,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function XPBadge({ xp, size = 'md' }: { xp: number; size?: 'sm' | 'md' | 'lg' }) {
  const theme = useAppTheme();
  const isLarge = size === 'lg';
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.mode === 'dark' ? colors.cardDark : colors.warmCream,
          borderColor: theme.accentTertiary,
        },
        size === 'sm' && styles.badgeSm,
        isLarge && styles.badgeLg,
      ]}>
      <Text style={[styles.badgeEmoji, isLarge && { fontSize: 20 }]}>✨</Text>
      <Text style={[styles.badgeText, { color: theme.text }, isLarge && typography.h3]}>
        {xp} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { ...typography.caption },
  track: { height: 10, borderRadius: radii.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.full },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingVertical: 4, paddingHorizontal: 8 },
  badgeLg: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  badgeEmoji: { fontSize: 14 },
  badgeText: { ...typography.bodySmall, fontWeight: '700' },
});
