import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';

type Props = {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
};

export function DashboardLayout({ currentRoute, onNavigate, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.main, { backgroundColor: colors.background }]}>
        <Header
          onMenuPress={() => setDrawerOpen(true)}
          title={currentRoute === 'Dashboard' ? undefined : currentRoute.replace(/_/g, ' ')}
        />
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {children}
        </View>
      </View>

      {drawerOpen ? (
        <Pressable style={styles.overlay} onPress={() => setDrawerOpen(false)} />
      ) : null}

      <View
        style={[
          styles.sidebar,
          { backgroundColor: colors.surface, top: insets.top, bottom: insets.bottom },
          drawerOpen ? styles.sidebarOpen : styles.sidebarClosed,
        ]}
      >
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          onClose={() => setDrawerOpen(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  main: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 55,
  },
  root: {
    flex: 1,
  },
  sidebar: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 280,
    zIndex: 60,
  },
  sidebarClosed: {
    transform: [{ translateX: 300 }],
  },
  sidebarOpen: {
    transform: [{ translateX: 0 }],
  },
});
