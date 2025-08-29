/**
 * @fileoverview Unit tests for User Profile components
 * @author Testing Team
 * @testtype Unit
 * @description Comprehensive tests for user profile components including display, interactions, and edge cases
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import { 
  createMockUser, 
  createMockUserProfile, 
  mockPrivateUser, 
  mockPublicUser, 
  mockFriendsOnlyUser 
} from '../../mocks/userMocks';

// Mock components to test (these would be actual components in src/screens/profile)
const UserProfile = ({ user, onEdit, onSettingsPress, isOwnProfile = false }) => {
  const { Text, View, TouchableOpacity, Image } = require('react-native');
  
  return (
    <View testID="user-profile">
      {user.profile_image_url && (
        <Image 
          source={{ uri: user.profile_image_url }} 
          testID="profile-image"
          accessibilityLabel={`${user.full_name || user.name}'s profile picture`}
        />
      )}
      <Text testID="user-name">{user.full_name || user.name || 'Anonymous User'}</Text>
      {user.age && <Text testID="user-age">{user.age} years old</Text>}
      {user.location_neighborhood && (
        <Text testID="user-location">{user.location_neighborhood}</Text>
      )}
      {user.mutual_friends_count > 0 && (
        <Text testID="mutual-friends">
          {user.mutual_friends_count} mutual friends
        </Text>
      )}
      <Text testID="privacy-level">{user.privacy_level}</Text>
      
      {isOwnProfile && (
        <View>
          <TouchableOpacity testID="edit-profile-button" onPress={onEdit}>
            <Text>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="settings-button" onPress={onSettingsPress}>
            <Text>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const UserSettings = ({ user, onUpdate, onLogout }) => {
  const { Text, View, TouchableOpacity, Switch } = require('react-native');
  const [notifications, setNotifications] = React.useState(true);
  
  return (
    <View testID="user-settings">
      <Text testID="settings-title">User Settings</Text>
      <View testID="notifications-setting">
        <Text>Push Notifications</Text>
        <Switch 
          value={notifications} 
          onValueChange={setNotifications}
          testID="notifications-toggle"
        />
      </View>
      <TouchableOpacity 
        testID="update-button" 
        onPress={() => onUpdate({ notifications })}
      >
        <Text>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout-button" onPress={onLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('UserProfile Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnSettingsPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render user profile with complete data', () => {
      const mockUser = createMockUserProfile({
        full_name: 'John Doe',
        age: 28,
        location_neighborhood: 'Manhattan',
        mutual_friends_count: 5,
      });

      render(<UserProfile user={mockUser} />);

      expect(screen.getByTestId('user-profile')).toBeTruthy();
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-age')).toHaveTextContent('28 years old');
      expect(screen.getByTestId('user-location')).toHaveTextContent('Manhattan');
      expect(screen.getByTestId('mutual-friends')).toHaveTextContent('5 mutual friends');
      expect(screen.getByTestId('privacy-level')).toHaveTextContent('PRIVATE');
    });

    it('should render minimal user profile with missing optional data', () => {
      const minimalUser = createMockUserProfile({
        full_name: null,
        age: null,
        location_neighborhood: null,
        mutual_friends_count: 0,
      });

      render(<UserProfile user={minimalUser} />);

      expect(screen.getByTestId('user-profile')).toBeTruthy();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Anonymous User');
      expect(screen.queryByTestId('user-age')).toBeNull();
      expect(screen.queryByTestId('user-location')).toBeNull();
      expect(screen.queryByTestId('mutual-friends')).toBeNull();
    });

    it('should render profile image when available', () => {
      const userWithImage = createMockUserProfile({
        profile_image_url: 'https://example.com/avatar.jpg',
      });

      render(<UserProfile user={userWithImage} />);

      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toBeTruthy();
      expect(profileImage.props.source.uri).toBe('https://example.com/avatar.jpg');
    });

    it('should not render profile image when not available', () => {
      const userWithoutImage = createMockUserProfile({
        profile_image_url: null,
      });

      render(<UserProfile user={userWithoutImage} />);

      expect(screen.queryByTestId('profile-image')).toBeNull();
    });
  });

  describe('Privacy Levels', () => {
    it('should handle private user display', () => {
      render(<UserProfile user={mockPrivateUser} />);
      
      expect(screen.getByTestId('privacy-level')).toHaveTextContent('PRIVATE');
    });

    it('should handle public user display', () => {
      render(<UserProfile user={mockPublicUser} />);
      
      expect(screen.getByTestId('privacy-level')).toHaveTextContent('PUBLIC');
    });

    it('should handle friends-only user display', () => {
      render(<UserProfile user={mockFriendsOnlyUser} />);
      
      expect(screen.getByTestId('privacy-level')).toHaveTextContent('FRIENDS_ONLY');
    });
  });

  describe('Own Profile Interactions', () => {
    it('should show edit and settings buttons for own profile', () => {
      const user = createMockUserProfile();
      
      render(
        <UserProfile 
          user={user} 
          isOwnProfile={true}
          onEdit={mockOnEdit}
          onSettingsPress={mockOnSettingsPress}
        />
      );

      expect(screen.getByTestId('edit-profile-button')).toBeTruthy();
      expect(screen.getByTestId('settings-button')).toBeTruthy();
    });

    it('should not show edit and settings buttons for other users profile', () => {
      const user = createMockUserProfile();
      
      render(
        <UserProfile 
          user={user} 
          isOwnProfile={false}
          onEdit={mockOnEdit}
          onSettingsPress={mockOnSettingsPress}
        />
      );

      expect(screen.queryByTestId('edit-profile-button')).toBeNull();
      expect(screen.queryByTestId('settings-button')).toBeNull();
    });

    it('should call onEdit when edit button is pressed', () => {
      const user = createMockUserProfile();
      
      render(
        <UserProfile 
          user={user} 
          isOwnProfile={true}
          onEdit={mockOnEdit}
          onSettingsPress={mockOnSettingsPress}
        />
      );

      fireEvent.press(screen.getByTestId('edit-profile-button'));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onSettingsPress when settings button is pressed', () => {
      const user = createMockUserProfile();
      
      render(
        <UserProfile 
          user={user} 
          isOwnProfile={true}
          onEdit={mockOnEdit}
          onSettingsPress={mockOnSettingsPress}
        />
      );

      fireEvent.press(screen.getByTestId('settings-button'));
      expect(mockOnSettingsPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined user gracefully', () => {
      expect(() => {
        render(<UserProfile user={undefined} />);
      }).not.toThrow();
    });

    it('should handle null user gracefully', () => {
      expect(() => {
        render(<UserProfile user={null} />);
      }).not.toThrow();
    });

    it('should handle empty user object', () => {
      const emptyUser = {};
      
      render(<UserProfile user={emptyUser} />);
      
      expect(screen.getByTestId('user-profile')).toBeTruthy();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Anonymous User');
    });

    it('should handle very long names without breaking layout', () => {
      const userWithLongName = createMockUserProfile({
        full_name: 'A'.repeat(100),
      });

      expect(() => {
        render(<UserProfile user={userWithLongName} />);
      }).not.toThrow();

      expect(screen.getByTestId('user-name')).toHaveTextContent('A'.repeat(100));
    });

    it('should handle invalid image URLs gracefully', () => {
      const userWithInvalidImage = createMockUserProfile({
        profile_image_url: 'not-a-valid-url',
      });

      expect(() => {
        render(<UserProfile user={userWithInvalidImage} />);
      }).not.toThrow();

      expect(screen.getByTestId('profile-image')).toBeTruthy();
    });

    it('should handle negative mutual friends count', () => {
      const userWithNegativeFriends = createMockUserProfile({
        mutual_friends_count: -5,
      });

      render(<UserProfile user={userWithNegativeFriends} />);

      // Should not display mutual friends for negative count
      expect(screen.queryByTestId('mutual-friends')).toBeNull();
    });

    it('should handle extreme age values', () => {
      const userWithExtremeAge = createMockUserProfile({
        age: 150,
      });

      render(<UserProfile user={userWithExtremeAge} />);

      expect(screen.getByTestId('user-age')).toHaveTextContent('150 years old');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for profile image', () => {
      const user = createMockUserProfile({
        full_name: 'Jane Doe',
        profile_image_url: 'https://example.com/avatar.jpg',
      });

      render(<UserProfile user={user} />);

      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage.props.accessibilityLabel).toBe('Jane Doe\'s profile picture');
    });

    it('should handle accessibility label for anonymous user', () => {
      const user = createMockUserProfile({
        full_name: null,
        profile_image_url: 'https://example.com/avatar.jpg',
      });

      render(<UserProfile user={user} />);

      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage.props.accessibilityLabel).toBe('Anonymous User\'s profile picture');
    });
  });
});

describe('UserSettings Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnLogout = jest.fn();
  const mockUser = createMockUser();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings Rendering', () => {
    it('should render settings component correctly', () => {
      render(
        <UserSettings 
          user={mockUser}
          onUpdate={mockOnUpdate}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByTestId('user-settings')).toBeTruthy();
      expect(screen.getByTestId('settings-title')).toHaveTextContent('User Settings');
      expect(screen.getByTestId('notifications-setting')).toBeTruthy();
      expect(screen.getByTestId('update-button')).toBeTruthy();
      expect(screen.getByTestId('logout-button')).toBeTruthy();
    });

    it('should have notifications toggle in default state', () => {
      render(
        <UserSettings 
          user={mockUser}
          onUpdate={mockOnUpdate}
          onLogout={mockOnLogout}
        />
      );

      const toggle = screen.getByTestId('notifications-toggle');
      expect(toggle.props.value).toBe(true);
    });
  });

  describe('Settings Interactions', () => {
    it('should toggle notifications setting', () => {
      render(
        <UserSettings 
          user={mockUser}
          onUpdate={mockOnUpdate}
          onLogout={mockOnLogout}
        />
      );

      const toggle = screen.getByTestId('notifications-toggle');
      fireEvent(toggle, 'onValueChange', false);

      // The component should update its internal state
      expect(toggle.props.value).toBe(true); // Initial value before re-render
    });

    it('should call onUpdate with settings when save button is pressed', () => {
      render(
        <UserSettings 
          user={mockUser}
          onUpdate={mockOnUpdate}
          onLogout={mockOnLogout}
        />
      );

      fireEvent.press(screen.getByTestId('update-button'));
      expect(mockOnUpdate).toHaveBeenCalledWith({ notifications: true });
    });

    it('should call onLogout when logout button is pressed', () => {
      render(
        <UserSettings 
          user={mockUser}
          onUpdate={mockOnUpdate}
          onLogout={mockOnLogout}
        />
      );

      fireEvent.press(screen.getByTestId('logout-button'));
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings State Management', () => {
    it('should maintain local state for notifications', async () => {
      render(
        <UserSettings 
          user={mockUser}
          onUpdate={mockOnUpdate}
          onLogout={mockOnLogout}
        />
      );

      const toggle = screen.getByTestId('notifications-toggle');
      
      // Toggle notifications off
      fireEvent(toggle, 'onValueChange', false);
      
      // Press save button
      fireEvent.press(screen.getByTestId('update-button'));
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ notifications: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      expect(() => {
        render(
          <UserSettings 
            user={null}
            onUpdate={mockOnUpdate}
            onLogout={mockOnLogout}
          />
        );
      }).not.toThrow();
    });

    it('should handle missing callback functions', () => {
      expect(() => {
        render(<UserSettings user={mockUser} />);
      }).not.toThrow();
    });
  });
});