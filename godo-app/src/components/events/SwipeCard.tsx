import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Event, SwipeDirection } from '../../types';
import { EventCard } from './EventCard';
import { SwipeOverlay } from './SwipeOverlay';
import { layout, spacing } from '../../design';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth - layout.screenPadding * 2;

interface SwipeCardProps {
  event: Event;
  onSwipe: (direction: SwipeDirection) => void;
  onPress?: () => void;
  index: number;
  totalCards: number;
}

const SWIPE_THRESHOLD = 120; // Balanced threshold for responsiveness vs accuracy
const ROTATION_FACTOR = 15; // Reduced for more natural feel
const SCALE_FACTOR = 0.04; // Slightly reduced for better stacking
const VELOCITY_THRESHOLD = 600; // More responsive velocity threshold
const HAPTIC_THRESHOLD = 60; // Threshold for haptic feedback activation

export const SwipeCard: React.FC<SwipeCardProps> = props => {
  const { event, onSwipe, onPress, index, totalCards } = props;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isSwipeActive = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);
  const swipeIntensity = useSharedValue(0); // Track swipe intensity for dynamic feedback

  // Haptic feedback helper
  const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy') => {
    'worklet';
    if (!hasTriggeredHaptic.value) {
      hasTriggeredHaptic.value = true;
      if (intensity === 'light') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      } else if (intensity === 'medium') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
  };

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        'worklet';
        scale.value = withSpring(1.05, { damping: 20, stiffness: 300 });
        isSwipeActive.value = false;
        hasTriggeredHaptic.value = false;
        swipeIntensity.value = 0;
      },
      onActive: event => {
        'worklet';
        translateX.value = event.translationX * 0.8; // Slightly damped for control
        translateY.value = event.translationY * 0.8;

        const absX = Math.abs(event.translationX);
        const absY = Math.abs(event.translationY);
        const maxTranslation = Math.max(absX, absY);

        swipeIntensity.value = Math.min(maxTranslation / SWIPE_THRESHOLD, 1);

        // Progressive haptic feedback
        if (maxTranslation > HAPTIC_THRESHOLD && !hasTriggeredHaptic.value) {
          if (maxTranslation > SWIPE_THRESHOLD * 0.8) {
            triggerHapticFeedback('heavy');
          } else if (maxTranslation > SWIPE_THRESHOLD * 0.6) {
            triggerHapticFeedback('medium');
          } else {
            triggerHapticFeedback('light');
          }
        }

        // Mark as active swipe
        if (maxTranslation > 30) {
          isSwipeActive.value = true;
        }
      },
      onEnd: event => {
        'worklet';
        const { translationX, translationY, velocityX, velocityY } = event;

        const absX = Math.abs(translationX);
        const absY = Math.abs(translationY);

        let direction: SwipeDirection | null = null;

        // Enhanced swipe detection with velocity consideration
        const hasStrongVelocity =
          Math.abs(velocityX) > VELOCITY_THRESHOLD ||
          Math.abs(velocityY) > VELOCITY_THRESHOLD;
        const hasStrongTranslation =
          (absX > SWIPE_THRESHOLD && absX > absY * 0.8) ||
          (absY > SWIPE_THRESHOLD && absY > absX * 0.8);

        if (hasStrongTranslation || hasStrongVelocity) {
          // Determine direction with velocity bias
          const velocityXAbs = Math.abs(velocityX);
          const velocityYAbs = Math.abs(velocityY);

          if (
            (absX > absY && velocityXAbs >= velocityYAbs * 0.7) ||
            (hasStrongVelocity && velocityXAbs > velocityYAbs)
          ) {
            direction =
              translationX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
          } else if (
            (absY > absX && velocityYAbs >= velocityXAbs * 0.7) ||
            (hasStrongVelocity && velocityYAbs > velocityXAbs)
          ) {
            direction =
              translationY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
          }
        }

        if (direction) {
          // Enhanced exit animation with easing
          const targetX =
            direction === SwipeDirection.LEFT
              ? -screenWidth * 1.2
              : direction === SwipeDirection.RIGHT
                ? screenWidth * 1.2
                : 0;
          const targetY =
            direction === SwipeDirection.UP
              ? -screenHeight * 1.2
              : direction === SwipeDirection.DOWN
                ? screenHeight * 1.2
                : 0;

          // Faster, more responsive exit animation
          translateX.value = withTiming(targetX, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
          translateY.value = withTiming(targetY, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
          opacity.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.quad),
          });

          // Success haptic feedback
          runOnJS(Haptics.notificationAsync)(
            Haptics.NotificationFeedbackType.Success
          );
          runOnJS(onSwipe)(direction);
        } else {
          // Enhanced spring back animation
          translateX.value = withSpring(0, {
            damping: 25,
            stiffness: 400,
          });
          translateY.value = withSpring(0, {
            damping: 25,
            stiffness: 400,
          });
          scale.value = withSpring(1, {
            damping: 20,
            stiffness: 300,
          });

          // Reset haptic state for next interaction
          hasTriggeredHaptic.value = false;
        }

        isSwipeActive.value = false;
        swipeIntensity.value = 0;
      },
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Dynamic rotation based on swipe intensity
    const rotate = interpolate(
      translateX.value,
      [-screenWidth / 3, 0, screenWidth / 3],
      [-ROTATION_FACTOR, 0, ROTATION_FACTOR],
      Extrapolate.CLAMP
    );

    // Enhanced scale calculation with interaction feedback
    const baseScale = 1 - index * SCALE_FACTOR;
    const interactionScale = interpolate(
      swipeIntensity.value,
      [0, 0.5, 1],
      [1, 1.02, 1.05],
      Extrapolate.CLAMP
    );
    const currentScale = scale.value * baseScale * interactionScale;

    // Dynamic stacking with parallax effect
    const stackOffset = index * (6 + swipeIntensity.value * 2);
    const stackScale = interpolate(
      swipeIntensity.value,
      [0, 1],
      [1, 0.98],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + stackOffset },
        { rotate: `${rotate}deg` },
        { scale: currentScale * (index === 0 ? 1 : stackScale) },
      ],
      opacity: opacity.value,
      zIndex: totalCards - index,
    };
  });

  // Only show overlays for the top card
  const showOverlays = index === 0;

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetX={[-10, 10]}
      activeOffsetY={[-10, 10]}
      failOffsetX={[-5, 5]}
      failOffsetY={[-5, 5]}
    >
      <Animated.View style={[styles.container, cardAnimatedStyle]}>
        <View style={[styles.cardWrapper, index > 0 && styles.backgroundCard]}>
          <EventCard
            event={event}
            onPress={index === 0 ? onPress : undefined} // Only top card is tappable
            style={styles.card}
          />

          {/* Enhanced Swipe Overlay with dynamic feedback */}
          {showOverlays && (
            <SwipeOverlay
              translateX={translateX}
              translateY={translateY}
              isSwipeActive={isSwipeActive}
              swipeIntensity={swipeIntensity}
            />
          )}
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  cardWrapper: {
    width: cardWidth,
    borderRadius: layout.cardBorderRadius,
    overflow: 'hidden',
    position: 'relative',
    // Enhanced shadow for better depth perception
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backgroundCard: {
    // Slightly muted background cards
    opacity: 0.95,
  },
  card: {
    // EventCard styles are handled in the EventCard component
  },
});
