import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { radii, spacing } from '@/lib/theme';

export type OverlayAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function FloatingPanel({
  visible,
  onClose,
  children,
  anchor,
  panelWidth,
  isWide,
  align = 'left',
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  anchor?: OverlayAnchor;
  panelWidth: number;
  isWide: boolean;
  align?: 'left' | 'right';
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const anchored = isWide && Boolean(anchor);
  const maxPanelWidth = Math.min(panelWidth, windowWidth - spacing.lg * 2);

  let top = spacing.md;
  let left = spacing.md;
  if (anchored && anchor) {
    top = anchor.y + anchor.height + 8;
    left = align === 'right' ? anchor.x + anchor.width - maxPanelWidth : anchor.x;
    left = Math.max(spacing.md, Math.min(left, windowWidth - maxPanelWidth - spacing.md));
    if (top > windowHeight - 240) {
      top = Math.max(spacing.md, anchor.y - 220);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[
            styles.backdrop,
            { backgroundColor: isWide ? 'transparent' : 'rgba(20, 18, 34, 0.45)' },
          ]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        {anchored ? (
          <View style={[styles.panel, { position: 'absolute', top, left, width: maxPanelWidth }]}>
            {children}
          </View>
        ) : (
          <View style={styles.centerWrap} pointerEvents="box-none">
            <View style={[styles.panel, { width: maxPanelWidth }]}>{children}</View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  centerWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  panel: {
    borderRadius: radii.lg,
    elevation: 16,
    zIndex: 40,
  },
});
