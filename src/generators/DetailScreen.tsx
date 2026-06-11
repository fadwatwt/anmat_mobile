import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

type DetailRow = {
  labelKey: string;
  value?: string | number | null;
  render?: React.ReactNode;
};

type DetailSection = {
  titleKey: string;
  rows: DetailRow[];
};

type DetailAction = {
  labelKey: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  loading?: boolean;
  icon?: React.ReactNode;
};

type Props = {
  sections: DetailSection[];
  actions?: DetailAction[];
  loading?: boolean;
  errorKey?: string;
  header?: {
    title?: string;
    subtitle?: string;
    avatar?: React.ReactNode;
    status?: { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' };
  };
};

export function DetailScreen({ sections, actions, loading, errorKey, header }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (errorKey) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={[s.errorText, { color: colors.danger, textAlign: isRTL ? 'right' : 'left' }]}>
          {t(errorKey)}
        </Text>
      </View>
    );
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    success: { bg: '#E7F8ED', text: '#1F7A3F' },
    danger: { bg: '#FEE2E5', text: '#C9372C' },
    warning: { bg: '#FEF3C7', text: '#B45309' },
    info: { bg: '#DBEAFE', text: '#1E40AF' },
    default: { bg: '#F3F4F6', text: '#6B7280' },
  };

  const Row = ({ row }: { row: DetailRow }) => (
    <View style={[s.row, { borderBottomColor: colors.borderLight || colors.border }]}>
      <Text style={[s.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
        {t(row.labelKey)}
      </Text>
      {row.render ? (
        <View style={s.rowValue}>{row.render}</View>
      ) : (
        <Text
          style={[s.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {row.value ?? '—'}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        {header && (
          <View style={[s.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {header.avatar && <View style={s.avatarWrap}>{header.avatar}</View>}
            {header.title && (
              <Text style={[s.headerTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
                {header.title}
              </Text>
            )}
            {header.subtitle && (
              <Text style={[s.headerSubtitle, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {header.subtitle}
              </Text>
            )}
            {header.status && (
              <View style={[s.statusBadge, { backgroundColor: statusColors[header.status.variant]?.bg || statusColors.default.bg }]}>
                <Text style={[s.statusText, { color: statusColors[header.status.variant]?.text || statusColors.default.text }]}>
                  {header.status.label}
                </Text>
              </View>
            )}
          </View>
        )}

        {sections.map((section, i) => (
          <View key={i} style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
              {t(section.titleKey)}
            </Text>
            {section.rows.map((row, j) => (
              <Row key={j} row={row} />
            ))}
          </View>
        ))}

        {actions && actions.length > 0 && (
          <View style={s.actionsRow}>
            {actions.map((action, i) => {
              const isPrimary = action.variant === 'primary' || !action.variant;
              const isDanger = action.variant === 'danger';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.actionBtn,
                    isPrimary && { backgroundColor: colors.primary },
                    isDanger && { backgroundColor: colors.danger },
                    action.variant === 'secondary' && { borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={action.onPress}
                  disabled={action.loading}
                >
                  {action.loading ? (
                    <ActivityIndicator color={isPrimary || isDanger ? '#FFF' : colors.ink} size="small" />
                  ) : (
                    <>
                      {action.icon}
                      <Text
                        style={[
                          s.actionBtnText,
                          { color: isPrimary || isDanger ? '#FFF' : colors.ink },
                        ]}
                      >
                        {t(action.labelKey)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  actionBtn: {
    alignItems: 'center', borderRadius: radii.lg, flex: 1, flexDirection: 'row',
    gap: spacing.sm, height: 48, justifyContent: 'center',
  },
  actionBtnText: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  errorText: { fontSize: font.sizes.base },
  headerCard: {
    alignItems: 'center', borderWidth: 1, borderRadius: radii.xxl,
    padding: spacing.xl, gap: spacing.xs,
  },
  headerSubtitle: { fontSize: font.sizes.sm },
  headerTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  rowLabel: { fontSize: font.sizes.sm, flex: 1 },
  rowValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold, flex: 1, alignItems: 'flex-end' },
  sectionCard: {
    borderWidth: 1, borderRadius: radii.xxl, padding: spacing.md,
  },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.sm },
  statusBadge: {
    borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  statusText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
});
