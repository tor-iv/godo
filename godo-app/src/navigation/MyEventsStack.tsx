import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants';
import { MyEventsStackParamList } from '../types/navigation';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import SavedEventsScreen from '../screens/calendar/SavedEventsScreen';
import LikedEventsScreen from '../screens/calendar/LikedEventsScreen';
import EventDetailScreen from '../screens/common/EventDetailScreen';

const Stack = createStackNavigator<MyEventsStackParamList>();

export default function MyEventsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.PRIMARY_PURPLE,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'My Events' }}
      />
      <Stack.Screen 
        name="SavedEvents" 
        component={SavedEventsScreen}
        options={{ title: 'Saved for Later' }}
      />
      <Stack.Screen 
        name="LikedEvents" 
        component={LikedEventsScreen}
        options={{ title: 'Liked Events' }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        options={{ title: 'Event Details' }}
      />
    </Stack.Navigator>
  );
}