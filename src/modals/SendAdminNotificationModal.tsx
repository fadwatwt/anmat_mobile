import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchSystemAdmins, sendAdminNotification, SystemAdmin } from '../services/systemAdmins';
import { fetchSubscribers, Subscriber } from '../services/subscribers';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  preSelectedUser?: { _id: string; name?: string; email?: string } | null;
  sourceType?: 'admin' | 'subscriber';
  onClose: () => void;
  onSent: () => void;
};

const TARGET_OPTIONS = [
  { label: 'Specific Users', value: 'specific_users' },
  { label: 'All Subscribers', value: 'all_subscribers' },
  { label: 'All Admins', value: 'all_admins' },
];

const PRIORITY_OPTIONS = [
  { label: 'Normal (default)', value: '' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Low', value: 'low' },
];

export function SendAdminNotificationModal({ visible, preSelectedUser, sourceType = 'admin', onClose, onSent }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [target, setTarget] = useState('specific_users');
  const [priority, setPriority] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [userIds, setUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<(SystemAdmin | Subscriber)[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTarget('specific_users');
      setPriority('');
      setTitle('');
      setMessage('');
      setActionUrl('');
      setUserIds(preSelectedUser?._id ? [preSelectedUser._id] : []);
      setSearch('');
      if (sourceType === 'subscriber') {
        fetchSubscribers().then(setUsers).catch(() => setUsers([]));
      } else {
        fetchSystemAdmins().then(setUsers).catch(() => setUsers([]));
      }
    }
  }, [visible, preSelectedUser, sourceType]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, search]);

  const toggleUser = (id: string) =>
    setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleTargetChange = (value: string) => {
    setTarget(value);
    if (value === 'specific_users' && preSelectedUser?._id) setUserIds([preSelectedUser._id]);
    else setUserIds([]);
  };

  const isValid = title.trim().length > 0 && message.trim().length > 0 && (target !== 'specific_users' || userIds.length > 0);

  const handleSend = async () => {
    if (!isValid) return;
    const confirmMsg =
      target === 'specific_users'
        ? `${t('Send this notification to')} ${userIds.length} ${t('selected user(s)')}?`
        : target === 'all_admins'
          ? t('Send this notification to all admins?')
          : t('Send this notification to all subscribers?');
    Alert.alert(t('Send Notification'), confirmMsg, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Send'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const body: Parameters<typeof sendAdminNotification>[0] = {
              target: target as 'specific_users' | 'all_subscribers' | 'all_admins',
              title: title.trim(),
              message: message.trim(),
            };
            if (priority) body.priority = priority as 'high' | 'normal' | 'low';
            if (actionUrl.trim()) body.action_url = actionUrl.trim();
            if (target === 'specific_users') body.user_ids = userIds;
            const result = await sendAdminNotification(body);
            onSent();
            onClose();
            Alert.alert(t('Success'), `${t('Notification sent successfully to')} ${result.sent} ${t('user(s).')}`);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Send Notification')} size="md">
      <View style={styles.form}>
        <SelectDropdown
          label={t('Send To')}
          options={TARGET_OPTIONS}
          value={target}
          onChange={handleTargetChange}
          translateLabels
          required
        />
        <SelectDropdown
          label={t('Priority')}
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
          translateLabels
        />

        <View>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Title')} *</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor={colors.textMuted}
            placeholder={t('Notification title')}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Message')} *</Text>
          <TextInput
            style={[inputStyle, styles.textarea]}
            placeholderTextColor={colors.textMuted}
            placeholder={t('Notification message body')}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>
        <View>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>
            {t('Action URL')} <Text style={{ fontSize: font.sizes.xs }}>({t('optional')})</Text>
          </Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor={colors.textMuted}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            value={actionUrl}
            onChangeText={setActionUrl}
          />
        </View>

        {target === 'specific_users' && (
          <View>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>
              {t('Select Recipients')} * ({userIds.length} {t('selected')})
            </Text>
            <View style={[styles.searchBox, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
              <Search size={14} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.ink, textAlign: align }]}
                placeholderTextColor={colors.textMuted}
                placeholder={t('Search by name or email...')}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <ScrollView style={[styles.usersBox, { borderColor: colors.border }]} nestedScrollEnabled>
              {filteredUsers.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No users found')}</Text>
              ) : (
                filteredUsers.map((user) => {
                  const selected = userIds.includes(user._id);
                  return (
                    <TouchableOpacity
                      key={user._id}
                      style={[
                        styles.userRow,
                        { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                        selected && { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => toggleUser(user._id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary : 'transparent',
                          },
                        ]}
                      >
                        {selected && <Check size={12} color="#FFF" />}
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                          {user.name || '--'}
                        </Text>
                        <Text style={[styles.userEmail, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                          {user.email}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        <Button label={t('Send')} onPress={handleSend} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  emptyText: { fontSize: font.sizes.sm, padding: spacing.md, textAlign: 'center' },
  form: { gap: spacing.md },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: spacing.xs },
  searchBox: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.sizes.sm, paddingVertical: spacing.sm },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  userEmail: { fontSize: font.sizes.xs },
  userInfo: { flex: 1, gap: 1 },
  userName: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  userRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  usersBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    maxHeight: 200,
    paddingHorizontal: spacing.sm,
  },
});
