import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SwipeDirection } from '../../types';
import Typography from '../common/Typography';

interface SwipeOverlayProps {
  direction: SwipeDirection;
  progress: Animated.SharedValue<number>;
}

const SwipeOverlay: React.FC<SwipeOverlayProps> = ({ direction, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.3, 1],
      [0, 0.8, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.8, 1.1, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const getOverlayConfig = () => {
    switch (direction) {
      case SwipeDirection.RIGHT:
        return {
          backgroundColor: 'rgba(74, 85, 104, 0.9)',
          icon: 'calendar' as keyof typeof Ionicons.glyphMap,
          text: 'ADDED TO CALENDAR',
          color: '#FFFFFF',
        };
      case SwipeDirection.LEFT:
        return {
          backgroundColor: 'rgba(113, 128, 150, 0.9)',
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
          text: 'PASS',
          color: '#FFFFFF',
        };
      case SwipeDirection.UP:
        return {
          backgroundColor: 'rgba(72, 187, 120, 0.9)',
          icon: 'people' as keyof typeof Ionicons.glyphMap,
          text: 'PUBLIC CALENDAR',
          color: '#FFFFFF',
        };
      case SwipeDirection.DOWN:
        return {
          backgroundColor: 'rgba(237, 137, 54, 0.9)',
          icon: 'bookmark' as keyof typeof Ionicons.glyphMap,
          text: 'SAVED FOR LATER',
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: 'rgba(74, 85, 104, 0.9)',
          icon: 'calendar' as keyof typeof Ionicons.glyphMap,
          text: 'ADDED TO CALENDAR',
          color: '#FFFFFF',
        };
    }
  };

  const config = getOverlayConfig();

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: config.backgroundColor },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={config.icon}
          size={80}
          color={config.color}
          style={styles.icon}
        />
        <Typography variant="h2" color={config.color} style={styles.text}>
          {config.text}
        </Typography>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SwipeOverlay;
