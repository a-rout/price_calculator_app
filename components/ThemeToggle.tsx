import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Sun, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * Animated theme toggle button with haptic feedback
 */
export const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { impact } = useHaptics();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleToggle = async () => {
    // Trigger haptic feedback
    await impact('light');

    // Animate rotation and scale
    rotation.value = withSequence(
      withSpring(rotation.value + 180, { damping: 12, stiffness: 100 })
    );
    scale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    toggleTheme();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const iconOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      rotation.value % 360,
      [0, 180],
      [1, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.8}
      style={styles.container}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <LinearGradient
          colors={isDark
            ? ['#1E293B', '#334155']
            : ['#FEF3C7', '#FDE68A']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View style={iconOpacity}>
            {isDark ? (
              <Moon size={20} color="#818CF8" strokeWidth={2} />
            ) : (
              <Sun size={20} color="#F59E0B" strokeWidth={2} />
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeToggle;