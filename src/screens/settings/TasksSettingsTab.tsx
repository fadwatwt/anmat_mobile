import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Star, Plus, X } from 'lucide-react-native';
import { SelectDropdown } from '../../components/SelectDropdown';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchUserPreferences,
  updateUserPreferences,
  fetchOrganizationSettings,
  updateOrganizationSettings,
} from '../../services/settings';

const EVAL_OPTIONS = [
  { label: 'Auto (Based on calculations)', value: 'AUTO' },
  { label: 'Manual Override', value: 'MANUAL' },
];

export default function TasksSettingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'tasks' | 'rating'>('tasks');

  // Tasks preferences
  const [minTasks, setMinTasks] = useState('2');

  // Rating preferences
  const [isPointsActive, setIsPointsActive] = useState(true);
  const [evalMethod, setEvalMethod] = useState('AUTO');
  const [ratingTypes, setRatingTypes] = useState<string[]>(['Time Evaluation']);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const [prefs, org] = await Promise.all([
            fetchUserPreferences(),
            fetchOrganizationSettings(),
          ]);
          if (prefs.min_tasks !== undefined) setMinTasks(String(prefs.min_tasks));
          setIsPointsActive(org.is_points_system_active ?? true);
          setEvalMethod(org.default_evaluation_method || 'AUTO');
          setRatingTypes(org.rating_types?.length ? org.rating_types : ['Time Evaluation']);
        } catch {
          // use defaults
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const handleSaveTasks = async () => {
    const val = parseInt(minTasks, 10);
    if (isNaN(val) || val < 1) {
      Alert.alert(t('Error'), t('Minimum number of tasks must be a positive integer'));
      return;
    }
    setSaving(true);
    try {
      await updateUserPreferences({ min_tasks: val });
      Alert.alert(t('Success'), t('Settings updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRating = async () => {
    setSaving(true);
    try {
      const filtered = ratingTypes.filter((rt) => rt.trim() !== '');
      await updateOrganizationSettings({
        is_points_system_active: isPointsActive,
        default_evaluation_method: evalMethod,
        rating_types: filtered.length ? filtered : ['Time Evaluation'],
      });
      Alert.alert(t('Success'), t('Rating settings updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update rating settings'));
    } finally {
      setSaving(false);
    }
  };

  const addRatingType = () => setRatingTypes([...ratingTypes, '']);
  const updateRatingType = (i: number, v: string) => {
    const updated = [...ratingTypes];
    updated[i] = v;
    setRatingTypes(updated);
  };
  const removeRatingType = (i: number) => {
    if (ratingTypes.length <= 1) return;
    setRatingTypes(ratingTypes.filter((_, idx) => idx !== i));
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Section Toggle */}
      <View style={[styles.sectionToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'tasks' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('tasks')}
        >
          <ClipboardList size={16} color={activeSection === 'tasks' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sectionBtnText, { color: activeSection === 'tasks' ? colors.primary : colors.textMuted }]}>
            {t('Tasks')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'rating' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('rating')}
        >
          <Star size={16} color={activeSection === 'rating' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sectionBtnText, { color: activeSection === 'rating' ? colors.primary : colors.textMuted }]}>
            {t('Rating')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'tasks' ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Tasks Preferences')}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Customize tasks settings')}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Minimum Number of Tasks When Creating a Project')}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, textAlign: align }]}
              value={minTasks}
              onChangeText={setMinTasks}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveTasks}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? t('Saving...') : t('Apply Changes')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Adding Rating Categories')}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Customize Rating settings')}</Text>

          <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.toggleTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.toggleLabel, { color: colors.ink, textAlign: align }]}>{t('Enable Points System')}</Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted, textAlign: align }]}>
                {t('Turn on/off the automatic employee points calculation.')}
              </Text>
            </View>
            <Switch
              value={isPointsActive}
              onValueChange={setIsPointsActive}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={isPointsActive ? colors.primary : '#f4f3f4'}
            />
          </View>

          <SelectDropdown
            label={t('Default Evaluation Method')}
            options={EVAL_OPTIONS}
            value={evalMethod}
            onChange={setEvalMethod}
            translateLabels
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Rating Categories')}</Text>
          {ratingTypes.map((type, i) => (
            <View key={i} style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                style={[styles.ratingInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, textAlign: align }]}
                value={type}
                onChangeText={(v) => updateRatingType(i, v)}
                placeholder={`${t('Rating type')} ${i + 1}`}
                placeholderTextColor={colors.textMuted}
              />
              {ratingTypes.length > 1 && (
                <TouchableOpacity onPress={() => removeRatingType(i)} style={styles.removeBtn}>
                  <X size={18} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary }]} onPress={addRatingType}>
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('Add Rating type')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveRating}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? t('Saving...') : t('Apply Changes')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 60 },
  sectionToggle: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBtnText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  fieldLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: font.sizes.sm,
  },
  divider: { height: 1, marginVertical: spacing.xs },
  toggleRow: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  toggleTextWrap: { flex: 1, gap: 2, marginEnd: spacing.sm },
  toggleLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  toggleDesc: { fontSize: font.sizes.xs },
  saveBtn: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  ratingRow: { alignItems: 'center', gap: spacing.sm },
  ratingInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: font.sizes.sm,
  },
  removeBtn: { padding: spacing.xs },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
  },
  addBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
