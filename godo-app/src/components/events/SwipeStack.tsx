import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Event, SwipeDirection } from '../../types';
import SwipeCard from './SwipeCard';
import LoadingCard from '../common/LoadingCard';
import Typography from '../common/Typography';

const { width } = Dimensions.get('window');
const VISIBLE_CARDS = 3;

interface SwipeStackProps {
  events: Event[];
  onSwipe: (direction: SwipeDirection, event: Event) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
}

const SwipeStack: React.FC<SwipeStackProps> = ({
  events,
  onSwipe,
  onLoadMore,
  loading = false,
  hasMore = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: SwipeDirection, event: Event) => {
      onSwipe(direction, event);
      setCurrentIndex((prev) => prev + 1);
    },
    [onSwipe]
  );

  // Load more events when approaching the end
  useEffect(() => {
    if (
      onLoadMore &&
      hasMore &&
      !loading &&
      events.length - currentIndex <= 2
    ) {
      onLoadMore();
    }
  }, [currentIndex, events.length, onLoadMore, hasMore, loading]);

  const getVisibleEvents = () => {
    return events.slice(currentIndex, currentIndex + VISIBLE_CARDS);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Typography variant="h2" color="#6B46C1" style={styles.emptyTitle}>
        No more events!
      </Typography>
      <Typography variant="body" color="#6B7280" style={styles.emptySubtitle}>
        Check back later for new events or adjust your preferences.
      </Typography>
    </View>
  );

  const renderLoadingCards = () => (
    <>
      {Array.from({ length: VISIBLE_CARDS }).map((_, index) => (
        <View
          key={`loading-${index}`}
          style={[
            styles.cardContainer,
            {
              zIndex: VISIBLE_CARDS - index,
              transform: [
                { scale: 1 - index * 0.05 },
                { translateY: -index * 10 },
              ],
            },
          ]}
        >
          <LoadingCard />
        </View>
      ))}
    </>
  );

  if (loading && events.length === 0) {
    return <View style={styles.container}>{renderLoadingCards()}</View>;
  }

  const visibleEvents = getVisibleEvents();

  if (visibleEvents.length === 0 && !loading) {
    return <View style={styles.container}>{renderEmptyState()}</View>;
  }

  return (
    <View style={styles.container}>
      {visibleEvents.map((event, index) => (
        <View key={event.id} style={styles.cardContainer}>
          <SwipeCard
            event={event}
            onSwipe={handleSwipe}
            index={index}
            totalCards={visibleEvents.length}
          />
        </View>
      ))}

      {/* Show loading indicator when loading more */}
      {loading && visibleEvents.length > 0 && (
        <View style={styles.loadingIndicator}>
          <Typography variant="caption" color="#6B7280">
            Loading more events...
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    position: 'absolute',
    width: width - 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SwipeStack;
