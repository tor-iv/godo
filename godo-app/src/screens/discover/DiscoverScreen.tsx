import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Container, Heading2, Body, Button } from '../../components/base';
import {
  TimeFilterToggle,
  TimeFilter,
} from '../../components/discover/TimeFilterToggle';
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
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('now');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    loadEvents();
  }, []);

  // Filter events based on time preference
  useEffect(() => {
    filterEvents();
  }, [events, timeFilter]);

  // Animate elements on screen load
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (events.length === 0) {
        loadEvents();
      }
    }, [])
  );

  const loadEvents = async (showRefreshFeedback = false) => {
    try {
      if (showRefreshFeedback) {
        setRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const eventService = EventService.getInstance();
      const unswipedEvents = await eventService.getUnswipedEvents();
      setEvents(unswipedEvents);

      if (showRefreshFeedback) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      if (showRefreshFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to load events. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterEvents = useCallback(() => {
    const now = new Date();
    let filtered = events;

    if (timeFilter === 'now') {
      // Events happening today or within next 6 hours
      filtered = events.filter(event => {
        const eventDate = new Date(event.datetime);
        const timeDiff = eventDate.getTime() - now.getTime();
        const hoursUntilEvent = timeDiff / (1000 * 60 * 60);
        return hoursUntilEvent >= -2 && hoursUntilEvent <= 6; // Started up to 2h ago or starting within 6h
      });
    } else {
      // Events happening tomorrow or later
      filtered = events.filter(event => {
        const eventDate = new Date(event.datetime);
        const timeDiff = eventDate.getTime() - now.getTime();
        const hoursUntilEvent = timeDiff / (1000 * 60 * 60);
        return hoursUntilEvent > 6; // More than 6 hours away
      });
    }

    setFilteredEvents(filtered);
  }, [events, timeFilter]);

  const handleSwipe = useCallback(
    async (event: Event, direction: SwipeDirection) => {
      setSwipeCount(prev => prev + 1);

      // Haptic feedback based on swipe direction
      const hapticType = {
        [SwipeDirection.RIGHT]: Haptics.ImpactFeedbackStyle.Medium, // Like
        [SwipeDirection.LEFT]: Haptics.ImpactFeedbackStyle.Light, // Pass
        [SwipeDirection.UP]: Haptics.ImpactFeedbackStyle.Heavy, // Love/Save
        [SwipeDirection.DOWN]: Haptics.ImpactFeedbackStyle.Light, // Not interested
      }[direction];

      await Haptics.impactAsync(hapticType);

      // Track the swipe interaction
      const swipeTracker = SwipeInteractionTracker.getInstance();
      swipeTracker.recordSwipe(direction);
    },
    []
  );

  const handleEventPress = useCallback(
    (event: Event) => {
      navigation.navigate('EventDetail', { event });
    },
    [navigation]
  );

  const handleStackEmpty = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'All done! 🎉',
      `You've swiped through all ${timeFilter === 'now' ? 'current' : 'upcoming'} events. Try switching filters or check back later!`,
      [
        {
          text: 'Switch Filter',
          onPress: async () => {
            const newFilter = timeFilter === 'now' ? 'future' : 'now';
            setTimeFilter(newFilter);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
        {
          text: 'Reload Events',
          onPress: () => {
            const eventService = EventService.getInstance();
            // Reset all swipes for demo purposes
            [
              SwipeDirection.LEFT,
              SwipeDirection.RIGHT,
              SwipeDirection.UP,
              SwipeDirection.DOWN,
            ].forEach(direction => {
              eventService
                .getSwipedEvents(direction)
                .forEach(event => eventService.removeSwipe(event.id));
            });
            setSwipeCount(0);
            loadEvents(true);
          },
        },
        { text: 'OK' },
      ]
    );
  }, [timeFilter]);

  const handleRefresh = useCallback(() => {
    loadEvents(true);
  }, []);

  const handleFilterChange = useCallback(async (filter: TimeFilter) => {
    setTimeFilter(filter);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  if (loading) {
    return (
      <Container variant="screenCentered">
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Body
            color={colors.neutral[500]}
            align="center"
            style={styles.loadingText}
          >
            Loading events...
          </Body>
        </Animated.View>
      </Container>
    );
  }

  if (events.length === 0) {
    return (
      <Container variant="screen">
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
          tintColor={colors.primary[500]}
        />
        <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
          <Animated.View style={[styles.emptyContent, { opacity: fadeAnim }]}>
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
              onPress={() => loadEvents(true)}
              style={styles.reloadButton}
            />
          </Animated.View>
        </View>
      </Container>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <Container variant="screen">
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
          tintColor={colors.primary[500]}
        />
        <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
          <Animated.View
            style={[
              styles.filterContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TimeFilterToggle
              selectedFilter={timeFilter}
              onFilterChange={handleFilterChange}
            />
          </Animated.View>
        </View>

        <View
          style={[styles.emptyContainer, { flex: 1, justifyContent: 'center' }]}
        >
          <Animated.View style={[styles.emptyContent, { opacity: fadeAnim }]}>
            <Heading2 align="center" style={styles.emptyTitle}>
              No {timeFilter === 'now' ? 'Current' : 'Upcoming'} Events
            </Heading2>
            <Body
              color={colors.neutral[500]}
              align="center"
              style={styles.emptySubtitle}
            >
              {timeFilter === 'now'
                ? 'No events happening right now. Try "Planning Ahead"!'
                : 'No future events found. Try "Happening Now"!'}
            </Body>
            <Button
              title={`Switch to ${timeFilter === 'now' ? 'Future' : 'Current'} Events`}
              onPress={() =>
                handleFilterChange(timeFilter === 'now' ? 'future' : 'now')
              }
              style={styles.reloadButton}
            />
          </Animated.View>
        </View>
      </Container>
    );
  }

  return (
    <Container variant="screen">
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={[colors.primary[500]]}
        tintColor={colors.primary[500]}
      />

      {/* Enhanced Header with Filter Toggle */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[4],
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.filterContainer}>
          <TimeFilterToggle
            selectedFilter={timeFilter}
            onFilterChange={handleFilterChange}
          />
        </View>
        <Body
          color={colors.neutral[500]}
          align="center"
          style={styles.subtitle}
        >
          Swipe to explore • {swipeCount} swiped • {filteredEvents.length}{' '}
          {timeFilter === 'now' ? 'current' : 'upcoming'}
        </Body>
      </Animated.View>

      {/* Enhanced Swipe Stack */}
      <Animated.View style={[styles.swipeContainer, { opacity: fadeAnim }]}>
        <SwipeStack
          events={filteredEvents}
          onSwipe={handleSwipe}
          onEventPress={handleEventPress}
          onStackEmpty={handleStackEmpty}
          maxVisibleCards={3}
        />
      </Animated.View>
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
  filterContainer: {
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  subtitle: {
    fontSize: deviceInfo.isSmallDevice ? 11 : 13,
    lineHeight: deviceInfo.isSmallDevice ? 14 : 18,
    fontWeight: '500',
    paddingHorizontal: spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
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
  emptyContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyTitle: {
    marginBottom: spacing[3],
  },
  emptySubtitle: {
    marginBottom: spacing[8],
    textAlign: 'center',
    lineHeight: 20,
  },
  reloadButton: {
    minWidth: 180,
    paddingHorizontal: spacing[6],
  },
});
