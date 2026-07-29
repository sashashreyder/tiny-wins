import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootNavigator />;
}

function RootNavigator() {
  const theme = useAppTheme();

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="cant-start" />
        <Stack.Screen name="tiny-wins" />
        <Stack.Screen name="focus" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="sleep" />
        <Stack.Screen name="water" />
        <Stack.Screen name="self-care" />
        <Stack.Screen name="home-care" />
        <Stack.Screen name="rewards" />
        <Stack.Screen name="garden" />
        <Stack.Screen name="printables" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="tools" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="about" />
      </Stack>
    </>
  );
}
