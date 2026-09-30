import React, { useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Building2, Zap, CheckCircle2, Clock3, XCircle, CheckCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { font, radii, spacing } from '../theme';

type OrderRow = {
  _id: string;
  company: string;
  companyUrl: string;
  plan: string;
  date: string;
  usersSubscribed: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Completed';
};

const ordersData: OrderRow[] = [
  { _id: '1', company: 'Company Name', companyUrl: 'company.url', plan: 'Basic Plan', date: 'May 24, 2025', usersSubscribed: '3', status: 'Approved' },
  { _id: '2', company: 'Company Name', companyUrl: 'company.url', plan: 'Premium Plan', date: 'May 24, 2025', usersSubscribed: '10', status: 'Pending' },
  { _id: '3', company: 'Company Name', companyUrl: 'company.url', plan: 'Basic Plan', date: 'May 24, 2025', usersSubscribed: '25', status: 'Rejected' },
  { _id: '4', company: 'Company Name', companyUrl: 'company.url', plan: 'Premium Plan', date: 'May 24, 2025', usersSubscribed: '12', status: 'Completed' },
];

const statusMeta: Record<string, { bg: string; color: string; Icon: any }> = {
  Approved: { bg: '#dcfce7', color: '#15803d', Icon: CheckCircle2 },
  Pending: { bg: '#fef9c3', color: '#a16207', Icon: Clock3 },
  Rejected: { bg: '#fee2e2', color: '#b91c1c', Icon: XCircle },
  Completed: { bg: '#dbeafe', color: '#1d4ed8', Icon: CheckCheck },
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const fetchData = useCallback(async () => {
    return { data: ordersData, total: ordersData.length };
  }, []);

  const columns = [
    {
      key: 'company',
      titleKey: 'Company Name',
      width: 180,
      render: (item: OrderRow) => (
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
      key: 'plan',
      titleKey: 'Plan Request',
      width: 140,
      render: (item: OrderRow) => (
        <View style={[s.planCell, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[s.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Zap size={14} color={colors.primary} />
          </View>
          <Text style={{ color: colors.ink, fontSize: font.sizes.sm, fontWeight: font.weights.medium }}>{item.plan}</Text>
        </View>
      ),
    },
    {
      key: 'date',
      titleKey: 'Order Date',
      width: 120,
      render: (item: OrderRow) => <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm }}>{item.date}</Text>,
    },
    {
      key: 'usersSubscribed',
      titleKey: 'Users Subscribed',
      width: 90,
      render: (item: OrderRow) => (
        <View style={[s.usersBadge, { backgroundColor: colors.statusBg }]}>
          <Text style={[s.usersText, { color: colors.ink }]}>{item.usersSubscribed}</Text>
        </View>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 110,
      render: (item: OrderRow) => {
        const meta = statusMeta[item.status] || { bg: colors.statusBg, color: colors.textMuted, Icon: CheckCircle2 };
        const Icon = meta.Icon;
        return (
          <View style={[s.statusBadge, { backgroundColor: meta.bg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon size={12} color={meta.color} />
            <Text style={[s.statusText, { color: meta.color }]}>{t(item.status)}</Text>
          </View>
        );
      },
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: OrderRow) => item._id}
      searchable
      searchPlaceholderKey="Search orders..."
      emptyTitleKey="No orders"
      emptyMessageKey="No orders to display"
    />
  );
}

const s = StyleSheet.create({
  companyCell: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  companyName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  companyUrl: { fontSize: font.sizes.xs },
  iconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planCell: { alignItems: 'center', gap: spacing.sm },
  statusBadge: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.full, alignSelf: 'flex-start' },
  statusText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  usersBadge: { borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'center' },
  usersText: { fontSize: font.sizes.sm, fontWeight: font.weights.bold, textAlign: 'center' },
});
