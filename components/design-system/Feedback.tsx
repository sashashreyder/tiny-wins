import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { GradientButton } from './Buttons';

export function EmptyState({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <GradientButton label={actionLabel} onPress={onAction} small />
      ) : null}
    </View>
  );
}

export function SupportiveMessage({ message }: { message: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.support, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <Text style={styles.supportEmoji}>💜</Text>
      <Text style={[styles.supportText, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emoji: { fontSize: 48 },
  title: { ...typography.h2, textAlign: 'center' },
  message: { ...typography.body, textAlign: 'center', maxWidth: 320 },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  supportEmoji: { fontSize: 20 },
  supportText: { ...typography.body, flex: 1, fontWeight: '500' },
});
