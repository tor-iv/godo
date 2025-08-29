import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing, shadows } from '../design';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { MyEventsScreen } from '../screens/calendar/MyEventsScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Calendar') {
            iconName = 'calendar';
          } else if (route.name === 'Discover') {
            iconName = 'compass';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={24} color={color} />;
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
          borderTopColor: colors.neutral[100],
          paddingTop: spacing[2],
          paddingBottom: insets.bottom,
          height: layout.tabBarHeight + insets.bottom,
          ...Platform.select({
            ios: shadows.medium,
            android: {
              elevation: 8,
              shadowColor: colors.neutral[900],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
          }),
        },
        tabBarItemStyle: {
          paddingVertical: spacing[2],
        },
      })}
    >
      <Tab.Screen
        name="Calendar"
        component={MyEventsScreen}
        options={{
          tabBarLabel: 'Calendar',
          headerTitle: 'My Calendar',
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          headerTitle: 'Discover Events',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          headerShown: false, // Profile stack will handle its own headers
        }}
      />
    </Tab.Navigator>
  );
};
