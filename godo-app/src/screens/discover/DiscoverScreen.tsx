import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Container,
  Heading2,
  Body,
  Button,
  SegmentedControl,
  type SegmentedControlOption,
} from '../../components/base';
import type { DiscoverStackParamList } from '../../navigation/DiscoverStackNavigator';
import { SwipeStack } from '../../components/events';
import { spacing, colors, layout } from '../../design';
import { deviceInfo } from '../../design/responsiveTokens';
import { EventService } from '../../services';
import { SwipeInteractionTracker } from '../../services/SwipeInteractionTracker';
import { Event, SwipeDirection, TimeFilter } from '../../types';

type NavigationProp = StackNavigationProp<DiscoverStackParamList>;

const TIME_FILTER_OPTIONS: SegmentedControlOption[] = [
  { label: 'Happening Now', value: TimeFilter.HAPPENING_NOW },
  { label: 'Future Events', value: TimeFilter.FUTURE },
];

export const DiscoverScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(
    TimeFilter.HAPPENING_NOW
  );

  useEffect(() => {
    loadEvents();
  }, [timeFilter]); // Reload when filter changes

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventService = EventService.getInstance();
      const unswipedEvents =
        await eventService.getUnswipedEventsByTime(timeFilter);
      setEvents(unswipedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilterChange = useCallback((value: string) => {
    setTimeFilter(value as TimeFilter);
  }, []);

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
    const filterLabel =
      timeFilter === TimeFilter.HAPPENING_NOW ? 'happening now' : 'upcoming';

    Alert.alert(
      'All done! 🎉',
      `You've swiped through all ${filterLabel} events. ${
        timeFilter === TimeFilter.HAPPENING_NOW
          ? 'Check out Future Events for more!'
          : 'Check back later for more events!'
      }`,
      [
        {
          text:
            timeFilter === TimeFilter.HAPPENING_NOW
              ? 'View Future Events'
              : 'View Happening Now',
          onPress: () => {
            setTimeFilter(
              timeFilter === TimeFilter.HAPPENING_NOW
                ? TimeFilter.FUTURE
                : TimeFilter.HAPPENING_NOW
            );
          },
        },
        { text: 'OK' },
      ]
    );
  }, [timeFilter]);

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

        {/* Time Filter Toggle */}
        <SegmentedControl
          options={TIME_FILTER_OPTIONS}
          selectedValue={timeFilter}
          onValueChange={handleTimeFilterChange}
          style={styles.toggle}
        />
      </View>

      {/* Swipe Stack or Empty State */}
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heading2 align="center" style={styles.emptyTitle}>
            No Events Available
          </Heading2>
          <Body
            color={colors.neutral[500]}
            align="center"
            style={styles.emptySubtitle}
          >
            {timeFilter === TimeFilter.HAPPENING_NOW
              ? "Nothing happening right now. Check out Future Events!"
              : 'No upcoming events. Check back later!'}
          </Body>
          <Button
            title={
              timeFilter === TimeFilter.HAPPENING_NOW
                ? 'View Future Events'
                : 'View Happening Now'
            }
            onPress={() => {
              setTimeFilter(
                timeFilter === TimeFilter.HAPPENING_NOW
                  ? TimeFilter.FUTURE
                  : TimeFilter.HAPPENING_NOW
              );
            }}
            style={styles.switchButton}
          />
        </View>
      ) : (
        <View style={styles.swipeContainer}>
          <SwipeStack
            events={events}
            onSwipe={handleSwipe}
            onEventPress={handleEventPress}
            onStackEmpty={handleStackEmpty}
            maxVisibleCards={3}
          />
        </View>
      )}
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
    marginBottom: spacing[4],
  },
  toggle: {
    marginTop: spacing[2],
  },
  loadingText: {
    marginTop: spacing[4],
  },
  swipeContainer: {
    flex: 1,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    marginBottom: spacing[8],
  },
  switchButton: {
    minWidth: 200,
  },
});