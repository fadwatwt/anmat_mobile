import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

export type Column<T> = {
  key: string;
  header: string;
  width?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  emptyMessage?: string;
  ListEmptyComponent?: React.ReactElement | null;
};

export function Table<T>({
  data,
  columns,
  emptyMessage: emptyMessageProp,
  keyExtractor,
  ListEmptyComponent,
  onRefresh,
  refreshing,
}: Props<T>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const emptyMessage = emptyMessageProp ?? t('No data');

  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {columns.map((col) => (
        <View
          key={col.key}
          style={[
            styles.headerCell,
            { flex: col.flex, width: col.width },
          ]}
        >
          <Text
            style={[
              styles.headerText,
              { color: colors.textMuted, writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' },
              col.align === 'left' && styles.textLeft,
              col.align === 'center' && styles.textCenter,
              col.align === 'right' && styles.textRight,
            ]}
          >
            {t(col.header)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item, index }: { item: T; index: number }) => (
    <View style={[styles.row, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {columns.map((col) => (
        <View
          key={col.key}
          style={[
            styles.cell,
            { borderBottomColor: colors.border },
            { flex: col.flex, width: col.width },
          ]}
        >
          {col.render ? (
            col.render(item, index)
          ) : (
            <Text
              numberOfLines={2}
              style={[
                styles.cellText,
                { color: colors.textCell, writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' },
                col.align === 'left' && styles.textLeft,
                col.align === 'center' && styles.textCenter,
                col.align === 'right' && styles.textRight,
              ]}
            >
              {String((item as Record<string, unknown>)[col.key] ?? '')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {renderHeader()}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          ListEmptyComponent || (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{emptyMessage}</Text>
            </View>
          )
        }
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cellText: {
    fontSize: font.sizes.sm,
  },
  container: {
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: font.sizes.sm,
  },
  headerCell: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerRow: {
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  row: {
    borderBottomWidth: 1,
  },
  textCenter: {
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
});
