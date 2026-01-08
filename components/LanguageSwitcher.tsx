import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor,
} from 'react-native-reanimated';
import { Globe } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LANGUAGES, changeLanguage, type LanguageCode } from '@/i18n';
import { useHaptics } from '@/hooks/useHaptics';

interface LanguageSwitcherProps {
    compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
    const { theme } = useTheme();
    const { i18n } = useTranslation();
    const { selection } = useHaptics();

    const currentLang = i18n.language as LanguageCode;
    const isOdia = currentLang === 'or';

    const togglePosition = useSharedValue(isOdia ? 1 : 0);

    const handleToggle = async () => {
        selection();
        const newLang: LanguageCode = currentLang === 'en' ? 'or' : 'en';
        togglePosition.value = withSpring(newLang === 'or' ? 1 : 0, {
            damping: 15,
            stiffness: 200,
        });
        await changeLanguage(newLang);
    };

    const toggleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: togglePosition.value * 36 }],
    }));

    const styles = createStyles(theme);

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactContainer}
                onPress={handleToggle}
                activeOpacity={0.7}
            >
                <Globe size={16} color={theme.colors.textMuted} />
                <Text style={styles.compactText}>
                    {isOdia ? 'ଓଡ଼ିଆ' : 'EN'}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handleToggle}
            activeOpacity={0.8}
        >
            <View style={styles.toggleTrack}>
                <Animated.View style={[styles.toggleThumb, toggleAnimatedStyle]} />
                <View style={styles.labelsContainer}>
                    <Text style={[
                        styles.label,
                        !isOdia && styles.labelActive,
                    ]}>EN</Text>
                    <Text style={[
                        styles.label,
                        isOdia && styles.labelActive,
                    ]}>ଓ</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    toggleTrack: {
        width: 72,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceVariant,
        padding: 3,
        position: 'relative',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    toggleThumb: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        top: 3,
        left: 3,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    labelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        height: '100%',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textMuted,
        width: 30,
        textAlign: 'center',
    },
    labelActive: {
        color: '#FFFFFF',
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    compactText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
});
