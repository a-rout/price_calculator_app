import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface GlassCardProps {
    children: React.ReactNode;
    intensity?: number;
    style?: ViewStyle;
    blurEnabled?: boolean;
}

/**
 * A card component with glassmorphism effect
 * Uses blur on iOS and semi-transparent background on Android
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    intensity = 50,
    style,
    blurEnabled = true,
}) => {
    const { theme } = useTheme();

    // BlurView works best on iOS, use fallback for Android
    const useBlur = Platform.OS === 'ios' && blurEnabled;

    if (useBlur) {
        return (
            <BlurView
                intensity={intensity}
                tint={theme.isDark ? 'dark' : 'light'}
                style={[
                    styles.card,
                    {
                        borderColor: theme.isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.5)',
                        overflow: 'hidden',
                    },
                    style,
                ]}
            >
                <View style={styles.content}>{children}</View>
            </BlurView>
        );
    }

    // Fallback for Android - semi-transparent background
    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.isDark
                        ? 'rgba(30, 30, 30, 0.85)'
                        : 'rgba(255, 255, 255, 0.85)',
                    borderColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.5)',
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    content: {
        // Content inherits padding from card
    },
});

export default GlassCard;
