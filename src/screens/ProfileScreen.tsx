import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Mail, Phone, User as UserIcon, Cake, MapPin, Building2, Briefcase,
  DollarSign, Clock, Calendar, CalendarDays, KeyRound, Pencil, LogOut,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { StarRating } from '../components/StarRating';
import { EditProfileModal } from './profile/EditProfileModal';
import { ChangePasswordModal } from './profile/ChangePasswordModal';
import { fetchMe, ProfileUser } from '../services/profile';
import { font, radii, spacing } from '../theme';

function age(dob?: string) {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return String(Math.abs(new Date(diff).getUTCFullYear() - 1970));
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user, refreshUser, logout } = useAuth();
  const isAdmin = user?.type === 'Admin';
  const isEmployee = user?.type === 'Employee';

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const load = async () => {
    try {
      setProfile(await fetchMe());
    } catch {
      setProfile((user as ProfileUser) || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;

  const p = profile;
  const detail = p?.employee_detail || {};
  const avatar = p?.imageProfile || p?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p?.name || 'U')}&background=random`;

  const infoRows = [
    { icon: UserIcon, label: t('Name'), value: p?.name || '-' },
    { icon: Mail, label: t('Email'), value: p?.email || '-' },
    { icon: Phone, label: t('Phone'), value: p?.phone || '-' },
    ...(isEmployee
      ? [
          { icon: Cake, label: t('Age'), value: age(detail.date_of_birth) },
          { icon: MapPin, label: t('Location'), value: detail.city && detail.country ? `${detail.city}, ${detail.country}` : '-' },
        ]
      : []),
  ];

  const workInfo = [
    { icon: Building2, color: '#375DFB', label: t('Department'), value: detail.department?.name || '-' },
    { icon: Briefcase, color: '#10B981', label: t('Role'), value: detail.position?.name || '-' },
    { icon: DollarSign, color: '#F59E0B', label: t('Salary'), value: `$${detail.salary || 0}/${t('month')}` },
    { icon: Clock, color: '#8B5CF6', label: t('Working Hours'), value: `${detail.work_hours || 0} ${t('hrs/day')}` },
    { icon: Calendar, color: '#F17B2C', label: t('Annual Leave'), value: `${detail.yearly_day_offs || 0} ${t('days')}` },
    { icon: CalendarDays, color: '#EF4444', label: t('Weekend'), value: detail.weekend_days?.join(' - ') || '-' },
  ];

  const ratings = detail.ratings || [];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Image source={{ uri: avatar }} style={[styles.avatar, { borderColor: colors.primary }]} />
        <Text style={[styles.name, { color: colors.ink }]}>{p?.name || '-'}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{p?.email}</Text>
        <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.typeText, { color: colors.primary }]}>{p?.type || '-'}</Text>
        </View>
        <View style={styles.headerBtns}>
          <View style={styles.headerBtn}>
            <Button label={t('Change password')} variant="secondary" size="sm" icon={<KeyRound size={14} color="#FFF" />} onPress={() => setPwOpen(true)} />
          </View>
          <View style={styles.headerBtn}>
            <Button label={t('Edit profile')} variant="ghost" size="sm" icon={<Pencil size={14} color={colors.primary} />} onPress={() => setEditOpen(true)} />
          </View>
        </View>
      </View>

      {/* Personal info */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Personal Information')}</Text>
        {infoRows.map((row, i) => {
          const Icon = row.icon;
          return (
            <View key={i} style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon size={18} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{row.label}:</Text>
              <Text style={[styles.infoValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{row.value}</Text>
            </View>
          );
        })}
      </View>

      {/* Employee work info + rating */}
      {isEmployee && (
        <>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Work Information')}</Text>
            <View style={styles.workGrid}>
              {workInfo.map((w, i) => {
                const Icon = w.icon;
                return (
                  <View key={i} style={[styles.workItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.workIcon, { backgroundColor: w.color + '18' }]}>
                      <Icon size={16} color={w.color} />
                    </View>
                    <View style={styles.workText}>
                      <Text style={[styles.workLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{w.label}</Text>
                      <Text style={[styles.workValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{w.value}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, styles.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('Performance Rating')}</Text>
            <Text style={[styles.ratingBig, { color: colors.primary }]}>{(detail.overall_rating || 0).toFixed(1)}</Text>
            <StarRating rating={detail.overall_rating || 0} size={22} />
            <Text style={[styles.ratingNote, { color: colors.textMuted }]}>{t('Automatic calculation')}</Text>
          </View>

          {ratings.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Tasks Rating')}</Text>
              {ratings.map((r, i) => (
                <View key={i} style={[styles.ratingRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.ratingRowTop}>
                    <Text style={[styles.ratingTask, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{r.details || '-'}</Text>
                    <StarRating rating={r.score || 0} size={14} />
                  </View>
                  {r.comment ? <Text style={[styles.ratingComment, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <Button label={t('Logout')} onPress={logout} variant="danger" icon={<LogOut size={16} color={colors.dangerText} />} />

      <EditProfileModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        user={p}
        isAdmin={isAdmin}
        onSaved={() => { load(); refreshUser(); }}
      />
      <ChangePasswordModal visible={pwOpen} onClose={() => setPwOpen(false)} isAdmin={isAdmin} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radii.full, borderWidth: 2, height: 88, width: 88 },
  card: {
    borderRadius: radii.xxl, borderWidth: 1, gap: spacing.md, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  cardTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  email: { fontSize: font.sizes.sm },
  headerBtn: { flex: 1 },
  headerBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, width: '100%' },
  headerCard: {
    alignItems: 'center', borderRadius: radii.xxl, borderWidth: 1, gap: spacing.xs, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  infoLabel: { fontSize: font.sizes.sm },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  infoValue: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  loading: { flex: 1, padding: spacing.xxl },
  name: { fontSize: font.sizes.xl, fontWeight: font.weights.bold, marginTop: spacing.sm },
  ratingBig: { fontSize: 44, fontWeight: font.weights.bold },
  ratingCard: { alignItems: 'center' },
  ratingComment: { fontSize: font.sizes.xs, marginTop: 2 },
  ratingNote: { fontSize: font.sizes.xs },
  ratingRow: { borderBottomWidth: 1, gap: 2, paddingVertical: spacing.sm },
  ratingRowTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  ratingTask: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  typeBadge: { borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  typeText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  workGrid: { gap: spacing.md },
  workIcon: { alignItems: 'center', borderRadius: radii.lg, height: 36, justifyContent: 'center', width: 36 },
  workItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  workLabel: { fontSize: font.sizes.xs },
  workText: { flex: 1, gap: 1 },
  workValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
