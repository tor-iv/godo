/**
 * Loading State Components
 * Reusable loading indicators and skeleton screens
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

/**
 * Props for LoadingSpinner
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
  messageStyle?: TextStyle;
}

/**
 * Loading Spinner Component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#3498db',
  message,
  style,
  messageStyle,
}) => {
  return (
    <View style={[styles.spinnerContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.loadingMessage, messageStyle]}>{message}</Text>
      )}
    </View>
  );
};

/**
 * Props for SkeletonLoader
 */
interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton Loader Component
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

/**
 * Event Card Skeleton
 */
export const EventCardSkeleton: React.FC = () => {
  return (
    <View style={styles.eventCardSkeleton}>
      <SkeletonLoader height={200} style={{ marginBottom: 12 }} />
      <SkeletonLoader height={24} width="80%" style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="60%" style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="40%" />
    </View>
  );
};

/**
 * Event List Skeleton
 */
export const EventListSkeleton: React.FC<{ count?: number }> = ({
  count = 5,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Calendar Skeleton
 */
export const CalendarSkeleton: React.FC = () => {
  return (
    <View style={styles.calendarSkeleton}>
      {/* Calendar header */}
      <View style={styles.calendarHeader}>
        <SkeletonLoader height={32} width="50%" />
        <View style={styles.calendarNavigation}>
          <SkeletonLoader height={32} width={32} borderRadius={16} />
          <SkeletonLoader
            height={32}
            width={32}
            borderRadius={16}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 35 }).map((_, index) => (
          <SkeletonLoader
            key={index}
            height={32}
            width={32}
            borderRadius={16}
            style={{ margin: 2 }}
          />
        ))}
      </View>

      {/* Events list */}
      <View style={styles.calendarEvents}>
        <SkeletonLoader height={20} width="30%" style={{ marginBottom: 16 }} />
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.calendarEventItem}>
            <SkeletonLoader height={60} width={60} borderRadius={8} />
            <View style={styles.calendarEventContent}>
              <SkeletonLoader
                height={16}
                width="70%"
                style={{ marginBottom: 8 }}
              />
              <SkeletonLoader height={14} width="50%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Profile Skeleton
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.profileSkeleton}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <SkeletonLoader height={80} width={80} borderRadius={40} />
        <View style={styles.profileInfo}>
          <SkeletonLoader height={24} width="60%" style={{ marginBottom: 8 }} />
          <SkeletonLoader height={16} width="40%" />
        </View>
      </View>

      {/* Profile stats */}
      <View style={styles.profileStats}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.profileStatItem}>
            <SkeletonLoader
              height={32}
              width="100%"
              style={{ marginBottom: 8 }}
            />
            <SkeletonLoader height={14} width="80%" />
          </View>
        ))}
      </View>

      {/* Profile actions */}
      <View style={styles.profileActions}>
        <SkeletonLoader height={44} width="45%" borderRadius={22} />
        <SkeletonLoader height={44} width="45%" borderRadius={22} />
      </View>
    </View>
  );
};

/**
 * Full Screen Loading
 */
interface FullScreenLoadingProps {
  message?: string;
  backgroundColor?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = 'Loading...',
  backgroundColor = 'rgba(255, 255, 255, 0.9)',
}) => {
  return (
    <View style={[styles.fullScreenLoading, { backgroundColor }]}>
      <LoadingSpinner size="large" message={message} />
    </View>
  );
};

/**
 * Inline Loading
 */
interface InlineLoadingProps {
  visible: boolean;
  message?: string;
  style?: ViewStyle;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  visible,
  message,
  style,
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.inlineLoading, style]}>
      <ActivityIndicator size="small" color="#3498db" />
      {message && <Text style={styles.inlineLoadingMessage}>{message}</Text>}
    </View>
  );
};

/**
 * Button Loading State
 */
interface LoadingButtonProps {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  disabled,
  children,
  style,
  textStyle,
  onPress,
}) => {
  const isDisabled = loading || disabled;

  return (
    <View
      style={[
        styles.loadingButton,
        isDisabled && styles.loadingButtonDisabled,
        style,
      ]}
      onTouchEnd={!isDisabled ? onPress : undefined}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={[styles.loadingButtonText, textStyle]}>{children}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingMessage: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: '#e1e8ed',
  },
  eventCardSkeleton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarSkeleton: {
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  calendarNavigation: {
    flexDirection: 'row',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  calendarEvents: {
    marginTop: 16,
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarEventContent: {
    flex: 1,
    marginLeft: 12,
  },
  profileSkeleton: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullScreenLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineLoadingMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  loadingButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loadingButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  loadingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
