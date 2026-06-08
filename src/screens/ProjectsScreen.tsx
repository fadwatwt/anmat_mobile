import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical } from 'lucide-react-native';

type Project = {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  priority?: string;
  department?: string;
  assignee?: { name: string };
  manager?: { name: string };
};

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' | 'danger' }> = {
  active: { label: 'نشط', variant: 'success' },
  completed: { label: 'مكتمل', variant: 'info' },
  on_hold: { label: 'متوقف', variant: 'warning' },
  cancelled: { label: 'ملغي', variant: 'danger' },
  pending: { label: 'معلق', variant: 'default' },
};

function getStatus(s?: string) {
  if (!s) return { label: 'نشط', variant: 'success' as const };
  return statusMap[s.toLowerCase()] || { label: s, variant: 'default' as const };
}

function formatDate(d?: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('ar');
}

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'حدث خطأ';
}

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProjects([]);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredProjects = projects.filter((p) => {
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    return (p.name || p.title || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term);
  });

  const listHeader = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.ink }]}>المشاريع</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>إدارة ومتابعة المشاريع</Text>
        </View>
        <Button label="مشروع جديد" onPress={() => setModalVisible(true)} icon={<Plus size={18} color="#FFF" />} />
      </View>

      <View style={styles.filters}>
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="بحث عن مشروع..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.ink }]}
            onChangeText={setSearchText}
            value={searchText}
          />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Filter size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && !projects.length ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredProjects}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={searchText ? 'لا توجد نتائج' : 'لا توجد مشاريع'}
                message={searchText ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإنشاء مشروع جديد'}
                icon="📁"
              />
            ) : null
          }
          onRefresh={() => { setRefreshing(true); load(); }}
          refreshing={refreshing}
          renderItem={({ item }) => {
            const status = getStatus(item.status);
            const progress = item.progress || 0;

            return (
              <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitleText, { color: colors.ink }]} numberOfLines={1}>{item.name || item.title || 'مشروع'}</Text>
                    <Badge label={status.label} variant={status.variant} />
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>التقدم</Text>
                    <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.metaValue, { color: colors.ink }]}>{progress}%</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>الحالة</Text>
                    <Badge label={status.label} variant={status.variant} />
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={[styles.metaSmall, { color: colors.textMuted }]}>بداية: {formatDate(item.startDate)}</Text>
                  <Text style={[styles.metaSmall, { color: colors.textMuted }]}>نهاية: {formatDate(item.endDate)}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconBtn}><Eye size={16} color={colors.textMuted} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Edit size={16} color={colors.primary} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Trash2 size={16} color={colors.danger} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><MoreVertical size={16} color={colors.textMuted} /></TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="مشروع جديد" size="lg">
        <View style={styles.modalForm}>
          <Text style={[styles.modalLabel, { color: colors.ink }]}>اسم المشروع</Text>
          <TextInput style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.ink }]} placeholder="أدخل اسم المشروع" placeholderTextColor={colors.textMuted} />
          <Text style={[styles.modalLabel, { color: colors.ink }]}>الوصف</Text>
          <TextInput style={[styles.modalInput, styles.modalTextarea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.ink }]} placeholder="وصف المشروع" placeholderTextColor={colors.textMuted} multiline />
          <View style={styles.modalActions}>
            <Button label="إلغاء" variant="secondary" onPress={() => setModalVisible(false)} />
            <Button label="إنشاء" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radii.xxl, gap: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  cardMeta: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  cardMetaItem: { flex: 1 },
  cardTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  cardTitleText: { fontSize: font.sizes.base, fontWeight: font.weights.bold, textAlign: 'right' },
  cardTop: { gap: spacing.sm },
  container: { flex: 1 },
  desc: { fontSize: font.sizes.sm, lineHeight: 20, textAlign: 'right' },
  filters: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  filterBtn: { alignItems: 'center', borderWidth: 1, borderRadius: radii.md, justifyContent: 'center', padding: spacing.sm, width: 44 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  headerLeft: { flex: 1, gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
  list: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: 0 },
  loading: { marginVertical: spacing.xl },
  metaItem: { alignItems: 'flex-start', flex: 1, gap: spacing.xs },
  metaLabel: { fontSize: font.sizes.xs },
  metaSmall: { fontSize: font.sizes.xs },
  metaValue: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalForm: { gap: spacing.md },
  modalInput: { borderWidth: 1, borderRadius: radii.md, fontSize: font.sizes.sm, padding: spacing.md },
  modalLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  modalTextarea: { height: 100, textAlignVertical: 'top' },
  progressBar: { borderRadius: radii.full, height: 6, marginVertical: spacing.xs, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: radii.full, height: '100%' },
  searchIcon: { paddingHorizontal: spacing.md },
  searchInput: { flex: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchWrap: { alignItems: 'center', borderWidth: 1, borderRadius: radii.md, flex: 1, flexDirection: 'row', maxWidth: 300 },
  subtitle: { fontSize: font.sizes.sm, textAlign: 'right' },
  title: { fontSize: font.sizes.xl, fontWeight: font.weights.bold, textAlign: 'right' },
});
