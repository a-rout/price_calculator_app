import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { Undo2, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UndoSnackbarProps {
    visible: boolean;
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    duration?: number;
}

/**
 * Toast-style snackbar for undo actions
 * Auto-dismisses after duration
 */
export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
    visible,
    message,
    onUndo,
    onDismiss,
    duration = 5000,
}) => {
    const { theme } = useTheme();
    const { notification } = useHaptics();
    const translateY = useSharedValue(100);
    const opacity = useSharedValue(0);
    const progress = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 200 });
            progress.value = withTiming(1, { duration });
        } else {
            translateY.value = withTiming(100, { duration: 200 });
            opacity.value = withTiming(0, { duration: 200 });
            progress.value = 0;
        }
    }, [visible, duration]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${(1 - progress.value) * 100}%`,
    }));

    const handleUndo = () => {
        notification('success');
        onUndo();
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: theme.isDark ? '#1F1F1F' : '#323232',
                },
                containerAnimatedStyle,
            ]}
        >
            {/* Progress bar */}
            <Animated.View
                style={[
                    styles.progressBar,
                    { backgroundColor: theme.colors.primary },
                    progressAnimatedStyle,
                ]}
            />

            <View style={styles.content}>
                <Text style={styles.message} numberOfLines={1}>
                    {message}
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.undoButton}
                        onPress={handleUndo}
                        activeOpacity={0.7}
                    >
                        <Undo2 size={18} color={theme.colors.primary} />
                        <Text style={[styles.undoText, { color: theme.colors.primary }]}>
                            UNDO
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={onDismiss}
                        activeOpacity={0.7}
                    >
                        <X size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    progressBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    message: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginRight: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    undoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
    },
    undoText: {
        fontSize: 14,
        fontWeight: '700',
    },
    dismissButton: {
        padding: 6,
        opacity: 0.7,
    },
});

export default UndoSnackbar;
