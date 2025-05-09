import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../contexts/AuthContext';
import * as AuthModule from '../contexts/AuthContext';
console.log("👀 AuthModule:", AuthModule);
import { useColorScheme } from '@/components/useColorScheme';
import { ThemeProvider as NavThemeProvider, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { ThemeProvider as AppThemeProvider } from '../contexts/ThemeContext';
import { darkTheme } from '../lib/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <NavThemeProvider value={NavDarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </NavThemeProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
