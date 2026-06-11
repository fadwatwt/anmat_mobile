import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  filters: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onSearch?: (text: string) => void;
  searchPlaceholder?: string;
};

export function FilterBar({ filters, onSearch, searchPlaceholder: searchPlaceholderProp }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const searchPlaceholder = searchPlaceholderProp ?? t('Search...');

  return (
    <View style={[styles.container]}>
      {onSearch ? (
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.searchIcon}>
            <Text>🔍</Text>
          </View>
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
            onChangeText={onSearch}
          />
        </View>
      ) : null}

      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          onPress={() => {}}
          style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{filter.label}</Text>
          <Text style={[styles.filterValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{filter.value}</Text>
          <ChevronDown size={14} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBtn: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterText: {
    fontSize: font.sizes.xs,
  },
  filterValue: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.medium,
  },
  searchIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    borderWidth: 0,
    flex: 1,
    fontSize: font.sizes.sm,
    minWidth: 200,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchWrap: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    flex: 1,
    maxWidth: 300,
    overflow: 'hidden',
  },
});
