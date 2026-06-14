import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
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
    startResponseListener((response) => {
      // Navigate based on notification data if needed
      const data = response.notification.request.content.data;
      // Future: navigate to specific screen using data.screen, data.id, etc.
    });

    // Handle cold-start notification (app opened by tapping a notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        // Future: navigate to specific screen
      }
    });

    return cleanupListeners;
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
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
