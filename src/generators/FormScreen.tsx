import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { SelectDropdown, MultiSelectDropdown } from '../components/SelectDropdown';
import { font, radii, spacing } from '../theme';

type FieldType = 'text' | 'email' | 'phone' | 'number' | 'password' | 'multiline' | 'select' | 'chips' | 'autocomplete' | 'date';

type FieldOption = {
  label: string;
  value: string;
};

type FieldConfig = {
  name: string;
  labelKey: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  validate?: (value: any, values: Record<string, any>) => string | undefined;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
};

type FormSection = {
  titleKey: string;
  fields: FieldConfig[];
};

type Props = {
  sections: FormSection[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, any>;
  submitLabelKey?: string;
  loadingLabelKey?: string;
  successMessageKey?: string;
  errorMessageKey?: string;
  stepper?: boolean;
};

type Errors = Record<string, string | undefined>;

export function FormScreen({
  sections,
  onSubmit,
  initialValues = {},
  submitLabelKey = 'Save',
  loadingLabelKey = 'Saving...',
  successMessageKey = 'Saved successfully',
  errorMessageKey = 'Failed to save',
  stepper = false,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const allFields = useMemo(() => sections.flatMap(s => s.fields), [sections]);

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = sections[sectionIndex];
    const newErrors: Errors = {};
    let valid = true;

    section.fields.forEach(field => {
      if (field.required && !values[field.name]?.toString().trim()) {
        newErrors[field.name] = t('This field is required');
        valid = false;
      }
      if (field.validate) {
        const error = field.validate(values[field.name], values);
        if (error) {
          newErrors[field.name] = error;
          valid = false;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return valid;
  };

  const validateAll = (): boolean => {
    const newErrors: Errors = {};
    let valid = true;

    allFields.forEach(field => {
      if (field.required && !values[field.name]?.toString().trim()) {
        newErrors[field.name] = t('This field is required');
        valid = false;
      }
      if (field.validate) {
        const error = field.validate(values[field.name], values);
        if (error) {
          newErrors[field.name] = error;
          valid = false;
        }
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (stepper) {
      if (!validateAll()) return;
    } else {
      if (!validateAll()) return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
      Alert.alert(t('Success'), t(successMessageKey));
    } catch {
      Alert.alert(t('Error'), t(errorMessageKey));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (validateSection(step)) {
      setStep(s => Math.min(s + 1, sections.length - 1));
    }
  };

  const handlePrev = () => {
    setStep(s => Math.max(s - 1, 0));
  };

  const [autocompleteField, setAutocompleteField] = useState<string | null>(null);
  const [autocompleteSearch, setAutocompleteSearch] = useState('');
  const [dateField, setDateField] = useState<string | null>(null);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDate = (str?: string) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return new Date();
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setDateField(null);
    if (event.type === 'dismissed' || !selected || !dateField) return;
    setValue(dateField, formatDate(selected));
    if (Platform.OS === 'ios') setDateField(null);
  };

  const renderField = (field: FieldConfig) => {
    const hasError = !!errors[field.name];
    const inputStyle = [
      field.type === 'multiline' ? s.inputMultiline : s.input,
      {
        backgroundColor: colors.surface,
        borderColor: hasError ? colors.danger : colors.border,
        color: colors.ink,
        textAlign: isRTL ? 'right' as const : 'left' as const,
      },
    ];

    if (field.type === 'autocomplete') {
      const selectedOption = field.options?.find(o => o.value === values[field.name]);
      const filtered = (field.options || []).filter(o =>
        o.label.toLowerCase().includes(autocompleteSearch.toLowerCase())
      );
      const isOpen = autocompleteField === field.name;
      return (
        <View>
          <TouchableOpacity
            style={[s.input, { backgroundColor: colors.surface, borderColor: hasError ? colors.danger : colors.border, justifyContent: 'center' }]}
            onPress={() => { setAutocompleteField(field.name); setAutocompleteSearch(''); }}
          >
            <Text style={{ color: selectedOption ? colors.ink : colors.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
              {selectedOption ? selectedOption.label : (field.placeholder ? t(field.placeholder) : t('Select...'))}
            </Text>
          </TouchableOpacity>
          <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setAutocompleteField(null)}>
            <Pressable style={s.autocompleteOverlay} onPress={() => setAutocompleteField(null)}>
              <Pressable style={[s.autocompleteModal, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[s.autocompleteSearch, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                  placeholder={t('Search...')}
                  placeholderTextColor={colors.textMuted}
                  value={autocompleteSearch}
                  onChangeText={setAutocompleteSearch}
                  autoFocus
                />
                <FlatList
                  data={filtered}
                  keyExtractor={o => o.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[s.autocompleteOption, { borderBottomColor: colors.border }]}
                      onPress={() => { setValue(field.name, item.value); setAutocompleteField(null); }}
                    >
                      <Text style={[s.autocompleteOptionText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={[s.autocompleteEmpty, { color: colors.textMuted, textAlign: 'center' }]}>
                      {t('No results')}
                    </Text>
                  }
                  style={{ maxHeight: 300 }}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      );
    }

    if (field.type === 'date') {
      return (
        <View>
          <TouchableOpacity
            style={[s.input, { backgroundColor: colors.surface, borderColor: hasError ? colors.danger : colors.border, justifyContent: 'center' }]}
            onPress={() => setDateField(field.name)}
          >
            <Text style={{ color: values[field.name] ? colors.ink : colors.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
              {values[field.name] ? values[field.name] : (field.placeholder ? t(field.placeholder) : t('Select date...'))}
            </Text>
          </TouchableOpacity>
          {dateField === field.name && (
            <DateTimePicker
              value={parseDate(values[field.name] as string)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
        </View>
      );
    }

    if (field.type === 'select') {
      return (
        <SelectDropdown
          options={field.options || []}
          value={values[field.name] || ''}
          onChange={v => setValue(field.name, v)}
          hasError={hasError}
          translateLabels
        />
      );
    }

    if (field.type === 'chips') {
      return (
        <MultiSelectDropdown
          options={field.options || []}
          value={Array.isArray(values[field.name]) ? values[field.name] : []}
          onChange={v => setValue(field.name, v)}
          hasError={hasError}
        />
      );
    }

    return (
      <TextInput
        style={inputStyle}
        value={values[field.name]?.toString() || ''}
        onChangeText={v => setValue(field.name, field.type === 'number' ? (v ? Number(v) : undefined) : v)}
        placeholder={field.placeholder ? t(field.placeholder) : t(field.labelKey)}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={field.type === 'password'}
        keyboardType={field.keyboardType || (field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : field.type === 'number' ? 'numeric' : 'default')}
        multiline={field.type === 'multiline'}
        numberOfLines={field.type === 'multiline' ? 3 : 1}
        autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
      />
    );
  };

  const renderSection = (section: FormSection, index: number) => (
    <View key={index} style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
        {t(section.titleKey)}
      </Text>
      {section.fields.map(field => (
        <View key={field.name}>
          <Text style={[s.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {t(field.labelKey)}{field.required ? ' *' : ''}
          </Text>
          {renderField(field)}
          {errors[field.name] && (
            <Text style={[s.errorText, { color: colors.danger }]}>{errors[field.name]}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const currentSection = stepper ? sections[step] : null;

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {stepper ? (
            <>
              <View style={[s.stepIndicator, { backgroundColor: colors.surface }]}>
                {sections.map((_, i) => (
                  <View key={i} style={s.stepRow}>
                    <View style={[s.stepDot, { backgroundColor: i <= step ? colors.primary : '#F0F1F3' }]}>
                      <Text style={s.stepDotText}>{i + 1}</Text>
                    </View>
                    {i < sections.length - 1 && (
                      <View style={[s.stepLine, { backgroundColor: i < step ? colors.primary : colors.border }]} />
                    )}
                  </View>
                ))}
              </View>
              {currentSection && renderSection(currentSection, step)}
            </>
          ) : (
            sections.map((section, i) => renderSection(section, i))
          )}
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {stepper && step > 0 && (
          <TouchableOpacity
            style={[s.secondaryBtn, { borderColor: colors.border }]}
            onPress={handlePrev}
          >
            <Text style={[s.secondaryBtnText, { color: colors.ink }]}>{t('Previous')}</Text>
          </TouchableOpacity>
        )}
        {stepper && step < sections.length - 1 ? (
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={s.primaryBtnText}>{t('Next')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={s.primaryBtnText}>{submitting ? t(loadingLabelKey) : t(submitLabelKey)}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  chip: {
    borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chipText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  container: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  errorText: { fontSize: font.sizes.xs, color: '#DF1C41', marginTop: spacing.xs },
  footer: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1,
  },
  input: {
    borderWidth: 1, borderRadius: radii.lg, height: 48, paddingHorizontal: spacing.md,
    fontSize: font.sizes.base, marginBottom: spacing.sm,
  },
  inputMultiline: {
    borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: font.sizes.base, marginBottom: spacing.sm,
    minHeight: 80, textAlignVertical: 'top',
  },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, marginBottom: spacing.xs, marginTop: spacing.sm },
  primaryBtn: {
    flex: 1, height: 48, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  scroll: { flex: 1 },
  secondaryBtn: {
    flex: 1, height: 48, borderRadius: radii.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  sectionCard: {
    borderWidth: 1, borderRadius: radii.xxl, padding: spacing.md,
  },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.md },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  stepDotText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  stepLine: { height: 3, width: 40, borderRadius: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  autocompleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.md },
  autocompleteModal: { borderRadius: radii.xxl, padding: spacing.md, maxHeight: 400 },
  autocompleteSearch: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, height: 44, fontSize: font.sizes.base, marginBottom: spacing.sm },
  autocompleteOption: { paddingVertical: spacing.sm, borderBottomWidth: 1 },
  autocompleteOptionText: { fontSize: font.sizes.base },
  autocompleteEmpty: { paddingVertical: spacing.lg, fontSize: font.sizes.sm },
});
