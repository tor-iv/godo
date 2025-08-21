import React, { useState, useCallback, useEffect } from 'react';
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

export const SwipeStack: React.FC<SwipeStackProps> = ({
  events,
  onSwipe,
  onEventPress,
  onStackEmpty,
  maxVisibleCards = 3,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  
  // Update visible events when events prop changes or index changes
  useEffect(() => {
    const startIndex = currentIndex;
    const endIndex = Math.min(currentIndex + maxVisibleCards, events.length);
    const newVisibleEvents = events.slice(startIndex, endIndex);
    setVisibleEvents(newVisibleEvents);
  }, [events, currentIndex, maxVisibleCards]);
  
  // Check if stack is empty
  useEffect(() => {
    if (currentIndex >= events.length && onStackEmpty) {
      onStackEmpty();
    }
  }, [currentIndex, events.length, onStackEmpty]);
  
  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const currentEvent = events[currentIndex];
    if (!currentEvent) return;
    
    // Record the swipe in EventService
    const eventService = EventService.getInstance();
    eventService.swipeEvent(currentEvent.id, direction);
    
    // Call the onSwipe callback
    onSwipe(currentEvent, direction);
    
    // Move to next card
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, events, onSwipe]);
  
  const handleEventPress = useCallback((event: Event) => {
    if (onEventPress) {
      onEventPress(event);
    }
  }, [onEventPress]);
  
  // If no events or all events have been swiped
  if (visibleEvents.length === 0) {
    return <View style={styles.emptyContainer} />;
  }
  
  return (
    <View style={styles.container}>
      {visibleEvents.map((event, index) => {
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
      })}
    </View>
  );
};

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