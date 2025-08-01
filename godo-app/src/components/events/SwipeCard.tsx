import React, { useCallback } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Event, SwipeDirection } from '../../types';
import EventCard from './EventCard';
import SwipeOverlay from './SwipeOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.1;

interface SwipeCardProps {
  event: Event;
  onSwipe: (direction: SwipeDirection, event: Event) => void;
  index: number;
  totalCards: number;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  event,
  onSwipe,
  index,
  totalCards,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const currentDirection = useSharedValue<SwipeDirection | null>(null);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const resetCard = useCallback(() => {
    'worklet';
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotate.value = withSpring(0);
    scale.value = withSpring(1);
    overlayOpacity.value = withSpring(0);
    currentDirection.value = null;
  }, []);

  const dismissCard = useCallback(
    (direction: SwipeDirection) => {
      'worklet';
      const exitX =
        direction === SwipeDirection.LEFT
          ? -screenWidth
          : direction === SwipeDirection.RIGHT
            ? screenWidth
            : 0;
      const exitY =
        direction === SwipeDirection.UP
          ? -screenHeight
          : direction === SwipeDirection.DOWN
            ? screenHeight
            : 0;

      translateX.value = withSpring(exitX, { damping: 15 });
      translateY.value = withSpring(exitY, { damping: 15 });
      scale.value = withSpring(0.8);

      runOnJS(triggerHaptic)();
      runOnJS(onSwipe)(direction, event);
    },
    [event, onSwipe, triggerHaptic]
  );

  const getSwipeDirection = useCallback(
    (x: number, y: number): SwipeDirection | null => {
      'worklet';
      const absX = Math.abs(x);
      const absY = Math.abs(y);

      if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
        return null;
      }

      if (absX > absY) {
        return x > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
      } else {
        return y > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
      }
    },
    []
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
      scale.value = withSpring(1.05);
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;

      const rotation = interpolate(
        event.translationX,
        [-screenWidth / 2, screenWidth / 2],
        [-30, 30],
        Extrapolate.CLAMP
      );
      rotate.value = rotation * ROTATION_FACTOR;

      const direction = getSwipeDirection(
        event.translationX,
        event.translationY
      );
      currentDirection.value = direction;

      if (direction) {
        const progress = Math.max(
          Math.abs(event.translationX) / SWIPE_THRESHOLD,
          Math.abs(event.translationY) / SWIPE_THRESHOLD
        );
        overlayOpacity.value = Math.min(progress, 1);
      } else {
        overlayOpacity.value = 0;
      }
    },
    onEnd: (event) => {
      const direction = getSwipeDirection(
        event.translationX,
        event.translationY
      );

      if (direction) {
        const velocity = Math.sqrt(
          event.velocityX * event.velocityX + event.velocityY * event.velocityY
        );

        if (velocity > 1000 || overlayOpacity.value >= 0.7) {
          dismissCard(direction);
          return;
        }
      }

      resetCard();
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const stackScale = interpolate(
      index,
      [0, 1, 2],
      [1, 0.95, 0.9],
      Extrapolate.CLAMP
    );

    const stackTranslateY = interpolate(
      index,
      [0, 1, 2],
      [0, -10, -20],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + stackTranslateY },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value * stackScale },
      ],
      zIndex: totalCards - index,
    };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[cardStyle]}>
        <EventCard event={event} />
        {currentDirection.value && (
          <Animated.View
            style={[
              overlayStyle,
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            ]}
          >
            <SwipeOverlay
              direction={currentDirection.value}
              progress={overlayOpacity}
            />
          </Animated.View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default SwipeCard;
