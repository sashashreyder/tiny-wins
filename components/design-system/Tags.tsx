import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';

function accentTint(isDark: boolean): string {
  return isDark ? 'rgba(255, 138, 122, 0.18)' : 'rgba(255, 138, 122, 0.14)';
}

export function TagPill({
  label,
  selected,
  onPress,
  emoji,
  accentSelected,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
  /** Coral border + tinted fill instead of pale lavender. */
  accentSelected?: boolean;
}) {
  const theme = useAppTheme();
  const useAccent = Boolean(accentSelected);
  const selectedBg = useAccent
    ? accentTint(theme.mode === 'dark')
    : theme.accentTertiary;
  const selectedText = useAccent ? theme.text : theme.selectedForeground;
  const content = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: selected ? selectedBg : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
      ]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text
        style={[
          styles.text,
          { color: selected ? selectedText : theme.textSecondary, fontWeight: selected ? '700' : '600' },
        ]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: Boolean(selected) }}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function MoodButton({
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
      accessibilityState={{ selected: Boolean(selected) }}
      style={[
        styles.moodBtn,
        {
          backgroundColor: selected ? accentTint(theme.mode === 'dark') : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
      ]}>
      {selected ? (
        <Text style={[styles.moodCheck, { color: theme.accent }]}>✓</Text>
      ) : null}
      <Text style={styles.moodEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.moodLabel,
          { color: theme.text, fontWeight: selected ? '700' : '500' },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 14 },
  text: { ...typography.caption, fontWeight: '600' },
  moodBtn: {
    flexGrow: 1,
    flexBasis: 96,
    minWidth: 96,
    alignItems: 'center',
    padding: spacing.sm,
    paddingTop: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    position: 'relative',
  },
  moodCheck: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { ...typography.caption, textAlign: 'center' },
});
