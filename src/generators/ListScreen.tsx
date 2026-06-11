import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StatusActions } from '../components/StatusActions';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { font, radii, spacing } from '../theme';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

type FetchParams = {
  page: number;
  limit: number;
  search?: string;
  sort?: SortConfig;
  filters?: Record<string, string>;
};

type Column<T> = {
  key: string;
  titleKey: string;
  width?: number;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
};

type FilterConfig = {
  key: string;
  labelKey: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
};

type ActionConfig = {
  labelKey: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
};

type Props<T> = {
  columns: Column<T>[];
  fetchData: (params: FetchParams) => Promise<{ data: T[]; total: number }>;
  searchable?: boolean;
  searchPlaceholderKey?: string;
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  onCreate?: () => void;
  createLabelKey?: string;
  emptyTitleKey?: string;
  emptyMessageKey?: string;
  onRowPress?: (item: T) => void;
  rowActions?: (item: T) => { label: string; icon?: React.ReactNode; onPress: () => void; destructive?: boolean }[];
  keyExtractor: (item: T) => string;
  pageSize?: number;
  refreshInterval?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ListScreen<T extends Record<string, any>>({
  columns,
  fetchData,
  searchable = true,
  searchPlaceholderKey = 'Search...',
  filters,
  actions,
  onCreate,
  createLabelKey = 'Create',
  emptyTitleKey = 'No data found',
  emptyMessageKey = 'No items to display',
  onRowPress,
  rowActions,
  keyExtractor,
  pageSize = 10,
  refreshInterval,
}: Props<T>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<SortConfig | undefined>();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadData = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetchData({ page: pageNum, limit: pageSize, search, sort });
      setData(Array.isArray(res?.data) ? res.data : []);
      setTotal(typeof res?.total === 'number' ? res.total : 0);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchData, pageSize, search, sort]);

  useEffect(() => { loadData(1); }, [loadData]);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(() => loadData(page), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, loadData, page]);

  useEffect(() => { setPage(1); loadData(1); }, [search, sort]);

  const handleRefresh = () => loadData(page, true);

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const visibleColumns = useMemo(() => {
    const cols = columns || [];
    const totalWidth = cols.reduce((sum, c) => sum + (c.width || 0), 0);
    if (totalWidth === 0) return cols.map(c => ({ ...c, width: SCREEN_WIDTH / cols.length }));
    return cols;
  }, [columns]);

  const renderHeader = () => (
    <View style={[s.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {visibleColumns.map(col => (
        <TouchableOpacity
          key={col.key}
          style={[s.th, { width: col.width }]}
          onPress={col.sortable ? () => handleSort(col.key) : undefined}
          disabled={!col.sortable}
        >
          <Text
            style={[
              s.thText,
              { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' },
              sort?.key === col.key && { color: colors.primary, fontWeight: font.weights.semibold },
            ]}
            numberOfLines={1}
          >
            {t(col.titleKey)}
            {sort?.key === col.key && (sort.direction === 'asc' ? ' ↑' : ' ↓')}
          </Text>
        </TouchableOpacity>
      ))}
      {rowActions && (
        <View style={[s.th, { width: 50 }]}>
          <Text style={[s.thText, { color: colors.textMuted, textAlign: 'center' }]}>{t('Actions')}</Text>
        </View>
      )}
    </View>
  );

  const renderRow = ({ item }: { item: T }) => (
    <TouchableOpacity
      style={[s.row, { borderBottomColor: colors.border }]}
      onPress={() => onRowPress?.(item)}
      activeOpacity={onRowPress ? 0.6 : 1}
    >
      {visibleColumns.map(col => (
        <View key={col.key} style={[s.td, { width: col.width }]}>
          {col.render(item)}
        </View>
      ))}
      {rowActions && (
        <View style={[s.td, { width: 50, justifyContent: 'center' }]}>
          <StatusActions actions={rowActions(item)} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPagination = () => (
    <View style={[s.pagination, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <TouchableOpacity
        style={[s.pageBtn, { borderColor: colors.border }]}
        onPress={() => setPage(p => Math.max(1, p - 1))}
        disabled={page <= 1}
      >
        <ChevronLeft size={16} color={page <= 1 ? colors.textMuted : colors.ink} />
      </TouchableOpacity>

      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
        const pageNum = i + 1;
        return (
          <TouchableOpacity
            key={pageNum}
            style={[s.pageNum, pageNum === page && { backgroundColor: colors.primary }]}
            onPress={() => setPage(pageNum)}
          >
            <Text style={[s.pageNumText, { color: pageNum === page ? '#FFF' : colors.ink }]}>
              {pageNum}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[s.pageBtn, { borderColor: colors.border }]}
        onPress={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages}
      >
        <ChevronRight size={16} color={page >= totalPages ? colors.textMuted : colors.ink} />
      </TouchableOpacity>

      <Text style={[s.pageInfo, { color: colors.textMuted }]}>
        {t('Page')} {page} {t('of')} {totalPages}
      </Text>
    </View>
  );

  const renderSearch = () => (
    <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Search size={16} color={colors.textMuted} style={s.searchIcon} />
      <TextInput
        style={[s.searchInput, { color: colors.ink }]}
        placeholder={t(searchPlaceholderKey)}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
    </View>
  );

  const renderToolbar = () => (
    <View style={s.toolbar}>
      {actions?.map((action, i) => (
        <TouchableOpacity
          key={i}
          style={[s.toolbarBtn, action.variant === 'secondary' ? { borderColor: colors.border, borderWidth: 1 } : { backgroundColor: colors.primary }]}
          onPress={action.onPress}
        >
          {action.icon}
          <Text style={[s.toolbarBtnText, { color: action.variant === 'secondary' ? colors.ink : '#FFF' }]}>
            {t(action.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
      {onCreate && (
        <TouchableOpacity style={[s.createBtn, { backgroundColor: colors.primary }]} onPress={onCreate}>
          <Plus size={18} color="#FFF" />
          <Text style={s.createBtnText}>{t(createLabelKey)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && data.length === 0) {
    return (
      <View style={s.loadingState}>
        {renderToolbar()}
        {searchable && renderSearch()}
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <View style={s.emptyState}>
        {renderToolbar()}
        {searchable && renderSearch()}
        <EmptyState title={t(emptyTitleKey)} message={t(emptyMessageKey)} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {renderToolbar()}
      {searchable && renderSearch()}
      {filters && filters.length > 0 && (
        <View style={s.filterRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {}}
            >
              <Text style={[s.filterChipText, { color: colors.textMuted }]}>{t(f.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator bounces={false} style={s.tableOuter}>
        <View>
          {renderHeader()}
          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
      {renderPagination()}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  createBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  emptyState: { flex: 1, gap: spacing.md },
  filterChip: {
    borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  filterChipText: { fontSize: font.sizes.xs },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  headerRow: {
    flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  loadingState: { flex: 1, gap: spacing.md, justifyContent: 'center' },
  pageBtn: {
    alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center',
    height: 32, width: 32,
  },
  pageInfo: { fontSize: font.sizes.xs, marginLeft: spacing.sm },
  pageNum: {
    alignItems: 'center', borderRadius: radii.sm, justifyContent: 'center',
    height: 32, width: 32,
  },
  pageNumText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  pagination: {
    alignItems: 'center', borderTopWidth: 1, flexDirection: 'row',
    justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
    minHeight: 56, paddingVertical: spacing.sm,
  },
  searchIcon: { marginHorizontal: spacing.sm },
  searchInput: { flex: 1, fontSize: font.sizes.sm, paddingVertical: spacing.sm },
  tableOuter: { flex: 1 },
  searchWrap: {
    alignItems: 'center', borderRadius: radii.md, borderWidth: 1,
    flexDirection: 'row', marginBottom: spacing.sm,
  },
  td: { justifyContent: 'center', paddingHorizontal: spacing.xs },
  th: { paddingHorizontal: spacing.xs },
  thText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  toolbarBtn: {
    alignItems: 'center', borderRadius: radii.md, flexDirection: 'row',
    gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  toolbarBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
