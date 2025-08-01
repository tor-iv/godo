import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants';
import { DiscoverStackParamList } from '../types/navigation';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import EventDetailScreen from '../screens/common/EventDetailScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';

const Stack = createStackNavigator<DiscoverStackParamList>();

export default function DiscoverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.SECONDARY,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="DiscoverFeed" 
        component={DiscoverScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        options={{ title: 'Event Details' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}