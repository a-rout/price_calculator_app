import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, ShoppingBag, Calculator, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AnimatedEmptyStateProps {
    title: string;
    description: string;
    icon?: 'package' | 'shopping' | 'calculator';
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Animated empty state component with floating icon effect
 */
export const AnimatedEmptyState: React.FC<AnimatedEmptyStateProps> = ({
    title,
    description,
    icon = 'package',
    actionLabel,
    onAction,
}) => {
    const { theme } = useTheme();
    const floatY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Entrance animation
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });
        opacity.value = withTiming(1, { duration: 500 });

        // Floating animation
        floatY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: floatY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const IconComponent = {
        package: Package,
        shopping: ShoppingBag,
        calculator: Calculator,
    }[icon];

    const gradientColors: readonly [string, string, ...string[]] = theme.isDark
        ? ['#6366F1', '#8B5CF6', '#A855F7']
        : ['#3B82F6', '#6366F1', '#8B5CF6'];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBackground}
                >
                    <IconComponent size={48} color="#FFFFFF" strokeWidth={1.5} />
                </LinearGradient>
            </Animated.View>

            <Animated.View style={contentAnimatedStyle}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                    {description}
                </Text>

                {actionLabel && onAction && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onAction}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionGradient}
                        >
                            <Plus size={20} color="#FFFFFF" />
                            <Text style={styles.actionText}>{actionLabel}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconBackground: {
        width: 100,
        height: 100,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    actionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AnimatedEmptyState;
