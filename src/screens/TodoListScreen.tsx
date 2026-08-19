import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Check, Trash2, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { font, radii, spacing } from '../theme';

type TodoItem = { id: string; title: string; done: boolean };

export default function TodoListScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [items, setItems] = useState<TodoItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<TodoItem | null>(null);
  const [textInput, setTextInput] = useState('');

  const addItem = () => {
    if (!textInput.trim()) return;
    setItems(prev => [...prev, { id: Date.now().toString(), title: textInput.trim(), done: false }]);
    setTextInput('');
    setAddOpen(false);
  };

  const saveEdit = () => {
    if (!textInput.trim() || !editItem) return;
    setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, title: textInput.trim() } : i));
    setTextInput('');
    setEditItem(null);
  };

  const toggleDone = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const deleteItem = (id: string) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: () => setItems(prev => prev.filter(i => i.id !== id)) },
    ]);
  };

  const openEdit = (item: TodoItem) => {
    setEditItem(item);
    setTextInput(item.title);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={items.length === 0 ? s.emptyList : s.list}
        ListEmptyComponent={<EmptyState title={t('No tasks yet')} message={t('Add a personal todo item')} />}
        renderItem={({ item }) => (
          <View style={[s.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable onPress={() => toggleDone(item.id)} style={[s.checkbox, { borderColor: item.done ? colors.primary : colors.border, backgroundColor: item.done ? colors.primary : 'transparent' }]}>
              {item.done && <Check size={14} color="#FFF" />}
            </Pressable>
            <Text style={[s.title, { color: colors.ink, textDecorationLine: item.done ? 'line-through' : 'none', opacity: item.done ? 0.5 : 1, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Pressable onPress={() => openEdit(item)} hitSlop={8} style={s.actionBtn}>
              <Pencil size={16} color={colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => deleteItem(item.id)} hitSlop={8} style={s.actionBtn}>
              <Trash2 size={16} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      <Pressable style={[s.fab, { backgroundColor: colors.primary }]} onPress={() => { setTextInput(''); setAddOpen(true); }}>
        <Plus size={24} color="#FFF" />
      </Pressable>

      <Modal visible={addOpen} onClose={() => setAddOpen(false)} title={t('Adding a To Do list item')} size="sm">
        <TextInput
          style={[s.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('Enter To Do Title')}
          placeholderTextColor={colors.textMuted}
          value={textInput}
          onChangeText={setTextInput}
          autoFocus
        />
        <Button label={t('Add')} onPress={addItem} />
      </Modal>

      <Modal visible={!!editItem} onClose={() => setEditItem(null)} title={t('Edit To Do')} size="sm">
        <TextInput
          style={[s.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('Enter To Do Title')}
          placeholderTextColor={colors.textMuted}
          value={textInput}
          onChangeText={setTextInput}
          autoFocus
        />
        <Button label={t('Save')} onPress={saveEdit} />
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  actionBtn: { padding: spacing.xs, minHeight: 44, minWidth: 44 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  emptyList: { flexGrow: 1 },
  fab: { position: 'absolute', bottom: spacing.xl, end: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  input: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, fontSize: font.sizes.sm },
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.xl, padding: spacing.md, gap: spacing.sm },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  title: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
