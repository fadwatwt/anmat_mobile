import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createRole, syncRolePermissions, AppRole } from '../services/roles';
import { fetchPermissions, permissionLabel, Permission } from '../services/permissions';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  isAdmin: boolean;
  /** When provided, modal runs in "sync permissions" mode for that existing role. */
  role?: AppRole | null;
};

export function RoleModal({ visible, onClose, onSaved, isAdmin, role }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const isSync = !!role;
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(role?.name || '');
    setQuery('');
    // Pre-select the role's current permission IDs when syncing.
    setSelected(role ? role.permissions.map((p) => p._id).filter(Boolean) as string[] : []);
    setLoadingPerms(true);
    fetchPermissions(isAdmin)
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoadingPerms(false));
  }, [visible, role, isAdmin]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((p) => permissionLabel(p).toLowerCase().includes(q));
  }, [permissions, query]);

  const handleSave = async () => {
    if (!isSync && !name.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    if (selected.length === 0) {
      Alert.alert(t('Required'), t('Select at least one permission'));
      return;
    }
    setSaving(true);
    try {
      if (isSync && role) await syncRolePermissions(isAdmin, role._id, selected);
      else await createRole(isAdmin, name.trim(), selected);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  const title = isSync ? `${t('Sync Permissions')} — ${role?.name}` : t('Add Role');

  return (
    <Modal visible={visible} onClose={onClose} title={title} size="full">
      <View style={styles.form}>
          {!isSync && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Role Name')}</Text>
              <TextInput
                style={inputStyle}
                placeholder={t('Enter name')}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.field}>
            <View style={[styles.permHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Permissions')}</Text>
              <Text style={[styles.count, { color: colors.primary }]}>
                {selected.length}/{permissions.length}
              </Text>
            </View>

            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Search size={15} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.ink, textAlign: align }]}
                placeholder={t('Search permissions...')}
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
              />
            </View>

            {/* Permission list */}
            {loadingPerms ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : (
              <ScrollView style={[styles.permsBox, { borderColor: colors.border }]} nestedScrollEnabled>
                {filtered.length === 0 ? (
                  <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, padding: spacing.sm }}>
                    {t('No permissions found')}
                  </Text>
                ) : (
                  filtered.map((p) => {
                    const checked = selected.includes(p._id);
                    return (
                      <TouchableOpacity
                        key={p._id}
                        style={[styles.permRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        onPress={() => toggle(p._id)}
                      >
                        <View style={[styles.checkbox, { borderColor: checked ? colors.primary : colors.border, backgroundColor: checked ? colors.primary : 'transparent' }]}>
                          {checked && <Check size={12} color="#FFF" />}
                        </View>
                        <Text style={[styles.permText, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                          {permissionLabel(p)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>

          <Button label={t('Save')} onPress={handleSave} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  checkbox: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
  count: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  field: { gap: spacing.xs },
  form: { flex: 1, gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  permHeader: { alignItems: 'center', justifyContent: 'space-between' },
  permRow: { alignItems: 'center', borderBottomWidth: 1, gap: spacing.sm, paddingVertical: spacing.sm },
  permText: { flex: 1, fontSize: font.sizes.sm },
  permsBox: { borderRadius: radii.lg, borderWidth: 1, flex: 1, minHeight: 200, paddingHorizontal: spacing.sm },
  searchBox: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.xs, paddingHorizontal: spacing.sm },
  searchInput: { flex: 1, fontSize: font.sizes.sm, paddingVertical: spacing.sm },
});
