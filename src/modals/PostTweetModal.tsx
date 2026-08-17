import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ImagePlus, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { postTweetSingle, LocalFile, TwitterAccount } from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  accounts: TwitterAccount[];
};

export function PostTweetModal({ visible, onClose, accounts }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [images, setImages] = useState<LocalFile[]>([]);
  const [posting, setPosting] = useState(false);

  const options = accounts.map((a) => ({ label: a.AccountDataInfo1?.FullName || a.name, value: a.name }));

  useEffect(() => {
    if (!visible) return;
    setSelected([]);
    setText('');
    setImages([]);
  }, [visible]);

  const pickImages = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true, copyToCacheDirectory: true });
    if (result.canceled || result.assets.length === 0) return;
    const picked = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'image/jpeg',
    }));
    setImages((prev) => [...prev, ...picked]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one account'));
      return;
    }
    if (!text.trim()) {
      Alert.alert(t('Required'), t('Tweet text is required'));
      return;
    }
    setPosting(true);
    try {
      const results = await Promise.allSettled(
        selected.map((name) => postTweetSingle(name, text.trim(), images)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const succeeded = results.length - failed;
      if (failed === 0) {
        Alert.alert(t('Success'), t('Tweet posted to {{count}} account(s)', { count: succeeded }));
        onClose();
      } else if (succeeded === 0) {
        Alert.alert(t('Error'), t('Failed to post on all selected accounts'));
      } else {
        Alert.alert(t('Warning'), t('Posted on {{succeeded}} account(s). {{failed}} failed.', { succeeded, failed }));
      }
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={t('Post')} size="md">
      <View style={styles.form}>
        <MultiSelectDropdown
          label={t('Post from accounts')}
          required
          options={options}
          value={selected}
          onChange={setSelected}
          placeholder={t('Select Accounts')}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Post description')} *</Text>
          <TextInput
            style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
            placeholder={t("What's happening?")}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={280}
          />
          <Text style={[styles.counter, { color: colors.textMuted, textAlign: align }]}>{text.length}/280</Text>
        </View>

        <View style={styles.field}>
          <TouchableOpacity style={styles.addImage} onPress={pickImages} activeOpacity={0.7}>
            <ImagePlus size={18} color={colors.primary} />
            <Text style={[styles.addImageText, { color: colors.primary }]}>{t('Add image')}</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <View style={styles.thumbRow}>
              {images.map((img, idx) => (
                <View key={idx} style={[styles.thumbWrap, { borderColor: colors.border }]}>
                  <Image source={{ uri: img.uri }} style={styles.thumb} />
                  <TouchableOpacity
                    style={styles.thumbRemove}
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    hitSlop={6}
                  >
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Button
          label={posting ? t('Posting...') : t('Apply')}
          onPress={handleSubmit}
          loading={posting}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addImage: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  addImageText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  counter: { fontSize: font.sizes.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, minHeight: 100, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  thumb: { height: 64, width: 64 },
  thumbRemove: { alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.9)', borderRadius: 10, height: 20, justifyContent: 'center', position: 'absolute', right: 2, top: 2, width: 20 },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumbWrap: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
});
