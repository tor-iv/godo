import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing, shadows } from '../design';
import { CalendarStackNavigator } from './CalendarStackNavigator';
import { DiscoverStackNavigator } from './DiscoverStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'calendar';
          let accessibilityLabel: string = '';

          if (route.name === 'Calendar') {
            iconName = 'calendar';
            accessibilityLabel = 'Calendar tab';
          } else if (route.name === 'Discover') {
            iconName = 'compass';
            accessibilityLabel = 'Discover events tab';
          } else if (route.name === 'Profile') {
            iconName = 'user';
            accessibilityLabel = 'Profile tab';
          }

          return (
            <Feather
              name={iconName}
              size={24}
              color={color}
              accessibilityLabel={accessibilityLabel}
            />
          );
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.neutral[0],
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.neutral[800],
        },
        headerShadowVisible: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: spacing[1],
        },
        tabBarStyle: {
          backgroundColor: colors.neutral[0],
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
          paddingTop: spacing[2],
          paddingBottom: insets.bottom,
          height: layout.tabBarHeight + insets.bottom,
        },
        tabBarItemStyle: {
          paddingVertical: spacing[2],
        },
      })}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarStackNavigator}
        options={{
          tabBarLabel: 'Calendar',
          headerShown: false, // Stack navigator handles headers
          tabBarAccessibilityLabel:
            'Calendar. View your saved events and calendar',
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        options={{
          tabBarLabel: 'Discover',
          headerShown: false, // Stack navigator handles headers
          tabBarAccessibilityLabel: 'Discover. Find new events to attend',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          headerShown: false, // Profile stack will handle its own headers
          tabBarAccessibilityLabel:
            'Profile. View and manage your profile settings',
        }}
      />
    </Tab.Navigator>
  );
};
