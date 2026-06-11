import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager } from 'react-native';
import i18n from '../i18n';
import { setLanguageHeader } from '../lib/http';

const LOCALE_KEY = 'anmat.locale';

export type SupportedLocale = 'en' | 'ar';

type LanguageContextValue = {
  locale: SupportedLocale;
  isRTL: boolean;
  setLocale: (locale: SupportedLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(LOCALE_KEY).then((stored) => {
      const detected = i18n.language as SupportedLocale;
      const initial: SupportedLocale = (stored === 'en' || stored === 'ar')
        ? stored
        : (detected === 'ar' ? 'ar' : 'en');
      setLocaleState(initial);
      if (i18n.language !== initial) {
        i18n.changeLanguage(initial);
      }
      setLanguageHeader(initial);
      setLoaded(true);
    });
  }, []);

  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    await SecureStore.setItemAsync(LOCALE_KEY, newLocale);
    i18n.changeLanguage(newLocale);
    setLanguageHeader(newLocale);
    I18nManager.allowRTL(newLocale === 'ar');
    I18nManager.forceRTL(newLocale === 'ar');
  }, []);

  const isRTL = locale === 'ar';

  const value = useMemo(
    () => ({ locale, isRTL, setLocale }),
    [locale, isRTL, setLocale],
  );

  if (!loaded) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLocale() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLocale must be used inside LanguageProvider');
  }
  return context;
}
