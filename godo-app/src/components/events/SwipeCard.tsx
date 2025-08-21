import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Event, SwipeDirection } from '../../types';
import { EventCard } from './EventCard';
import { SwipeOverlay } from './SwipeOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SwipeCardProps {
  event: Event;
  onSwipe: (direction: SwipeDirection) => void;
  onPress?: () => void;
  index: number;
  totalCards: number;
}

const SWIPE_THRESHOLD = 120;
const ROTATION_FACTOR = 20;
const SCALE_FACTOR = 0.05;

export const SwipeCard: React.FC<SwipeCardProps> = ({
  event,
  onSwipe,
  onPress,
  index,
  totalCards,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      'worklet';
      scale.value = withSpring(1.02);
    },
    onActive: (event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      'worklet';
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Determine swipe direction based on translation and velocity
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);
      
      let direction: SwipeDirection | null = null;
      
      // Check if swipe is strong enough
      const isSwipeStrong = absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD ||
                           Math.abs(velocityX) > 500 || Math.abs(velocityY) > 500;
      
      if (isSwipeStrong) {
        // Determine primary direction
        if (absX > absY) {
          // Horizontal swipe
          direction = translationX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
        } else {
          // Vertical swipe
          direction = translationY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
        }
      }
      
      if (direction) {
        // Animate card off screen
        const targetX = direction === SwipeDirection.LEFT ? -screenWidth * 1.5 :
                       direction === SwipeDirection.RIGHT ? screenWidth * 1.5 : translationX;
        const targetY = direction === SwipeDirection.UP ? -screenHeight * 1.5 :
                       direction === SwipeDirection.DOWN ? screenHeight * 1.5 : translationY;
        
        translateX.value = withSpring(targetX, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(targetY, { damping: 20, stiffness: 200 });
        opacity.value = withSpring(0, { damping: 20, stiffness: 200 });
        
        // Call onSwipe after animation starts
        runOnJS(onSwipe)(direction);
      } else {
        // Spring back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
  });
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-ROTATION_FACTOR, 0, ROTATION_FACTOR],
      Extrapolate.CLAMP
    );
    
    // Calculate scale based on index (cards behind get smaller)
    const baseScale = 1 - (index * SCALE_FACTOR);
    const currentScale = scale.value * baseScale;
    
    // Calculate offset for stacked cards
    const stackOffset = index * 8;
    
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + stackOffset },
        { rotate: `${rotate}deg` },
        { scale: currentScale },
      ],
      opacity: opacity.value,
      zIndex: totalCards - index,
    };
  });
  
  // Only show overlays for the top card
  const showOverlays = index === 0;
  
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, cardAnimatedStyle]}>
        <EventCard
          event={event}
          onPress={onPress}
          style={styles.card}
        />
        
        {/* Swipe Overlays - only for top card */}
        {showOverlays && (
          <>
            <SwipeOverlay 
              direction={SwipeDirection.LEFT} 
              translateX={translateX} 
              translateY={translateY} 
            />
            <SwipeOverlay 
              direction={SwipeDirection.RIGHT} 
              translateX={translateX} 
              translateY={translateY} 
            />
            <SwipeOverlay 
              direction={SwipeDirection.UP} 
              translateX={translateX} 
              translateY={translateY} 
            />
            <SwipeOverlay 
              direction={SwipeDirection.DOWN} 
              translateX={translateX} 
              translateY={translateY} 
            />
          </>
        )}
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
  card: {
    // EventCard styles are handled in the EventCard component
  },
});