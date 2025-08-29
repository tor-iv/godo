import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../design/tokens';
import type { ProfileStackParamList } from '../types';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { ProfileEditForm } from '../screens/profile/ProfileEditForm';
import { AccountManagement } from '../screens/profile/AccountManagement';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => {
  const insets = useSafeAreaInsets();

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
      initialRouteName="ProfileHome"
      screenOptions={{
        ...headerStyles,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EditProfile"
        component={ProfileEditForm}
        options={({ navigation }) => ({
          title: 'Edit Profile',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: 'Settings',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="AccountManagement"
        component={AccountManagement}
        options={({ navigation }) => ({
          title: 'Account',
          ...getBackButton(navigation),
        })}
      />

      {/* Placeholder screens for additional profile-related screens */}
      {/* These would be implemented as needed */}
      <Stack.Screen
        name="ChangeEmail"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Change Email',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Change Password',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="ChangePhoneNumber"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Change Phone',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="TwoFactorAuth"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Two-Factor Auth',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="SubscriptionManagement"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Subscription',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="BillingHistory"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Billing History',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="StorageManagement"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Storage',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="ConnectedApps"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Connected Apps',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="PrivacySettings"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Privacy',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="ProfileVisibility"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Profile Visibility',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="LanguageSelection"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Language',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="DataExport"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Export Data',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="DeleteAccount"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Delete Account',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="DeleteAccountConfirmation"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Confirm Deletion',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="Security"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Security',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="Terms"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Terms of Service',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="PrivacyPolicy"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Privacy Policy',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="Support"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Help & Support',
          ...getBackButton(navigation),
        })}
      />

      <Stack.Screen
        name="Privacy"
        component={ProfileScreen} // Placeholder
        options={({ navigation }) => ({
          title: 'Privacy & Security',
          ...getBackButton(navigation),
        })}
      />
    </Stack.Navigator>
  );
};
