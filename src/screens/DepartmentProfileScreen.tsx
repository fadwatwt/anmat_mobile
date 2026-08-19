import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import { Building2, Users, CheckCircle2, TrendingUp, Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchDepartmentProfile, DepartmentProfileData } from '../services/hr';
import { fetchLogsByDepartment, ActivityLog } from '../services/activityLogs';
import { font, radii, spacing } from '../theme';

const avatarUrl = (name?: string, image?: string) =>
  image || `https://ui-avatars.com/api/?background=375DFB&color=fff&name=${encodeURIComponent(name || '?')}`;

export default function DepartmentProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const route = useRoute<any>();
  const departmentId = route.params?.department_id;

  const [department, setDepartment] = useState<DepartmentProfileData | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = async () => {
    if (!departmentId) return;
    try {
      const [deptData, logsData] = await Promise.all([
        fetchDepartmentProfile(departmentId),
        fetchLogsByDepartment(departmentId, { limit: 10 }).catch(() => ({ data: [], total: 0 })),
      ]);
      setDepartment(deptData);
      setLogs(logsData.data || []);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !department) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger, textAlign: align, fontSize: font.sizes.base }}>
          {t('Error loading department profile')}
        </Text>
      </View>
    );
  }

  const stats = department.stats ?? ({} as NonNullable<DepartmentProfileData['stats']>);
  const employees = department.employees || [];
  const ratings = department.ratings || [];
  const overall = department.overall_rating || 0;

  const statCards = [
    {
      key: 'employees',
      label: t('Employees'),
      value: String(stats.totalEmployees ?? 0),
      icon: Users,
      color: '#2563EB',
      bg: colors.infoBg,
    },
    {
      key: 'completion',
      label: t('Completion'),
      value: `${stats.completedTasks ?? 0} / ${stats.totalTasks ?? 0}`,
      icon: CheckCircle2,
      color: '#16A34A',
      bg: colors.successBg,
    },
    {
      key: 'successRate',
      label: t('Success Rate'),
      value: `${stats.successRate ?? 0}%`,
      icon: TrendingUp,
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      key: 'points',
      label: t('Points'),
      value: String((stats.totalPoints ?? 0).toFixed(0)),
      icon: Star,
      color: '#D97706',
      bg: colors.warningBg,
    },
  ];

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={s.content}>
        {/* Header */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[s.headerIcon, { backgroundColor: colors.primaryLight }]}>
              <Building2 size={28} color={colors.primary} />
            </View>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, { color: colors.ink, textAlign: align }]}>{department.name}</Text>
              {department.description ? (
                <Text style={[s.headerSubtitle, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
                  {department.description}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={[s.headerMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[s.ratingPill, { backgroundColor: colors.primaryLight }]}>
              <Star size={14} color={colors.primary} fill={colors.primary} />
              <Text style={[s.ratingText, { color: colors.primary }]}>{overall.toFixed(1)}</Text>
            </View>
            {department.evaluation_method === 'MANUAL' && (
              <View style={[s.manualPill, { backgroundColor: colors.warningBg }]}>
                <Text style={[s.manualText, { color: colors.warningText }]}>{t('Manual Override Active')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <View key={card.key} style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.statIcon, { backgroundColor: card.bg }]}>
                  <Icon size={18} color={card.color} />
                </View>
                <Text style={[s.statLabel, { color: colors.textMuted }]}>{card.label}</Text>
                <Text style={[s.statValue, { color: colors.ink }]}>{card.value}</Text>
              </View>
            );
          })}
        </View>

        {/* Department Members */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Department Members')}</Text>
          {employees.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No employees')}</Text>
          ) : (
            employees.map((emp, i) => (
              <View
                key={emp._id}
                style={[
                  s.memberRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  i < employees.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight || colors.border },
                ]}
              >
                <Image source={{ uri: avatarUrl(emp.user?.name, emp.user?.avatar || emp.imageProfile) }} style={s.avatar} />
                <View style={s.memberInfo}>
                  <Text style={[s.memberName, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {emp.user?.name || '-'}
                  </Text>
                  <Text style={[s.memberSub, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                    {emp.position?.title || '-'} · {emp.user?.type || '-'}
                  </Text>
                </View>
                <View style={[s.memberRating, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={[s.memberRatingText, { color: colors.ink }]}>{(emp.overall_rating || 0).toFixed(1)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Rating History */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Rating History')}</Text>
          {ratings.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No ratings yet')}</Text>
          ) : (
            ratings.map((rating, i) => (
              <View
                key={rating._id || i}
                style={[
                  s.ratingRow,
                  i < ratings.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight || colors.border },
                ]}
              >
                <View style={s.ratingMain}>
                  <View style={[s.memberRating, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={[s.memberRatingText, { color: colors.ink }]}>{(rating.score || 0).toFixed(1)}</Text>
                  </View>
                  <Text style={[s.ratingDetails, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {rating.details || '-'}
                  </Text>
                </View>
                {rating.created_at ? (
                  <Text style={[s.ratingDate, { color: colors.textMuted, textAlign: align }]}>
                    {new Date(rating.created_at).toLocaleDateString()}
                  </Text>
                ) : null}
                {rating.comment ? (
                  <Text style={[s.ratingComment, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
                    {rating.comment}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Activity */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Activity')}</Text>
          {logs.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No activity yet')}</Text>
          ) : (
            logs.map((log, i) => (
              <View
                key={log._id || i}
                style={[
                  s.logRow,
                  i < logs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight || colors.border },
                ]}
              >
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[s.logAction, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {log.action || t('Update')}
                  </Text>
                  {log.createdAt ? (
                    <Text style={[s.logDate, { color: colors.textMuted, textAlign: align }]}>
                      {log.createdAt.slice(0, 10)}
                    </Text>
                  ) : null}
                </View>
                {log.description ? (
                  <Text style={[s.logDesc, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
                    {log.description}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  avatar: { borderRadius: radii.full, height: 36, width: 36 },
  card: { borderRadius: radii.xxl, borderWidth: 1, padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  headerIcon: { alignItems: 'center', borderRadius: radii.xl, justifyContent: 'center', padding: spacing.md },
  headerMeta: { alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-start' },
  headerRow: { alignItems: 'center', gap: spacing.md },
  headerSubtitle: { fontSize: font.sizes.sm, marginTop: spacing.xs },
  headerText: { flex: 1 },
  headerTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  logAction: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  logDate: { fontSize: font.sizes.xs, marginStart: spacing.sm },
  logDesc: { fontSize: font.sizes.sm, marginTop: spacing.xs },
  logRow: { gap: spacing.xs, paddingVertical: spacing.sm },
  manualPill: { borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  manualText: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  memberInfo: { flex: 1 },
  memberName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  memberRating: { alignItems: 'center', gap: spacing.xs },
  memberRatingText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  memberRow: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  memberSub: { fontSize: font.sizes.xs, marginTop: 2 },
  ratingComment: { fontSize: font.sizes.xs, marginTop: spacing.xs },
  ratingDate: { fontSize: font.sizes.xs, marginTop: spacing.xs },
  ratingDetails: { flex: 1, fontSize: font.sizes.sm, marginStart: spacing.sm },
  ratingMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingPill: { alignItems: 'center', borderRadius: radii.full, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  ratingRow: { gap: spacing.xs, paddingVertical: spacing.sm },
  ratingText: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.sm },
  statCard: { borderRadius: radii.xl, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.md },
  statIcon: { alignItems: 'center', borderRadius: radii.lg, height: 36, justifyContent: 'center', width: 36 },
  statLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, marginTop: spacing.xs },
  statValue: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
