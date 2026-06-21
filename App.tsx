import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ProcessingProvider } from './src/context/ProcessingContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import {
  cleanupListeners,
  startForegroundListener,
  startResponseListener,
} from './src/services/pushNotifications';
import './src/i18n';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    startForegroundListener();
    startResponseListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
    });

    return cleanupListeners;
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ProcessingProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ProcessingProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
