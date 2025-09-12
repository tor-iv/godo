import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../design/tokens';
import type { Event } from '../types';

// Screens
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  EventDetail: { event: Event };
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export const DiscoverStackNavigator = () => {
  const headerStyles = {
    headerStyle: {
      backgroundColor: colors.neutral[0],
    },
    headerTitleStyle: {
      ...typography.h2,
      color: colors.neutral[800],
    },
    headerTintColor: colors.primary[500],
    headerShadowVisible: false,
  };

  const getBackButton = (navigation: any) => ({
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          padding: 8,
          marginLeft: -8,
        }}
      >
        <Feather name="chevron-left" size={24} color={colors.primary[500]} />
      </TouchableOpacity>
    ),
  });

  return (
    <Stack.Navigator
      initialRouteName="DiscoverHome"
      screenOptions={{
        ...headerStyles,
      }}
    >
      <Stack.Screen
        name="DiscoverHome"
        component={DiscoverScreen}
        options={{
          headerShown: false, // DiscoverScreen handles its own header
        }}
      />

      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={({ navigation }) => ({
          title: 'Event Details',
          ...getBackButton(navigation),
        })}
      />
    </Stack.Navigator>
  );
};
