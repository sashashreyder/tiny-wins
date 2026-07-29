import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { AppTheme, resolveTheme } from '@/lib/theme';

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const themeMode = useAppStore((s) => s.userProfile?.theme ?? 'system');
  return resolveTheme(themeMode, systemScheme === 'dark');
}

export function useReducedMotion(): boolean {
  return useAppStore((s) => s.userProfile?.reducedMotion ?? false);
}
