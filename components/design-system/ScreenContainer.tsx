import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing } from '@/lib/theme';

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  gradient?: boolean;
}

export function ScreenContainer({
  children,
  style,
  padded = true,
  gradient = true,
}: ScreenContainerProps) {
  const theme = useAppTheme();

  const content = (
    <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
  );

  if (!gradient) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {content}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd, theme.background]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
});

export function Divider() {
  const theme = useAppTheme();
  return <View style={{ height: 1, backgroundColor: theme.surfaceBorder, marginVertical: spacing.md }} />;
}

export { colors, spacing };
