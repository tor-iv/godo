import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container, Heading2, Body, Button } from '../../components/base';
import type { DiscoverStackParamList } from '../../navigation/DiscoverStackNavigator';
import { SwipeStack } from '../../components/events';
import { spacing, colors, layout } from '../../design';
import { deviceInfo } from '../../design/responsiveTokens';
import { EventService } from '../../services';
import { SwipeInteractionTracker } from '../../services/SwipeInteractionTracker';
import { Event, SwipeDirection } from '../../types';

type NavigationProp = StackNavigationProp<DiscoverStackParamList>;

export const DiscoverScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);

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
    setSwipeCount(prev => prev + 1);

    // Track the swipe interaction
    const swipeTracker = SwipeInteractionTracker.getInstance();
    swipeTracker.recordSwipe(direction);
  }, []);

  const handleEventPress = useCallback(
    (event: Event) => {
      navigation.navigate('EventDetail', { event });
    },
    [navigation]
  );

  const handleStackEmpty = useCallback(() => {
    Alert.alert(
      'All done! 🎉',
      "You've swiped through all available events. Check back later for more!",
      [
        {
          text: 'Reload Events',
          onPress: () => {
            const eventService = EventService.getInstance();
            // Reset all swipes for demo purposes
            eventService
              .getSwipedEvents(SwipeDirection.LEFT)
              .forEach(event => eventService.removeSwipe(event.id));
            eventService
              .getSwipedEvents(SwipeDirection.RIGHT)
              .forEach(event => eventService.removeSwipe(event.id));
            eventService
              .getSwipedEvents(SwipeDirection.UP)
              .forEach(event => eventService.removeSwipe(event.id));
            eventService
              .getSwipedEvents(SwipeDirection.DOWN)
              .forEach(event => eventService.removeSwipe(event.id));
            setSwipeCount(0);
            loadEvents();
          },
        },
        { text: 'OK' },
      ]
    );
  }, []);

  if (loading) {
    return (
      <Container variant="screenCentered">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Body
          color={colors.neutral[500]}
          align="center"
          style={styles.loadingText}
        >
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
        <Body
          color={colors.neutral[500]}
          align="center"
          style={styles.emptySubtitle}
        >
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
    <Container variant="screen">
      {/* Header with proper spacing */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Body
          color={colors.neutral[500]}
          align="center"
          style={styles.subtitle}
        >
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
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[6],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  subtitle: {
    fontSize: deviceInfo.isSmallDevice ? 12 : 14,
    lineHeight: deviceInfo.isSmallDevice ? 16 : 20,
    fontWeight: '500',
    paddingHorizontal: spacing[4],
  },
  loadingText: {
    marginTop: spacing[4],
  },
  swipeContainer: {
    flex: 1,
    paddingTop: 0,
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
