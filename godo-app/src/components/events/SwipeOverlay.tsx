import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
  direction: SwipeDirection;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
}

const OVERLAY_CONFIG = {
  [SwipeDirection.RIGHT]: {
    colors: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.3)'] as const,
    textColor: colors.info[600],
    icon: 'calendar-plus',
    title: 'GOING',
    subtitle: 'Added to private calendar',
    position: 'right' as const,
  },
  [SwipeDirection.UP]: {
    colors: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)'] as const,
    textColor: colors.success[600],
    icon: 'users',
    title: 'SHARING',
    subtitle: 'Added to public calendar',
    position: 'top' as const,
  },
  [SwipeDirection.DOWN]: {
    colors: ['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.3)'] as const,
    textColor: colors.warning[600],
    icon: 'bookmark',
    title: 'SAVED',
    subtitle: 'Saved for later',
    position: 'bottom' as const,
  },
  [SwipeDirection.LEFT]: {
    colors: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)'] as const,
    textColor: colors.error[600],
    icon: 'x',
    title: 'PASS',
    subtitle: 'Not interested',
    position: 'left' as const,
  },
};

export const SwipeOverlay: React.FC<SwipeOverlayProps> = ({ 
  direction, 
  translateX, 
  translateY 
}) => {
  const config = OVERLAY_CONFIG[direction];
  
  const animatedStyle = useAnimatedStyle(() => {
    let opacity = 0;
    
    if (direction === SwipeDirection.LEFT || direction === SwipeDirection.RIGHT) {
      opacity = interpolate(
        Math.abs(translateX.value),
        [60, 150],
        [0, 1],
        Extrapolate.CLAMP
      );
    } else {
      opacity = interpolate(
        Math.abs(translateY.value),
        [60, 150],
        [0, 1],
        Extrapolate.CLAMP
      );
    }
    
    return {
      opacity,
    };
  });
  
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
          <View style={[styles.iconContainer, { backgroundColor: config.textColor }]}>
            <Feather 
              name={config.icon as any} 
              size={28} 
              color={colors.neutral[0]} 
            />
          </View>
          
          <Text style={[styles.overlayTitle, { color: config.textColor }]}>
            {config.title}
          </Text>
          
          <Text style={styles.overlaySubtitle}>
            {config.subtitle}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    zIndex: 1000,
  },
  
  overlayLeft: {
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing[8],
  },
  
  overlayRight: {
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: spacing[8],
  },
  
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
    height: height / 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing[8],
  },
  
  overlayBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: height / 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing[8],
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
  },
  
  overlaySubtitle: {
    ...typography.body2,
    color: colors.neutral[500],
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 150,
  },
});