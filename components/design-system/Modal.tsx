import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing, typography } from '@/lib/theme';
import { GradientButton } from './Buttons';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
  children?: React.ReactNode;
}

export function AppModal({
  visible,
  onClose,
  title,
  message,
  primaryAction,
  secondaryAction,
  children,
}: AppModalProps) {
  const theme = useAppTheme();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
          ) : null}
          {children}
          <View style={styles.actions}>
            {secondaryAction ? (
              <GradientButton
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                variant="ghost"
                small
                style={{ flex: 1 }}
              />
            ) : null}
            {primaryAction ? (
              <GradientButton
                label={primaryAction.label}
                onPress={primaryAction.onPress}
                small
                style={{ flex: 1 }}
              />
            ) : (
              <GradientButton label="Got it" onPress={onClose} small style={{ flex: 1 }} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 34, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.h2 },
  message: { ...typography.body },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
