import { Tabs } from 'expo-router';
import { Calculator, Package } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Custom tab bar background with blur effect on iOS
  const TabBarBackground = () => {
    if (Platform.OS === 'ios') {
      return (
        <BlurView
          intensity={80}
          tint={theme.isDark ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      );
    }
    return null;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios'
            ? 'transparent'
            : theme.colors.surface,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 88 : 68,
          position: 'absolute',
          elevation: 0,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.calculator'),
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: focused
                ? theme.isDark
                  ? 'rgba(129, 140, 248, 0.2)'
                  : 'rgba(99, 102, 241, 0.1)'
                : 'transparent',
            }}>
              <Calculator size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: t('tabs.items'),
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: focused
                ? theme.isDark
                  ? 'rgba(129, 140, 248, 0.2)'
                  : 'rgba(99, 102, 241, 0.1)'
                : 'transparent',
            }}>
              <Package size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}