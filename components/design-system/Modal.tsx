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
  wide?: boolean;
  placement?: 'center' | 'bottom';
}

export function AppModal({
  visible,
  onClose,
  title,
  message,
  primaryAction,
  secondaryAction,
  children,
  wide,
  placement = 'center',
}: AppModalProps) {
  const theme = useAppTheme();
  const bottom = placement === 'bottom';

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, bottom && styles.overlayBottom]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.content,
            wide && styles.contentWide,
            bottom && styles.contentBottom,
            { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder },
          ]}>
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
        </View>
      </View>
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
  overlayBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    zIndex: 1,
  },
  contentWide: {
    maxWidth: 560,
  },
  contentBottom: {
    maxWidth: 720,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: { ...typography.h2 },
  message: { ...typography.body },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
