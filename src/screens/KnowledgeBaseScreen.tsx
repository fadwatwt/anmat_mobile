import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Edit3, FileUp, Trash2, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import {
  KbEntry,
  createKbEntry,
  deleteKbEntry,
  fetchKbEntries,
  updateKbEntry,
  uploadKbFile,
} from '../services/knowledgeBase';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const CATEGORIES = ['general', 'policy', 'procedure', 'faq', 'document'];
const PAGE_SIZE = 20;

export default function KnowledgeBaseScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [reloadKey, setReloadKey] = useState(0);
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KbEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => setReloadKey((k) => k + 1);

  const fetchData = useCallback(
    async (params: { page: number; limit: number; search?: string }) => {
      const res = await fetchKbEntries({
        page: params.page,
        limit: params.limit || PAGE_SIZE,
        search: params.search,
        category: category || undefined,
      });
      return { data: res.data, total: res.total };
    },
    [reloadKey, category],
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setTags('');
    setFormCategory('general');
    setPickedFile(null);
    setModalOpen(true);
  };

  const openEdit = (entry: KbEntry) => {
    setEditing(entry);
    setTitle(entry.title || '');
    setContent(entry.content || '');
    setTags((entry.tags || []).join(', '));
    setFormCategory(entry.category || 'general');
    setPickedFile(null);
    setModalOpen(true);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (asset) setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tagList = tags ? tags.split(',').map((x) => x.trim()).filter(Boolean) : [];
      if (pickedFile && !editing) {
        await uploadKbFile({
          title: title.trim(),
          category: formCategory,
          fileUri: pickedFile.uri,
          fileName: pickedFile.name,
          mimeType: pickedFile.mimeType,
        });
      } else if (editing) {
        await updateKbEntry(editing._id, {
          title: title.trim(),
          content,
          tags: tagList,
          category: formCategory,
        });
      } else {
        await createKbEntry({ title: title.trim(), content, tags: tagList, category: formCategory });
      }
      setModalOpen(false);
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: KbEntry) => {
    Alert.alert(t('Delete this entry?'), t('This action cannot be undone'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKbEntry(entry._id);
            reload();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const columns = [
    {
      key: 'title',
      titleKey: 'Title',
      width: 200,
      render: (item: KbEntry) => (
        <View>
          <Text
            style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!!item.content && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.content.slice(0, 80)}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'category',
      titleKey: 'Category',
      width: 110,
      render: (item: KbEntry) => (
        <View style={[s.badge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[s.badgeText, { color: colors.primary }]} numberOfLines={1}>
            {item.category || 'general'}
          </Text>
        </View>
      ),
    },
    {
      key: 'tags',
      titleKey: 'Tags',
      width: 140,
      render: (item: KbEntry) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs }} numberOfLines={1}>
          {(item.tags || []).slice(0, 3).join(', ') || '--'}
        </Text>
      ),
    },
    {
      key: 'added',
      titleKey: 'Added',
      width: 100,
      render: (item: KbEntry) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '--'}
        </Text>
      ),
    },
  ];

  const rowActions = (item: KbEntry) => [
    { label: t('Edit'), icon: <Edit3 size={16} color="#375DFB" />, onPress: () => openEdit(item) },
    { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true },
  ];

  const inputStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.ink,
  };

  return (
    <>
      <ListScreen
        key={`${reloadKey}-${category}`}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: KbEntry) => item._id}
        searchable
        searchPlaceholderKey="Search knowledge base..."
        onCreate={openCreate}
        rowActions={rowActions}
        emptyTitleKey="No entries found"
        emptyMessageKey="Manage company documentation, policies, and FAQs"
        pageSize={PAGE_SIZE}
        filters={[
          {
            key: 'category',
            labelKey: 'Category',
            value: category,
            options: [{ label: 'All', value: '' }, ...CATEGORIES.map((c) => ({ label: c, value: c }))],
            onChange: (v: string) => setCategory(v),
          },
        ]}
      />
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={s.overlay}>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[s.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[s.cardTitle, { color: colors.ink }]}>{editing ? t('Edit Entry') : t('Add Entry')}</Text>
              <Pressable onPress={() => setModalOpen(false)} style={s.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={s.form}>
              <Text style={[s.label, { color: colors.textMuted }]}>{t('Title')} *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={[s.input, inputStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[s.label, { color: colors.textMuted }]}>{t('Content')}</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={[s.input, s.textarea, inputStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholderTextColor={colors.textMuted}
              />
              <View style={[s.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: colors.textMuted }]}>{t('Category')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setFormCategory(c)}
                        style={[
                          s.chip,
                          { borderColor: colors.border, backgroundColor: formCategory === c ? colors.primary : colors.statusBg },
                        ]}
                      >
                        <Text style={[s.chipText, { color: formCategory === c ? '#fff' : colors.textMuted }]}>{c}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <Text style={[s.label, { color: colors.textMuted }]}>{t('Tags')}</Text>
              <TextInput
                value={tags}
                onChangeText={setTags}
                style={[s.input, inputStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholderTextColor={colors.textMuted}
              />
              {!editing && (
                <>
                  <Text style={[s.label, { color: colors.textMuted }]}>{t('Or upload a file')}</Text>
                  <Pressable
                    onPress={pickFile}
                    style={[s.uploadBox, { borderColor: colors.border, backgroundColor: colors.statusBg }]}
                  >
                    <FileUp size={20} color={colors.textMuted} />
                    <Text style={[s.uploadText, { color: colors.textMuted }]} numberOfLines={1}>
                      {pickedFile ? pickedFile.name : t('PDF, DOCX, or TXT')}
                    </Text>
                  </Pressable>
                </>
              )}
              <View style={[s.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Pressable onPress={() => setModalOpen(false)} style={[s.btn, s.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[s.btnText, { color: colors.textMuted }]}>{t('Cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving || !title.trim()}
                  style={[s.btn, s.saveBtn, { backgroundColor: colors.primary, opacity: saving || !title.trim() ? 0.4 : 1 }]}
                >
                  <Text style={[s.btnText, { color: '#fff' }]}>
                    {saving ? t('Uploading...') : editing ? t('Save') : t('Create')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  actions: { gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.md },
  badge: { alignSelf: 'flex-start', borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, textTransform: 'capitalize' },
  btn: { borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  btnText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  cancelBtn: { borderWidth: 1 },
  card: { borderRadius: radii.xl, borderWidth: 1, maxHeight: '90%', padding: spacing.md, width: '92%' },
  cardHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, textTransform: 'capitalize' },
  chips: { flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs },
  closeBtn: { padding: spacing.xs },
  form: { gap: spacing.sm },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, marginBottom: spacing.xs, marginTop: spacing.xs },
  overlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', flex: 1, justifyContent: 'center' },
  row: { gap: spacing.sm },
  saveBtn: {},
  textarea: { minHeight: 110 },
  uploadBox: { alignItems: 'center', borderRadius: radii.lg, borderStyle: 'dashed', borderWidth: 2, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md },
  uploadText: { flex: 1, fontSize: font.sizes.sm },
});
