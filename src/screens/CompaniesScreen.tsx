import React, { useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Building2, CheckCircle2, Ban } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { font, radii, spacing } from '../theme';

type CompanyRow = {
  _id: string;
  company: string;
  companyUrl: string;
  industry: string;
  subscribed_at: string;
  usersNumber: string;
  status: 'Customer' | 'Churned';
};

const companysData: CompanyRow[] = [
  { _id: '1', company: 'Company Name', companyUrl: 'company.url', industry: 'Design', subscribed_at: 'May 24, 2025', usersNumber: '3', status: 'Churned' },
  { _id: '2', company: 'Company Name', companyUrl: 'company.url', industry: 'Fintech', subscribed_at: 'May 24, 2025', usersNumber: '10', status: 'Customer' },
  { _id: '3', company: 'Company Name', companyUrl: 'company.url', industry: 'Design', subscribed_at: 'May 24, 2025', usersNumber: '25', status: 'Churned' },
  { _id: '4', company: 'Company Name', companyUrl: 'company.url', industry: 'Fintech', subscribed_at: 'May 24, 2025', usersNumber: '12', status: 'Customer' },
];

export default function CompaniesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const fetchData = useCallback(async () => {
    return { data: companysData, total: companysData.length };
  }, []);

  const columns = [
    {
      key: 'company',
      titleKey: 'Company',
      width: 180,
      render: (item: CompanyRow) => (
        <View style={[s.companyCell, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[s.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Building2 size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.companyName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.company}</Text>
            <Text style={[s.companyUrl, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.companyUrl}</Text>
          </View>
        </View>
      ),
    },
    {
      key: 'industry',
      titleKey: 'Industry',
      width: 110,
      render: (item: CompanyRow) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }}>{item.industry}</Text>
      ),
    },
    {
      key: 'subscribed_at',
      titleKey: 'Subscribed at',
      width: 130,
      render: (item: CompanyRow) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm }}>{item.subscribed_at}</Text>
      ),
    },
    {
      key: 'usersNumber',
      titleKey: 'Users',
      width: 80,
      render: (item: CompanyRow) => (
        <View style={[s.usersBadge, { backgroundColor: colors.statusBg }]}>
          <Text style={[s.usersText, { color: colors.ink }]}>{item.usersNumber}</Text>
        </View>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 110,
      render: (item: CompanyRow) => {
        const isCustomer = item.status === 'Customer';
        return (
          <View style={[s.statusBadge, { backgroundColor: isCustomer ? colors.successBg : colors.statusBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {isCustomer ? <CheckCircle2 size={12} color={colors.successText} /> : <Ban size={12} color={colors.textMuted} />}
            <Text style={[s.statusText, { color: isCustomer ? colors.successText : colors.textMuted }]}>{t(item.status)}</Text>
          </View>
        );
      },
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: CompanyRow) => item._id}
      searchable
      searchPlaceholderKey="Search companies..."
      emptyTitleKey="No companies"
      emptyMessageKey="No companies to display"
    />
  );
}

const s = StyleSheet.create({
  companyCell: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  companyName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  companyUrl: { fontSize: font.sizes.xs },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.full, alignSelf: 'flex-start' },
  statusText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  usersBadge: { borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'center' },
  usersText: { fontSize: font.sizes.sm, fontWeight: font.weights.bold, textAlign: 'center' },
});
