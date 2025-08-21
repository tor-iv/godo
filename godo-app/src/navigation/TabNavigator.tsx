import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { MyEventsScreen } from '../screens/calendar/MyEventsScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          if (route.name === 'Discover') {
            iconName = 'compass';
          } else if (route.name === 'MyEvents') {
            iconName = 'calendar';
          }
          
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#71717A',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          paddingTop: 8,
          height: 80,
        },
      })}
    >
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name="MyEvents" 
        component={MyEventsScreen} 
        options={{ tabBarLabel: 'My Events' }}
      />
    </Tab.Navigator>
  );
};