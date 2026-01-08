import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import or from './locales/or.json';

const LANGUAGE_STORAGE_KEY = '@price_calculator_language';

// Define supported languages
export const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

// Get stored language or detect from device
const getInitialLanguage = (): string => {
    // Default to English, will be overridden by stored preference
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    // Check if device locale matches our supported languages
    const supportedLocale = LANGUAGES.find(lang => lang.code === deviceLocale);
    return supportedLocale ? supportedLocale.code : 'en';
};

// Initialize i18n
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            or: { translation: or },
        },
        lng: getInitialLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes by default
        },
        react: {
            useSuspense: false, // Prevents issues with React Native
        },
    });

// Load stored language preference
export const loadStoredLanguage = async (): Promise<void> => {
    try {
        const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLang && LANGUAGES.some(lang => lang.code === storedLang)) {
            await i18n.changeLanguage(storedLang);
        }
    } catch (error) {
        console.error('Error loading stored language:', error);
    }
};

// Change language and persist
export const changeLanguage = async (langCode: LanguageCode): Promise<void> => {
    try {
        await i18n.changeLanguage(langCode);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
    return i18n.language as LanguageCode;
};

export default i18n;
