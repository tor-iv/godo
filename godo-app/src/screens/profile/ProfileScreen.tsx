import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Container } from '../../components/base/Container';
import { ProfileHeader, ProfileContent } from '../../components/profile';
import { spacing } from '../../design/tokens';
import type { User } from '../../types';
import { EventCategory } from '../../types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@gmail.com',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    preferences: {
      categories: [
        EventCategory.NETWORKING,
        EventCategory.CULTURE,
        EventCategory.FOOD,
      ],
      neighborhoods: ['Manhattan', 'Brooklyn', 'Williamsburg'],
    },
  });

  const [stats] = useState({
    eventsAttended: 24,
    eventsSaved: 12,
    friendsConnected: 18,
  });

  useEffect(() => {
    // Store user data in memory for coordination
    const storeUserData = async () => {
      try {
        // This would typically come from an API or local storage
        console.log('User profile loaded:', user.name);
      } catch (error) {
        console.error('Failed to store user data:', error);
      }
    };
    storeUserData();
  }, [user]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleAccountManagement = () => {
    navigation.navigate('AccountManagement');
  };

  const handlePrivacySecurity = () => {
    navigation.navigate('Privacy');
  };

  const handleHelpSupport = () => {
    navigation.navigate('Support');
  };

  const handleImageSelected = (uri: string) => {
    setUser(prev => ({ ...prev, avatar: uri }));
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          // Handle logout logic
          console.log('User signed out');
        },
      },
    ]);
  };

  return (
    <Container>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          onEditProfile={handleEditProfile}
          onSettings={handleSettings}
          onImageSelected={handleImageSelected}
        />

        {/* Profile Content */}
        <ProfileContent
          user={user}
          stats={stats}
          onAccountManagement={handleAccountManagement}
          onPrivacySecurity={handlePrivacySecurity}
          onHelpSupport={handleHelpSupport}
          onLogout={handleLogout}
        />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[12],
  },
});
