import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { FormScreen } from '../generators/FormScreen';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

export default function ProjectCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const sections = [
    {
      titleKey: 'Project Information',
      fields: [
        { name: 'name', labelKey: 'Project Name', type: 'text' as const, required: true, placeholder: 'Enter project name' },
        { name: 'description', labelKey: 'Description', type: 'multiline' as const, placeholder: 'Enter project description' },
      ],
    },
    {
      titleKey: 'Timeline',
      fields: [
        { name: 'startDate', labelKey: 'Start Date', type: 'date' as const },
        { name: 'endDate', labelKey: 'End Date', type: 'date' as const },
      ],
    },
  ];

  const handleSubmit = async () => {
    Alert.alert(t('Coming soon'), t('Create project feature coming soon'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.ink, marginLeft: spacing.md, textAlign: isRTL ? 'right' : 'left' }}>
          {t('New Project')}
        </Text>
      </View>
      <FormScreen sections={sections} onSubmit={handleSubmit} />
    </View>
  );
}
