import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { subscribeProcessing } from '../lib/http';
import { useTheme } from './ThemeContext';
import { font, radii, spacing } from '../theme';

type ProcessingContextValue = {
  // Manually show/hide the overlay with a custom message (e.g. long local work).
  showProcessing: (message?: string) => void;
  hideProcessing: () => void;
  isProcessing: boolean;
};

const ProcessingContext = createContext<ProcessingContextValue | undefined>(undefined);

// Small delay before showing the overlay so very fast requests don't flash it.
const SHOW_DELAY_MS = 250;

export function ProcessingProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [manualOpen, setManualOpen] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | undefined>();
  const [autoActive, setAutoActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drive the auto state from in-flight mutating HTTP requests.
  useEffect(() => {
    return subscribeProcessing((pending) => setAutoActive(pending > 0));
  }, []);

  const active = manualOpen || autoActive;

  // Debounce showing; hide immediately when nothing is pending.
  useEffect(() => {
    if (active) {
      if (showTimer.current) return;
      showTimer.current = setTimeout(() => {
        setVisible(true);
        showTimer.current = null;
      }, SHOW_DELAY_MS);
    } else {
      if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      setVisible(false);
    }
    return () => {
      if (!active && showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
      }
    };
  }, [active]);

  const showProcessing = useCallback((message?: string) => {
    setManualMessage(message);
    setManualOpen(true);
  }, []);

  const hideProcessing = useCallback(() => {
    setManualOpen(false);
    setManualMessage(undefined);
  }, []);

  const value = useMemo(
    () => ({ showProcessing, hideProcessing, isProcessing: active }),
    [showProcessing, hideProcessing, active],
  );

  const message = manualOpen ? manualMessage : undefined;

  return (
    <ProcessingContext.Provider value={value}>
      {children}
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.text, { color: colors.ink }]}>
              {t(message || 'Processing...')}
            </Text>
          </View>
        </View>
      </Modal>
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used inside ProcessingProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 200,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  text: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
});
