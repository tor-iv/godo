import React, { useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SwipeStack } from '../events';
import { mockEvents } from '../../data/mockEvents';
import { SwipeDirection, Event } from '../../types';
import { getResponsiveDimensions, isWeb } from '../../utils/responsive';

const SwipeDemo: React.FC = () => {
  const { containerPadding } = getResponsiveDimensions();

  const handleSwipe = useCallback((direction: SwipeDirection, event: Event) => {
    let message = '';
    switch (direction) {
      case SwipeDirection.RIGHT:
        message = `Added "${event.title}" to your calendar!`;
        break;
      case SwipeDirection.LEFT:
        message = `Passed on "${event.title}"`;
        break;
      case SwipeDirection.UP:
        message = `Saved "${event.title}" for later`;
        break;
      case SwipeDirection.DOWN:
        message = `Liked "${event.title}" but can't go`;
        break;
    }

    Alert.alert('Swipe Action', message);
  }, []);

  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding }]}>
      <SwipeStack
        events={mockEvents}
        onSwipe={handleSwipe}
        loading={false}
        hasMore={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SwipeDemo;
