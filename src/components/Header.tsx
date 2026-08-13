import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, MessageSquare, Sun, Moon, Globe, ChevronDown, User, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { fetchNotifications, isUnread } from '../services/notifications';
import { font, radii, spacing } from '../theme';

type Props = {
  onMenuPress: () => void;
  title?: string;
};

export function Header({ onMenuPress, title }: Props) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { locale, setLocale, isRTL } = useLocale();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (user?._id && user?.type) {
      fetchNotifications(user._id, user.type)
        .then((list) => { if (active) setUnreadCount(list.filter(isUnread).length); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user?._id, user?.type]);

  const toggleLanguage = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    navigation.navigate('Profile');
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
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
          <Bell size={18} color={colors.textMuted} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger, [isRTL ? 'left' : 'right']: 3 }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Conversations')}>
          <MessageSquare size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.userChip, { backgroundColor: colors.primaryLight, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => setUserMenuOpen(true)}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textMuted }]} numberOfLines={1}>
            {user?.name || 'N/A'}
          </Text>
          <ChevronDown size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={userMenuOpen} transparent animationType="fade" onRequestClose={() => setUserMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setUserMenuOpen(false)}>
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.surface, borderColor: colors.border, top: insets.top + 68 },
              isRTL ? { left: spacing.md } : { right: spacing.md },
            ]}
          >
            <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownName, { color: colors.ink }]} numberOfLines={1}>
                {user?.name || t('N/A')}
              </Text>
              {user?.email ? (
                <Text style={[styles.dropdownEmail, { color: colors.textMuted }]} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.dropdownItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleProfile}
            >
              <User size={18} color={colors.textMuted} />
              <Text style={[styles.dropdownItemText, { color: colors.ink }]}>{t('Profile')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleLogout}
            >
              <LogOut size={18} color={colors.danger} />
              <Text style={[styles.dropdownItemText, { color: colors.danger }]}>{t('Logout')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    alignItems: 'center',
    borderRadius: radii.full,
    height: 15,
    justifyContent: 'center',
    minWidth: 15,
    paddingHorizontal: 3,
    position: 'absolute',
    top: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: font.weights.bold,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'absolute',
    width: 220,
  },
  dropdownEmail: {
    fontSize: font.sizes.xs,
  },
  dropdownHeader: {
    borderBottomWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownItem: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dropdownItemText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
  dropdownName: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
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
  menuOverlay: {
    flex: 1,
  },
  sideSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.bold,
  },
  userChip: {
    alignItems: 'center',
    borderRadius: radii.lg,
    gap: spacing.xs,
    maxWidth: 150,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  userName: {
    fontSize: font.sizes.xs,
    flexShrink: 1,
    fontWeight: font.weights.medium,
  },
});
