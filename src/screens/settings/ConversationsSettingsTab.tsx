import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react-native';
import { SelectDropdown } from '../../components/SelectDropdown';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchChatSettings,
  updateChatSettings,
} from '../../services/settings';

const RETENTION_OPTIONS = [
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
  { label: '1 Year', value: '365' },
];

const FILE_SIZE_OPTIONS = [
  { label: '5 MB', value: '5242880' },
  { label: '10 MB', value: '10485760' },
  { label: '25 MB', value: '26214400' },
  { label: '50 MB', value: '52428800' },
  { label: '100 MB', value: '104857600' },
];

export default function ConversationsSettingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [retentionDays, setRetentionDays] = useState('90');
  const [maxFileSize, setMaxFileSize] = useState('10485760');
  const [autoCreateChat, setAutoCreateChat] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchChatSettings();
          setRetentionDays(String(data.retention_days ?? 90));
          setMaxFileSize(String(data.max_file_size_bytes ?? 10485760));
          setAutoCreateChat(data.auto_create_project_chat ?? true);
        } catch {
          // use defaults
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateChatSettings({
        retention_days: parseInt(retentionDays, 10),
        max_file_size_bytes: parseInt(maxFileSize, 10),
        auto_create_project_chat: autoCreateChat,
      });
      Alert.alert(t('Success'), t('Chat settings updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update chat settings'));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MessageSquare size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Conversations/Chat')}</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Manage chat and file sharing settings.')}</Text>

        <View style={styles.fieldGroup}>
          <SelectDropdown
            label={t('Message Retention Period')}
            options={RETENTION_OPTIONS}
            value={retentionDays}
            onChange={setRetentionDays}
          />
          <SelectDropdown
            label={t('Maximum File Upload Size')}
            options={FILE_SIZE_OPTIONS}
            value={maxFileSize}
            onChange={setMaxFileSize}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.toggleTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.toggleLabel, { color: colors.ink, textAlign: align }]}>{t('Auto-create Project Chat')}</Text>
            <Text style={[styles.toggleDesc, { color: colors.textMuted, textAlign: align }]}>
              {t('Automatically create a group chat when a new project is created.')}
            </Text>
          </View>
          <Switch
            value={autoCreateChat}
            onValueChange={setAutoCreateChat}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={autoCreateChat ? colors.primary : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? t('Saving...') : t('Apply Changes')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 60 },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: { alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, flex: 1 },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  fieldGroup: { gap: spacing.md },
  divider: { height: 1, marginVertical: spacing.xs },
  toggleRow: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  toggleTextWrap: { flex: 1, gap: 2, marginEnd: spacing.sm },
  toggleLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  toggleDesc: { fontSize: font.sizes.xs },
  saveBtn: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});
