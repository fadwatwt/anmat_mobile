import React from 'react';
import { Text, View, StyleSheet, ScrollView, Image, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, spacing, radii } from '../theme';

// Mock data identical to web src/components/TimeLine/TimeLine.jsx
const account = {
  name: 'Ahmed Mohamed',
  imageProfile: 'https://i.pinimg.com/originals/17/9e/25/179e258f61d2d0f56b850b7d85c76493.jpg',
};
const images = [
  'https://mybayutcdn.bayut.com/mybayut/wp-content/uploads/Heydar-Aliyev-Center-Baku-Azerbaijan-ar02072020-1024x640.jpg',
  'https://www.alquds.co.uk/wp-content/uploads/2024/02/07-11.jpg',
  'https://i.cdn.turner.com/dr/cnnarabic/cnnarabic/release/sites/default/files/styles/landscape_780x440/public/image/1_6.JPG?itok=pmNMX7TP',
  'https://cdn.cgway.net/wp-content/uploads/2023/12/the-most-famous-arab-architects-01.jpg',
];
const myAccount = {
  imageProfile: 'https://sowarprofil.com/wp-content/uploads/2024/04/%D8%B5%D9%88%D8%B1%D8%A9-%D8%A7%D9%84%D9%85%D9%84%D9%81-%D8%A7%D9%84%D8%B4%D8%AE%D8%B5%D9%8A-%D9%81%D9%8A-%D8%A7%D9%84%D9%81%D9%8A%D8%B3%D8%A8%D9%88%D9%83-1-1024x1024.png.webp',
};

function ContentOfTimeLine({ withImages = true }: { withImages?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Image source={{ uri: account.imageProfile }} style={s.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={[s.accountName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{account.name}</Text>
          <Text style={[s.dateText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{`25 ${t('Dec')} - 1:30 ${t('PM')}`}</Text>
        </View>
      </View>
      <Text style={[s.bodyText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
        {`We're excited to welcome `}<Text style={{ color: colors.primary }}>@Ahemd</Text>{` to our team! Next month, we'll be unveiling a range of new features designed to elevate your experience with our software. Keep an eye out for more updates!`}
      </Text>
      {withImages && (
        <View style={s.imagesGrid}>
          {images.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={s.gridImage} resizeMode="cover" />
          ))}
        </View>
      )}
      <View style={[s.myAccountRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Image source={{ uri: myAccount.imageProfile }} style={s.myAvatar} />
        <Text style={[s.myAccountText, { color: colors.textMuted }]}>{t('Add a comment...')}</Text>
      </View>
    </View>
  );
}

export default function TimelineScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <ScrollView style={[s.root, { backgroundColor: colors.background }]} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <Text style={[s.title, { color: colors.ink }]}>{t('Timeline')}</Text>
      <View style={[s.timelineContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ScrollView showsVerticalScrollIndicator={false} style={s.innerScroll}>
          <ContentOfTimeLine withImages />
          <View style={{ height: spacing.md }} />
          <ContentOfTimeLine withImages={false} />
        </ScrollView>
        <View style={[s.commentInputRow, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row' }]}>
          <TextInput placeholder={t('Write a comment...')} placeholderTextColor={colors.textMuted} style={[s.commentInput, { color: colors.ink }]} />
          <Pressable style={[s.sendBtn, { backgroundColor: colors.primary }]}>
            <Send size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  accountName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  bodyText: { fontSize: font.sizes.sm, lineHeight: 20, marginTop: spacing.sm },
  commentInput: { flex: 1, fontSize: font.sizes.sm, paddingVertical: spacing.sm },
  commentInputRow: { alignItems: 'center', borderRadius: radii.xl, borderWidth: 1, gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  container: { padding: spacing.md, gap: spacing.md },
  contentCard: { borderRadius: radii.xl, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  dateText: { fontSize: font.sizes.xs },
  gridImage: { width: '48%', height: 80, borderRadius: radii.md },
  headerRow: { alignItems: 'center', gap: spacing.sm },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  innerScroll: { maxHeight: 420 },
  myAccountRow: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  myAccountText: { fontSize: font.sizes.sm },
  myAvatar: { width: 28, height: 28, borderRadius: 14 },
  root: { flex: 1 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timelineContainer: { borderRadius: radii.xl, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, textAlign: 'left', paddingVertical: spacing.sm },
});
