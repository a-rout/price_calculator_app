import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Custom hook for haptic feedback
 * Provides various haptic feedback patterns
 */
export const useHaptics = () => {
    const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

    const impact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        if (!isSupported) return;

        try {
            const impactStyle = {
                light: Haptics.ImpactFeedbackStyle.Light,
                medium: Haptics.ImpactFeedbackStyle.Medium,
                heavy: Haptics.ImpactFeedbackStyle.Heavy,
            }[style];

            await Haptics.impactAsync(impactStyle);
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    };

    const notification = async (type: 'success' | 'warning' | 'error' = 'success') => {
        if (!isSupported) return;

        try {
            const notificationType = {
                success: Haptics.NotificationFeedbackType.Success,
                warning: Haptics.NotificationFeedbackType.Warning,
                error: Haptics.NotificationFeedbackType.Error,
            }[type];

            await Haptics.notificationAsync(notificationType);
        } catch (error) {
            console.warn('Haptic notification failed:', error);
        }
    };

    const selection = async () => {
        if (!isSupported) return;

        try {
            await Haptics.selectionAsync();
        } catch (error) {
            console.warn('Haptic selection failed:', error);
        }
    };

    return {
        impact,
        notification,
        selection,
        isSupported,
    };
};

export default useHaptics;
