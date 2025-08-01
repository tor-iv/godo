import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { 
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { SwipeDirection, FeedMode, Event } from '../../types';
import { getCategoryEmoji, formatEventTime } from '../../data/mockEvents';
import {
  useApp,
  useCurrentEvent,
  useNextEvent,
  useSwipeStats,
} from '../../context/AppContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_HEIGHT = screenHeight * 0.65;
const CARD_WIDTH = screenWidth * 0.9;

interface EventCardProps {
  event: Event;
  onSwipe: (direction: SwipeDirection) => void;
  style?: any;
}

const ReanimatedEventCard: React.FC<EventCardProps> = ({ event, onSwipe, style }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleSwipeDirection = (direction: SwipeDirection | null) => {
    setSwipeDirection(direction);
    if (direction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSwipeComplete = (direction: SwipeDirection) => {
    console.log('Swipe completed:', direction); // Debug log
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipe(direction);
    // Reset values
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 1;
    setSwipeDirection(null);
    setIsActive(false);
  };

  const handleSwipeStart = () => {
    setIsActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(handleSwipeStart)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      const threshold = 50;
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);
      
      if (absX > threshold || absY > threshold) {
        let currentDirection: SwipeDirection;
        
        if (absX > absY) {
          currentDirection = event.translationX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
        } else {
          currentDirection = event.translationY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
        }
        
        runOnJS(handleSwipeDirection)(currentDirection);
      } else {
        runOnJS(handleSwipeDirection)(null);
      }
    })
    .onEnd((event) => {
      const distanceThreshold = 80;
      const velocityThreshold = 500;
      
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);
      const absVelX = Math.abs(event.velocityX);
      const absVelY = Math.abs(event.velocityY);
      
      const shouldSwipe = 
        (absX > distanceThreshold || absY > distanceThreshold) ||
        (absVelX > velocityThreshold || absVelY > velocityThreshold);
      
      if (shouldSwipe) {
        let direction: SwipeDirection;
        
        const useVelocity = absVelX > velocityThreshold || absVelY > velocityThreshold;
        
        if (useVelocity) {
          if (absVelX > absVelY) {
            direction = event.velocityX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
          } else {
            direction = event.velocityY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
          }
        } else {
          if (absX > absY) {
            direction = event.translationX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
          } else {
            direction = event.translationY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
          }
        }
        
        const animationMultiplier = useVelocity ? 2 : 3;
        const targetX = useVelocity ? 
          event.translationX + (event.velocityX * 0.1) : 
          event.translationX * animationMultiplier;
        const targetY = useVelocity ? 
          event.translationY + (event.velocityY * 0.1) : 
          event.translationY * animationMultiplier;
        
        translateX.value = withTiming(targetX, { duration: 200 });
        translateY.value = withTiming(targetY, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleSwipeComplete)(direction);
        });
      } else {
        translateX.value = withSpring(0, { 
          damping: 20, 
          stiffness: 200,
          mass: 1,
        });
        translateY.value = withSpring(0, { 
          damping: 20, 
          stiffness: 200,
          mass: 1,
        });
        runOnJS(handleSwipeDirection)(null);
        runOnJS(() => setIsActive(false))();
        runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))();
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
      opacity: opacity.value,
    };
  });


  const priceText =
    !event.price || event.price.min === 0
      ? 'Free'
      : event.price.min === event.price.max
        ? `$${event.price.min}`
        : `$${event.price.min} - $${event.price.max}`;

  // Get swipe overlay color and text
  const getSwipeOverlay = () => {
    if (!swipeDirection) return null;
    
    const overlays = {
      [SwipeDirection.RIGHT]: { color: 'rgba(139, 92, 246, 0.85)', text: '💜 PRIVATE', icon: '→' },
      [SwipeDirection.LEFT]: { color: 'rgba(107, 114, 128, 0.85)', text: '👎 PASS', icon: '←' },
      [SwipeDirection.UP]: { color: 'rgba(34, 197, 94, 0.85)', text: '🌟 PUBLIC', icon: '↑' },
      [SwipeDirection.DOWN]: { color: 'rgba(249, 115, 22, 0.85)', text: '📌 SAVE', icon: '↓' },
    };
    
    return overlays[swipeDirection];
  };

  const swipeOverlay = getSwipeOverlay();

  return (
    <GestureDetector gesture={gesture}>
      <Reanimated.View
        style={[
          styles.eventCard,
          style,
          cardAnimatedStyle,
        ]}
      >
      <ImageBackground
        source={{ uri: event.imageUrl }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        {/* Swipe Direction Overlay */}
        {swipeOverlay && (
          <View style={[styles.swipeOverlay, { backgroundColor: swipeOverlay.color }]}>
            <Text style={styles.swipeOverlayText}>{swipeOverlay.text}</Text>
            <Text style={styles.swipeOverlayIcon}>{swipeOverlay.icon}</Text>
          </View>
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {getCategoryEmoji(event.category)}{' '}
                  {event.category.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>{formatEventTime(event.date)}</Text>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventLocation}>📍 {event.location.name}</Text>
              <Text style={styles.eventPrice}>{priceText}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
      </Reanimated.View>
    </GestureDetector>
  );
};

// Fallback EventCard for Expo Go (uses standard Animated API)
const FallbackEventCard: React.FC<EventCardProps> = ({ event, onSwipe, style }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },

    onPanResponderGrant: () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics might not work in Expo Go
      }
    },

    onPanResponderMove: (_, gestureState) => {
      const { dx, dy } = gestureState;
      pan.setValue({ x: dx, y: dy });
      
      const threshold = 50;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let currentDirection: SwipeDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
          currentDirection = dx > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
        } else {
          currentDirection = dy > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
        }
        
        if (currentDirection !== swipeDirection) {
          setSwipeDirection(currentDirection);
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {
            // Haptics might not work in Expo Go
          }
        }
      } else {
        setSwipeDirection(null);
      }
    },

    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy } = gestureState;
      const threshold = 80;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let direction: SwipeDirection;

        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
        } else {
          direction = dy > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
        }

        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          // Haptics might not work in Expo Go
        }

        // Animate card away
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: dx * 3, y: dy * 3 },
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onSwipe(direction);
          // Reset for next card
          pan.setValue({ x: 0, y: 0 });
          opacity.setValue(1);
          setSwipeDirection(null);
        });
      } else {
        // Snap back
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // Haptics might not work in Expo Go
        }
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        setSwipeDirection(null);
      }
    },
  });

  const priceText =
    !event.price || event.price.min === 0
      ? 'Free'
      : event.price.min === event.price.max
        ? `$${event.price.min}`
        : `$${event.price.min} - $${event.price.max}`;

  // Get swipe overlay color and text
  const getSwipeOverlay = () => {
    if (!swipeDirection) return null;
    
    const overlays = {
      [SwipeDirection.RIGHT]: { color: 'rgba(139, 92, 246, 0.85)', text: '💜 PRIVATE', icon: '→' },
      [SwipeDirection.LEFT]: { color: 'rgba(107, 114, 128, 0.85)', text: '👎 PASS', icon: '←' },
      [SwipeDirection.UP]: { color: 'rgba(34, 197, 94, 0.85)', text: '🌟 PUBLIC', icon: '↑' },
      [SwipeDirection.DOWN]: { color: 'rgba(249, 115, 22, 0.85)', text: '📌 SAVE', icon: '↓' },
    };
    
    return overlays[swipeDirection];
  };

  const swipeOverlay = getSwipeOverlay();

  return (
    <Animated.View
      style={[
        styles.eventCard,
        style,
        {
          transform: [
            ...pan.getTranslateTransform(),
            { 
              rotate: pan.x.interpolate({
                inputRange: [-200, 0, 200],
                outputRange: ['-15deg', '0deg', '15deg'],
                extrapolate: 'clamp',
              }) 
            }
          ],
          opacity: opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <ImageBackground
        source={{ uri: event.imageUrl }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        {/* Swipe Direction Overlay */}
        {swipeOverlay && (
          <View style={[styles.swipeOverlay, { backgroundColor: swipeOverlay.color }]}>
            <Text style={styles.swipeOverlayText}>{swipeOverlay.text}</Text>
            <Text style={styles.swipeOverlayIcon}>{swipeOverlay.icon}</Text>
          </View>
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {getCategoryEmoji(event.category)}{' '}
                  {event.category.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>{formatEventTime(event.date)}</Text>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventLocation}>📍 {event.location.name}</Text>
              <Text style={styles.eventPrice}>{priceText}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  );
};

// Use appropriate EventCard based on platform capabilities and build type
const EventCard: React.FC<EventCardProps> = (() => {
  // Check if we're in a development build (has native modules support)
  try {
    // This will work in development build but fail in Expo Go
    const testReanimated = require('react-native-reanimated');
    if (testReanimated.useSharedValue && Platform.OS !== 'web') {
      return ReanimatedEventCard; // Use advanced version in development build
    }
  } catch (e) {
    // Fall back to basic version
  }
  
  return Platform.select({
    web: ReanimatedEventCard,
    default: FallbackEventCard,
  });
})();

export default function DiscoverScreen() {
  const { state, dispatch } = useApp();
  const currentEvent = useCurrentEvent();
  const nextEvent = useNextEvent();
  const swipeStats = useSwipeStats();

  const handleSwipe = (direction: SwipeDirection) => {
    console.log('handleSwipe called with direction:', direction);
    console.log('currentEvent:', currentEvent?.title);
    if (currentEvent) {
      dispatch({
        type: 'SWIPE_EVENT',
        payload: { direction, event: currentEvent },
      });
      console.log('Dispatched SWIPE_EVENT action');
    }
  };

  const handleFeedModeChange = (mode: FeedMode) => {
    dispatch({ type: 'SET_FEED_MODE', payload: mode });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.gradientHeader}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>Find your next adventure</Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  state.feedMode === FeedMode.HAPPENING_NOW &&
                    styles.toggleButtonActive,
                ]}
                onPress={() => handleFeedModeChange(FeedMode.HAPPENING_NOW)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    state.feedMode === FeedMode.HAPPENING_NOW &&
                      styles.toggleTextActive,
                  ]}
                >
                  🔥 Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  state.feedMode === FeedMode.PLANNING_AHEAD &&
                    styles.toggleButtonActive,
                ]}
                onPress={() => handleFeedModeChange(FeedMode.PLANNING_AHEAD)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    state.feedMode === FeedMode.PLANNING_AHEAD &&
                      styles.toggleTextActive,
                  ]}
                >
                  📅 Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.cardStack}>
          {/* Next card (background) */}
          {nextEvent && (
            <EventCard
              key={`next-${nextEvent.id}`}
              event={nextEvent}
              onSwipe={() => {}}
              style={styles.nextCard}
            />
          )}

          {/* Current card (foreground) */}
          {currentEvent && (
            <EventCard
              key={`current-${currentEvent.id}`}
              event={currentEvent}
              onSwipe={handleSwipe}
              style={styles.currentCard}
            />
          )}
        </View>

        {/* Swipe instructions */}
        <View style={styles.swipeInstructions}>
          <View style={styles.instructionRow}>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>
                ↑ Public ({swipeStats.public})
              </Text>
            </View>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>
                ← Pass ({swipeStats.passed})
              </Text>
            </View>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>
                → Private ({swipeStats.private})
              </Text>
            </View>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>
                ↓ Later ({swipeStats.saved})
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  gradientHeader: {
    paddingBottom: SPACING.MD,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXL + 4,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.MD,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.SM - 2,
    paddingHorizontal: SPACING.MD - 4,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE - 4,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
  },
  toggleText: {
    fontSize: FONT_SIZES.XS + 1,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  toggleTextActive: {
    color: COLORS.PRIMARY_PURPLE,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    overflow: 'hidden',
    ...SHADOWS.LARGE,
  },
  currentCard: {
    position: 'absolute',
    zIndex: 2,
  },
  nextCard: {
    position: 'absolute',
    zIndex: 1,
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardImageStyle: {
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.LG,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'flex-start',
    paddingTop: SPACING.SM,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  categoryText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_PURPLE,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },
  cardFooter: {
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
    lineHeight: FONT_SIZES.XL * 1.3,
  },
  eventLocation: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.XS,
  },
  eventPrice: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  swipeInstructions: {
    position: 'absolute',
    bottom: SPACING.XL,
    alignItems: 'center',
  },
  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.XS,
  },
  instruction: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS - 2,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    marginHorizontal: SPACING.XS,
    minWidth: 80,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    zIndex: 5,
  },
  swipeOverlayText: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: SPACING.SM,
  },
  swipeOverlayIcon: {
    fontSize: FONT_SIZES.XXL + 20,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});
