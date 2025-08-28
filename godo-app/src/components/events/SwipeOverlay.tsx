import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { SwipeDirection } from '../../types';
import { colors, typography, spacing } from '../../design';

const { width, height } = Dimensions.get('window');

interface SwipeOverlayProps {
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
}

const OVERLAY_CONFIG = {
  [SwipeDirection.RIGHT]: {
    colors: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.6)'] as const,
    textColor: colors.info[600],
    icon: 'calendar',
    title: 'GOING',
    subtitle: 'Added to private calendar',
    position: 'right' as const,
  },
  [SwipeDirection.UP]: {
    colors: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.6)'] as const,
    textColor: colors.success[600],
    icon: 'users',
    title: 'SHARING',
    subtitle: 'Added to public calendar',
    position: 'top' as const,
  },
  [SwipeDirection.DOWN]: {
    colors: ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.6)'] as const,
    textColor: colors.warning[600],
    icon: 'bookmark',
    title: 'SAVED',
    subtitle: 'Saved for later',
    position: 'bottom' as const,
  },
  [SwipeDirection.LEFT]: {
    colors: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.6)'] as const,
    textColor: colors.error[600],
    icon: 'x',
    title: 'PASS',
    subtitle: 'Not interested',
    position: 'left' as const,
  },
};

// Individual overlay component to avoid hooks-in-loop issue
interface DirectionalOverlayProps {
  direction: SwipeDirection;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
}

const DirectionalOverlay: React.FC<DirectionalOverlayProps> = props => {
  const { direction, translateX, translateY } = props;
  const config = OVERLAY_CONFIG[direction];

  const animatedStyle = useAnimatedStyle(() => {
    const absX = Math.abs(translateX.value);
    const absY = Math.abs(translateY.value);

    let currentDirection: SwipeDirection | null = null;
    let opacity = 0;

    if (absX > 20 || absY > 20) {
      if (absX > absY) {
        currentDirection =
          translateX.value > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
      } else {
        currentDirection =
          translateY.value > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
      }

      if (currentDirection === direction) {
        const threshold =
          direction === SwipeDirection.LEFT ||
          direction === SwipeDirection.RIGHT
            ? absX
            : absY;
        opacity = interpolate(threshold, [20, 100], [0, 1], Extrapolate.CLAMP);
      }
    }

    return { opacity };
  }, [translateX, translateY]);

  const getOverlayStyle = () => {
    switch (config.position) {
      case 'left':
        return styles.overlayLeft;
      case 'right':
        return styles.overlayRight;
      case 'top':
        return styles.overlayTop;
      case 'bottom':
        return styles.overlayBottom;
      default:
        return styles.overlayRight;
    }
  };

  return (
    <Animated.View style={[styles.overlay, getOverlayStyle(), animatedStyle]}>
      <LinearGradient
        colors={config.colors}
        style={styles.overlayGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.overlayContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: config.textColor },
            ]}
          >
            <Feather
              name={config.icon as any}
              size={28}
              color={colors.neutral[0]}
            />
          </View>

          <Text style={[styles.overlayTitle, { color: config.textColor }]}>
            {config.title}
          </Text>

          <Text style={styles.overlaySubtitle}>{config.subtitle}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export const SwipeOverlay: React.FC<SwipeOverlayProps> = props => {
  const { translateX, translateY } = props;
  return (
    <>
      <DirectionalOverlay
        direction={SwipeDirection.LEFT}
        translateX={translateX}
        translateY={translateY}
      />
      <DirectionalOverlay
        direction={SwipeDirection.RIGHT}
        translateX={translateX}
        translateY={translateY}
      />
      <DirectionalOverlay
        direction={SwipeDirection.UP}
        translateX={translateX}
        translateY={translateY}
      />
      <DirectionalOverlay
        direction={SwipeDirection.DOWN}
        translateX={translateX}
        translateY={translateY}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayTop: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayBottom: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayContent: {
    alignItems: 'center',
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  overlayTitle: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing[1],
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  overlaySubtitle: {
    ...typography.body2,
    color: colors.neutral[0],
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 150,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
