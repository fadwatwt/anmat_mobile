import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Bell, MessageSquare, Sun, Moon, Globe } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  onMenuPress: () => void;
  title?: string;
};

export function Header({ onMenuPress, title }: Props) {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { locale, setLocale, isRTL } = useLocale();
  const insets = useSafeAreaInsets();

  const toggleLanguage = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.sideSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
          <Menu size={20} color={colors.ink} />
        </TouchableOpacity>
        {title ? (
          <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      <View style={[styles.sideSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={toggleLanguage} style={styles.iconBtn}>
          <Globe size={18} color={colors.textMuted} />
          <Text style={[styles.langText, { color: colors.textMuted }]}>{locale === 'ar' ? 'EN' : 'AR'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
          {isDark ? <Sun size={18} color={colors.textMuted} /> : <Moon size={18} color={colors.textMuted} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={18} color={colors.textMuted} />
          <View style={[styles.badge, { backgroundColor: colors.danger, [isRTL ? 'left' : 'right']: 3 }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MessageSquare size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  avatarText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.bold,
  },
  badge: {
    borderRadius: radii.full,
    height: 7,
    position: 'absolute',
    top: 3,
    width: 7,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    height: 72,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  iconBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    padding: spacing.xs,
  },
  langText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.bold,
  },
  menuBtn: {
    padding: 4,
  },
  sideSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.bold,
  },
});
