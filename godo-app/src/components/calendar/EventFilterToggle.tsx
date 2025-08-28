import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing } from '../../design';
import { Caption } from '../../components/base';

export type EventFilterType = 'all' | 'private' | 'public';

interface EventFilterToggleProps {
  currentFilter: EventFilterType;
  onFilterChange: (filter: EventFilterType) => void;
}

export const EventFilterToggle: React.FC<EventFilterToggleProps> = props => {
  const { currentFilter, onFilterChange } = props;
  const filters: EventFilterType[] = ['all', 'private', 'public'];
  const filterIcons = {
    all: 'calendar',
    private: 'eye-off',
    public: 'users',
  };

  const filterLabels = {
    all: 'All',
    private: 'Private',
    public: 'Public',
  };

  const currentIndex = filters.indexOf(currentFilter);
  const translateX = useSharedValue(currentIndex * 70);

  React.useEffect(() => {
    const newIndex = filters.indexOf(currentFilter);
    translateX.value = withSpring(newIndex * 70);
  }, [currentFilter, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleFilterChange = (filter: EventFilterType) => {
    if (filter !== currentFilter) {
      onFilterChange(filter);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background slider */}
      <Animated.View style={[styles.slider, animatedStyle]} />

      {/* Filter options */}
      {filters.map(filter => (
        <TouchableOpacity
          key={filter}
          style={styles.option}
          onPress={() => handleFilterChange(filter)}
          activeOpacity={0.7}
        >
          <Feather
            name={filterIcons[filter] as any}
            size={14}
            color={
              currentFilter === filter ? colors.neutral[0] : colors.neutral[500]
            }
          />
          <Caption
            style={[
              styles.optionText,
              {
                color:
                  currentFilter === filter
                    ? colors.neutral[0]
                    : colors.neutral[500],
              },
            ]}
          >
            {filterLabels[filter]}
          </Caption>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 2,
    position: 'relative',
    width: 210,
    maxWidth: '100%',
  },
  slider: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 68,
    height: 32,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    borderRadius: 10,
  },
  optionText: {
    marginLeft: spacing[1],
    fontWeight: '600',
    fontSize: 10,
  },
});
