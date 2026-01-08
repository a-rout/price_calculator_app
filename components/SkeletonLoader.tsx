import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonLoaderProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
    variant?: 'rectangle' | 'circle' | 'text';
}

/**
 * Skeleton loader component with shimmer animation
 * Used as placeholder while content is loading
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
    variant = 'rectangle',
}) => {
    const { theme } = useTheme();
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1200 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmer.value,
            [0, 1],
            [-100, 100]
        );

        return {
            transform: [{ translateX }],
        };
    });

    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'circle':
                return {
                    width: height,
                    height: height,
                    borderRadius: height / 2,
                };
            case 'text':
                return {
                    width: width,
                    height: height,
                    borderRadius: 4,
                };
            default:
                return {
                    width: width,
                    height: height,
                    borderRadius: borderRadius,
                };
        }
    };

    return (
        <View
            style={[
                styles.container,
                getVariantStyles(),
                {
                    backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.08)',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        backgroundColor: theme.isDark
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.8)',
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

interface SkeletonGroupProps {
    count?: number;
    spacing?: number;
    style?: ViewStyle;
}

/**
 * Group of skeleton text lines
 */
export const SkeletonTextGroup: React.FC<SkeletonGroupProps> = ({
    count = 3,
    spacing = 8,
    style,
}) => {
    return (
        <View style={style}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonLoader
                    key={index}
                    variant="text"
                    width={index === count - 1 ? '60%' : '100%'}
                    height={14}
                    style={{ marginBottom: index < count - 1 ? spacing : 0 }}
                />
            ))}
        </View>
    );
};

/**
 * Skeleton card placeholder
 */
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.skeletonCard,
                {
                    backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.04)',
                },
                style,
            ]}
        >
            <View style={styles.cardHeader}>
                <SkeletonLoader variant="circle" height={40} />
                <View style={styles.cardHeaderText}>
                    <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width="40%" height={12} />
                </View>
            </View>
            <SkeletonTextGroup count={2} style={{ marginTop: 16 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
        opacity: 0.5,
    },
    skeletonCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: 12,
    },
});

export default SkeletonLoader;
