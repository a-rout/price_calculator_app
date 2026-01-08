import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Trash2, Edit3 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    enabled?: boolean;
}

/**
 * Swipeable row component for list items
 * Swipe left to reveal delete, swipe right to reveal edit
 */
export const SwipeableRow: React.FC<SwipeableRowProps> = ({
    children,
    onDelete,
    onEdit,
    enabled = true,
}) => {
    const { theme } = useTheme();
    const { impact, notification } = useHaptics();
    const translateX = useRef(new Animated.Value(0)).current;
    const lastOffset = useRef(0);

    const resetPosition = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
        }).start();
        lastOffset.current = 0;
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return enabled && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderGrant: () => {
                translateX.extractOffset();
                impact('light');
            },
            onPanResponderMove: (_, gestureState) => {
                // Limit swipe distance
                const newValue = Math.max(
                    -ACTION_WIDTH,
                    Math.min(ACTION_WIDTH, gestureState.dx)
                );
                translateX.setValue(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                translateX.flattenOffset();

                if (gestureState.dx < -SWIPE_THRESHOLD && onDelete) {
                    // Swipe left - show delete
                    Animated.spring(translateX, {
                        toValue: -ACTION_WIDTH,
                        useNativeDriver: true,
                        friction: 8,
                    }).start();
                    notification('warning');
                } else if (gestureState.dx > SWIPE_THRESHOLD && onEdit) {
                    // Swipe right - show edit
                    Animated.spring(translateX, {
                        toValue: ACTION_WIDTH,
                        useNativeDriver: true,
                        friction: 8,
                    }).start();
                    impact('medium');
                } else {
                    resetPosition();
                }
            },
        })
    ).current;

    const handleDelete = () => {
        notification('error');
        resetPosition();
        onDelete?.();
    };

    const handleEdit = () => {
        impact('medium');
        resetPosition();
        onEdit?.();
    };

    return (
        <View style={styles.container}>
            {/* Left action (Edit) */}
            {onEdit && (
                <TouchableOpacity
                    style={[styles.action, styles.editAction, { backgroundColor: theme.colors.primary }]}
                    onPress={handleEdit}
                    activeOpacity={0.8}
                >
                    <Edit3 size={22} color="#FFFFFF" />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
            )}

            {/* Right action (Delete) */}
            {onDelete && (
                <TouchableOpacity
                    style={[styles.action, styles.deleteAction, { backgroundColor: theme.colors.error }]}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                >
                    <Trash2 size={22} color="#FFFFFF" />
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
            )}

            {/* Main content */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.content,
                    {
                        backgroundColor: theme.colors.surface,
                        transform: [{ translateX }],
                    },
                ]}
            >
                {children}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    content: {
        zIndex: 1,
    },
    action: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: ACTION_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAction: {
        left: 0,
    },
    deleteAction: {
        right: 0,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default SwipeableRow;
