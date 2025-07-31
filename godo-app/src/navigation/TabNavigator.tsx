import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { RootTabParamList } from '../types/navigation';
import DiscoverStack from './DiscoverStack';
import MyEventsStack from './MyEventsStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Discover') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'MyEvents') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY_PURPLE,
        tabBarInactiveTintColor: COLORS.TEXT_LIGHT,
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopColor: COLORS.LIGHT_PURPLE,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStack}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name="MyEvents" 
        component={MyEventsStack}
        options={{ tabBarLabel: 'My Events' }}
      />
    </Tab.Navigator>
  );
}