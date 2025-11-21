import { Stack } from 'expo-router';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      if (!fontsLoaded) return;

      try {
        await Asset.fromModule(require('../assets/background.png')).downloadAsync();
      } catch (e) {
        // If preloading fails, continue anyway.
      } finally {
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="tabs" />
      <Stack.Screen name="host" />
      <Stack.Screen name="session" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="blocked-apps" />
    </Stack>
  );
}
