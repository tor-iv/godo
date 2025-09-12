/**
 * Error State Components
 * Reusable error display components for different scenarios
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Base Error State Props
 */
interface BaseErrorStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  showIcon?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

/**
 * Generic Error State Component
 */
export const ErrorState: React.FC<BaseErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  actionText = 'Try Again',
  onAction,
  style,
  titleStyle,
  messageStyle,
  showIcon = true,
  iconName = 'alert-circle-outline',
  iconColor = '#e74c3c',
}) => {
  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons
          name={iconName}
          size={64}
          color={iconColor}
          style={styles.icon}
        />
      )}

      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <Text style={[styles.message, messageStyle]}>{message}</Text>

      {onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Network Error State
 */
export const NetworkErrorState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="No Internet Connection"
      message="Please check your connection and try again."
      iconName="wifi-outline"
      iconColor="#f39c12"
    />
  );
};

/**
 * Empty State Component
 */
export const EmptyState: React.FC<BaseErrorStateProps> = ({
  title = 'No data available',
  message = 'There are no items to display at the moment.',
  actionText = 'Refresh',
  onAction,
  style,
  titleStyle,
  messageStyle,
  showIcon = true,
  iconName = 'folder-open-outline',
  iconColor = '#95a5a6',
}) => {
  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons
          name={iconName}
          size={64}
          color={iconColor}
          style={styles.icon}
        />
      )}

      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <Text style={[styles.message, messageStyle]}>{message}</Text>

      {onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * No Events State
 */
export const NoEventsState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <EmptyState
      {...props}
      title="No Events Found"
      message="We couldn't find any events matching your criteria. Try adjusting your filters or check back later."
      iconName="calendar-outline"
      actionText="Clear Filters"
    />
  );
};

/**
 * No Search Results State
 */
export const NoSearchResultsState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'> & {
    query?: string;
  }
> = ({ query, ...props }) => {
  return (
    <EmptyState
      {...props}
      title="No Results Found"
      message={
        query
          ? `No events found for "${query}". Try different keywords.`
          : 'No search results to display.'
      }
      iconName="search-outline"
      actionText="Clear Search"
    />
  );
};

/**
 * Permission Denied State
 */
export const PermissionDeniedState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="Permission Required"
      message="This feature requires additional permissions. Please grant access in your device settings."
      iconName="lock-closed-outline"
      iconColor="#e67e22"
      actionText="Open Settings"
    />
  );
};

/**
 * Authentication Required State
 */
export const AuthRequiredState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="Sign In Required"
      message="Please sign in to access this feature and sync your data across devices."
      iconName="person-outline"
      iconColor="#3498db"
      actionText="Sign In"
    />
  );
};

/**
 * Server Error State
 */
export const ServerErrorState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="Server Error"
      message="We're experiencing technical difficulties. Please try again in a few moments."
      iconName="server-outline"
      iconColor="#e74c3c"
    />
  );
};

/**
 * Offline State
 */
export const OfflineState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="You're Offline"
      message="Some features may be limited while offline. Connect to the internet for the full experience."
      iconName="cloud-offline-outline"
      iconColor="#34495e"
      actionText="Retry"
    />
  );
};

/**
 * Maintenance State
 */
export const MaintenanceState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="Under Maintenance"
      message="We're currently performing maintenance to improve your experience. Please check back soon."
      iconName="construct-outline"
      iconColor="#f39c12"
      actionText="Check Again"
    />
  );
};

/**
 * Rate Limited State
 */
export const RateLimitedState: React.FC<
  Omit<BaseErrorStateProps, 'title' | 'message' | 'iconName'>
> = props => {
  return (
    <ErrorState
      {...props}
      title="Too Many Requests"
      message="You're making requests too quickly. Please wait a moment and try again."
      iconName="hourglass-outline"
      iconColor="#e67e22"
      actionText="Wait and Retry"
    />
  );
};

/**
 * Generic API Error Handler
 */
interface ApiErrorStateProps extends BaseErrorStateProps {
  error: any;
}

export const ApiErrorState: React.FC<ApiErrorStateProps> = ({
  error,
  ...props
}) => {
  // Determine error type and show appropriate component
  if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
    return <NetworkErrorState {...props} />;
  }

  if (error?.statusCode === 401 || error?.code === 'AUTH_REQUIRED') {
    return <AuthRequiredState {...props} />;
  }

  if (error?.statusCode === 403) {
    return <PermissionDeniedState {...props} />;
  }

  if (error?.statusCode === 429 || error?.code === 'RATE_LIMITED') {
    return <RateLimitedState {...props} />;
  }

  if (error?.statusCode >= 500 || error?.code === 'SERVER_ERROR') {
    return <ServerErrorState {...props} />;
  }

  // Default error state
  return (
    <ErrorState
      {...props}
      title="Something went wrong"
      message={
        error?.message || 'An unexpected error occurred. Please try again.'
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
