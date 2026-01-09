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
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 75 : 65,
          position: 'absolute',
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 0,
          marginBottom: Platform.OS === 'ios' ? 0 : 8,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.calculator'),
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 6,
              borderRadius: 10,
              backgroundColor: focused
                ? theme.isDark
                  ? 'rgba(129, 140, 248, 0.2)'
                  : 'rgba(99, 102, 241, 0.12)'
                : 'transparent',
            }}>
              <Calculator size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
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
              padding: 6,
              borderRadius: 10,
              backgroundColor: focused
                ? theme.isDark
                  ? 'rgba(129, 140, 248, 0.2)'
                  : 'rgba(99, 102, 241, 0.12)'
                : 'transparent',
            }}>
              <Package size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}