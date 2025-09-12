import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Event, SwipeDirection } from '../../types';
import { SwipeCard } from './SwipeCard';
import { EventService } from '../../services';

const { height: screenHeight } = Dimensions.get('window');

interface SwipeStackProps {
  events: Event[];
  onSwipe: (event: Event, direction: SwipeDirection) => void;
  onEventPress?: (event: Event) => void;
  onStackEmpty?: () => void;
  maxVisibleCards?: number;
}

export const SwipeStack: React.FC<SwipeStackProps> = React.memo(props => {
  const {
    events,
    onSwipe,
    onEventPress,
    onStackEmpty,
    maxVisibleCards = 3,
  } = props;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Memoize visible events calculation
  const visibleEventsMemo = useMemo(() => {
    const startIndex = currentIndex;
    const endIndex = Math.min(currentIndex + maxVisibleCards, events.length);
    return events.slice(startIndex, endIndex);
  }, [events, currentIndex, maxVisibleCards]);

  // Update visible events when memo changes
  useEffect(() => {
    setVisibleEvents(visibleEventsMemo);
  }, [visibleEventsMemo]);

  // Check if stack is empty
  useEffect(() => {
    if (currentIndex >= events.length && onStackEmpty) {
      onStackEmpty();
    }
  }, [currentIndex, events.length, onStackEmpty]);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      const currentEvent = events[currentIndex];
      if (!currentEvent || isAnimating) return;

      setIsAnimating(true);

      // Record the swipe in EventService
      const eventService = EventService.getInstance();
      eventService.swipeEvent(currentEvent.id, direction);

      // Call the onSwipe callback
      onSwipe(currentEvent, direction);

      // Move to next card with debounced animation reset
      setCurrentIndex(prev => prev + 1);

      // Reset animation state after a delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    },
    [currentIndex, events, onSwipe, isAnimating]
  );

  const handleEventPress = useCallback(
    (event: Event) => {
      if (onEventPress) {
        onEventPress(event);
      }
    },
    [onEventPress]
  );

  // Memoize cards to prevent unnecessary re-renders
  const renderedCards = useMemo(() => {
    return visibleEvents.map((event, index) => {
      const globalIndex = currentIndex + index;

      return (
        <SwipeCard
          key={`${event.id}-${globalIndex}`}
          event={event}
          onSwipe={handleSwipe}
          onPress={() => handleEventPress(event)}
          index={index}
          totalCards={visibleEvents.length}
        />
      );
    });
  }, [visibleEvents, currentIndex, handleSwipe, handleEventPress]);

  // If no events or all events have been swiped
  if (visibleEvents.length === 0) {
    return <View style={styles.emptyContainer} />;
  }

  return <View style={styles.container}>{renderedCards}</View>;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
  },
});

SwipeStack.displayName = 'SwipeStack';
