import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(isDark ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark, animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceVariant, theme.colors.primary],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.border }]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.toggle,
          {
            backgroundColor,
            transform: [{ translateX }],
          },
        ]}
      >
        {isDark ? (
          <Moon size={14} color={theme.colors.onPrimary} strokeWidth={2} />
        ) : (
          <Sun size={14} color={theme.colors.text} strokeWidth={2} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});