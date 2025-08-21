import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container, Heading2, Body, Button } from '../../components/base';
import { SwipeStack } from '../../components/events';
import { spacing, colors } from '../../design';
import { EventService } from '../../services';
import { Event, SwipeDirection } from '../../types';

export const DiscoverScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventService = EventService.getInstance();
      const unswipedEvents = await eventService.getUnswipedEvents();
      setEvents(unswipedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = useCallback((event: Event, direction: SwipeDirection) => {
    console.log(`Swiped ${event.title} ${direction}`);
    setSwipeCount(prev => prev + 1);
    
    // Show feedback based on swipe direction
    const messages = {
      [SwipeDirection.RIGHT]: `Added "${event.title}" to your private calendar! 📅`,
      [SwipeDirection.UP]: `Added "${event.title}" to your public calendar! 👥`,
      [SwipeDirection.DOWN]: `Saved "${event.title}" for later! 🔖`,
      [SwipeDirection.LEFT]: `Passed on "${event.title}" ❌`,
    };
    
    // Optional: Show toast/alert for feedback (for testing)
    // Alert.alert('Swiped!', messages[direction]);
  }, []);

  const handleEventPress = useCallback((event: Event) => {
    Alert.alert(
      event.title,
      `${event.description}\n\nVenue: ${event.venue.name}\nNeighborhood: ${event.venue.neighborhood}`,
      [{ text: 'OK' }]
    );
  }, []);

  const handleStackEmpty = useCallback(() => {
    Alert.alert(
      'All done! 🎉',
      'You\'ve swiped through all available events. Check back later for more!',
      [
        {
          text: 'Reload Events',
          onPress: () => {
            const eventService = EventService.getInstance();
            // Reset all swipes for demo purposes
            eventService.getSwipedEvents(SwipeDirection.LEFT).forEach(event => 
              eventService.removeSwipe(event.id)
            );
            eventService.getSwipedEvents(SwipeDirection.RIGHT).forEach(event => 
              eventService.removeSwipe(event.id)
            );
            eventService.getSwipedEvents(SwipeDirection.UP).forEach(event => 
              eventService.removeSwipe(event.id)
            );
            eventService.getSwipedEvents(SwipeDirection.DOWN).forEach(event => 
              eventService.removeSwipe(event.id)
            );
            setSwipeCount(0);
            loadEvents();
          }
        },
        { text: 'OK' }
      ]
    );
  }, []);

  const getInstructions = () => {
    return [
      '👈 Swipe left: Not interested',
      '👉 Swipe right: Add to private calendar',
      '👆 Swipe up: Add to public calendar',
      '👇 Swipe down: Save for later',
    ];
  };

  if (loading) {
    return (
      <Container variant="screenCentered">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Body color={colors.neutral[500]} align="center" style={styles.loadingText}>
          Loading events...
        </Body>
      </Container>
    );
  }

  if (events.length === 0) {
    return (
      <Container variant="screenCentered">
        <Heading2 align="center" style={styles.emptyTitle}>
          No Events Available
        </Heading2>
        <Body color={colors.neutral[500]} align="center" style={styles.emptySubtitle}>
          Check back later for new events!
        </Body>
        <Button 
          title="Reload" 
          onPress={loadEvents}
          style={styles.reloadButton}
        />
      </Container>
    );
  }

  return (
    <Container style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Heading2 align="center" style={styles.title}>
          Discover Events
        </Heading2>
        <Body color={colors.neutral[500]} align="center" style={styles.subtitle}>
          Swipe to explore NYC events • {swipeCount} swiped
        </Body>
      </View>

      {/* Swipe Stack */}
      <View style={styles.swipeContainer}>
        <SwipeStack
          events={events}
          onSwipe={handleSwipe}
          onEventPress={handleEventPress}
          onStackEmpty={handleStackEmpty}
          maxVisibleCards={3}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        {getInstructions().map((instruction, index) => (
          <Body key={index} color={colors.neutral[400]} style={styles.instructionText}>
            {instruction}
          </Body>
        ))}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 14,
  },
  loadingText: {
    marginTop: spacing[4],
  },
  swipeContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  instructions: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  instructionText: {
    fontSize: 12,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    marginBottom: spacing[8],
  },
  reloadButton: {
    minWidth: 120,
  },
});