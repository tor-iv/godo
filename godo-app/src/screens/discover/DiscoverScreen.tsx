import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  StatusBar,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { FeedMode, SwipeDirection } from '../../types';
import { mockEvents, getCategoryEmoji, formatEventTime } from '../../data/mockEvents';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_HEIGHT = screenHeight * 0.65;
const CARD_WIDTH = screenWidth * 0.9;

interface EventCardProps {
  event: typeof mockEvents[0];
  onSwipe: (direction: SwipeDirection) => void;
  style?: any;
}

const EventCard: React.FC<EventCardProps> = ({ event, onSwipe, style }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    
    onPanResponderMove: (_, gestureState) => {
      pan.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    
    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy } = gestureState;
      const threshold = 100;
      
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let direction: SwipeDirection;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
        } else {
          direction = dy > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
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
          })
        ]).start(() => {
          onSwipe(direction);
          // Reset for next card
          pan.setValue({ x: 0, y: 0 });
          opacity.setValue(1);
        });
      } else {
        // Snap back
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const priceText = !event.price || event.price.min === 0 
    ? 'Free' 
    : event.price.min === event.price.max 
      ? `$${event.price.min}`
      : `$${event.price.min} - $${event.price.max}`;

  return (
    <Animated.View
      style={[
        styles.eventCard,
        style,
        {
          transform: pan.getTranslateTransform(),
          opacity: opacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
      <ImageBackground
        source={{ uri: event.imageUrl }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {getCategoryEmoji(event.category)} {event.category.toUpperCase()}
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

export default function DiscoverScreen() {
  const [feedMode, setFeedMode] = useState<FeedMode>(FeedMode.HAPPENING_NOW);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState({ 
    private: 0, 
    public: 0, 
    pass: 0, 
    later: 0 
  });

  const handleSwipe = (direction: SwipeDirection) => {
    console.log(`Swiped ${direction} on event: ${mockEvents[currentCardIndex]?.title}`);
    
    // Update swipe counts
    switch (direction) {
      case SwipeDirection.RIGHT:
        setSwipeCount(prev => ({ ...prev, private: prev.private + 1 }));
        break;
      case SwipeDirection.UP:
        setSwipeCount(prev => ({ ...prev, public: prev.public + 1 }));
        break;
      case SwipeDirection.LEFT:
        setSwipeCount(prev => ({ ...prev, pass: prev.pass + 1 }));
        break;
      case SwipeDirection.DOWN:
        setSwipeCount(prev => ({ ...prev, later: prev.later + 1 }));
        break;
    }

    // Move to next card
    setTimeout(() => {
      setCurrentCardIndex(prev => (prev + 1) % mockEvents.length);
    }, 300);
  };

  const currentEvent = mockEvents[currentCardIndex];
  const nextEvent = mockEvents[(currentCardIndex + 1) % mockEvents.length];

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
                  feedMode === FeedMode.HAPPENING_NOW && styles.toggleButtonActive,
                ]}
                onPress={() => setFeedMode(FeedMode.HAPPENING_NOW)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    feedMode === FeedMode.HAPPENING_NOW && styles.toggleTextActive,
                  ]}
                >
                  🔥 Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  feedMode === FeedMode.PLANNING_AHEAD && styles.toggleButtonActive,
                ]}
                onPress={() => setFeedMode(FeedMode.PLANNING_AHEAD)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    feedMode === FeedMode.PLANNING_AHEAD && styles.toggleTextActive,
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
              <Text style={styles.instructionText}>↑ Public ({swipeCount.public})</Text>
            </View>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>← Pass ({swipeCount.pass})</Text>
            </View>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>→ Private ({swipeCount.private})</Text>
            </View>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>↓ Later ({swipeCount.later})</Text>
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
});