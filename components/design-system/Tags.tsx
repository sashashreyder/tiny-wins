import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';

export function TagPill({
  label,
  selected,
  onPress,
  emoji,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
}) {
  const theme = useAppTheme();
  const content = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: selected ? theme.accentTertiary : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
      ]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text
        style={[
          styles.text,
          { color: selected ? theme.text : theme.textSecondary },
        ]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
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
      style={[
        styles.moodBtn,
        {
          backgroundColor: selected ? theme.accentTertiary : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
      ]}>
      <Text style={styles.moodEmoji}>{emoji}</Text>
      <Text style={[styles.moodLabel, { color: theme.text }]}>{label}</Text>
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
    borderWidth: 1,
  },
  emoji: { fontSize: 14 },
  text: { ...typography.caption, fontWeight: '600' },
  moodBtn: {
    width: '30%',
    minWidth: 96,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { ...typography.caption, textAlign: 'center' },
});
