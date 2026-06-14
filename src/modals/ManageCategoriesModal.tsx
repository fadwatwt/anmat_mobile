import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Trash2, Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  fetchAccountCategories,
  createAccountCategory,
  updateAccountCategory,
  deleteAccountCategory,
  AccountCategory,
} from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function ManageCategoriesModal({ visible, onClose, onChanged }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await fetchAccountCategories());
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) { setNewName(''); setEditingId(null); load(); }
  }, [visible, load]);

  const refreshAll = () => { load(); onChanged(); };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createAccountCategory(newName.trim());
      setNewName('');
      refreshAll();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async (cat: AccountCategory) => {
    if (!editName.trim()) return;
    try {
      await updateAccountCategory(cat._id, editName.trim());
      setEditingId(null);
      refreshAll();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    }
  };

  const handleDelete = (cat: AccountCategory) => {
    Alert.alert(
      t('Delete Category'),
      t('Deleting a category also removes its sub-categories and accounts. Continue?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'), style: 'destructive',
          onPress: async () => {
            try { await deleteAccountCategory(cat._id); refreshAll(); }
            catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
          },
        },
      ],
    );
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Manage Categories')} size="lg">
      <View style={styles.form}>
          {/* Add new */}
          <View style={[styles.addRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              placeholder={t('New category name')}
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary, opacity: adding ? 0.6 : 1 }]}
              onPress={handleAdd}
              disabled={adding}
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : (
            <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {categories.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, padding: spacing.sm }}>
                  {t('No categories')}
                </Text>
              ) : (
                categories.map((cat) => {
                  const editing = editingId === cat._id;
                  return (
                    <View
                      key={cat._id}
                      style={[styles.catRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    >
                      {editing ? (
                        <>
                          <TextInput
                            style={[inputStyle, { flex: 1 }]}
                            value={editName}
                            onChangeText={setEditName}
                            autoFocus
                          />
                          <TouchableOpacity onPress={() => handleSaveEdit(cat)} style={styles.iconBtn}>
                            <Check size={18} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingId(null)} style={styles.iconBtn}>
                            <X size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => { setEditingId(cat._id); setEditName(cat.name); }}
                          >
                            <Text style={[styles.catName, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                              {cat.name}
                            </Text>
                            {cat.accountCount != null && (
                              <Text style={[styles.catCount, { color: colors.textMuted, textAlign: align }]}>
                                {cat.accountCount} {t('accounts')}
                              </Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.iconBtn}>
                            <Trash2 size={16} color={colors.danger ?? '#EF4444'} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addBtn: { alignItems: 'center', borderRadius: radii.lg, height: 40, justifyContent: 'center', width: 40 },
  addRow: { alignItems: 'center', gap: spacing.sm },
  catCount: { fontSize: font.sizes.xs },
  catName: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  catRow: { alignItems: 'center', borderBottomWidth: 1, gap: spacing.xs, paddingVertical: spacing.sm },
  form: { flex: 1, gap: spacing.md },
  iconBtn: { padding: spacing.xs },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  list: { maxHeight: 360 },
});
