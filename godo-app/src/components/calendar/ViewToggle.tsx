import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../../design';
import { Caption } from '../../components/base';

export type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
}) => {
  const views: ViewType[] = ['month', 'week', 'day', 'agenda'];
  const viewIcons = {
    month: 'calendar',
    week: 'columns',
    day: 'square',
    agenda: 'list',
  };
  
  const viewLabels = {
    month: 'Month',
    week: 'Week', 
    day: 'Day',
    agenda: 'List',
  };
  
  const currentIndex = views.indexOf(currentView);
  const translateX = useSharedValue(currentIndex * 64);
  
  React.useEffect(() => {
    const newIndex = views.indexOf(currentView);
    translateX.value = withSpring(newIndex * 64); // Adjusted for new width
  }, [currentView, translateX]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  const handleViewChange = (view: ViewType) => {
    if (view !== currentView) {
      onViewChange(view);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Background slider */}
      <Animated.View style={[styles.slider, animatedStyle]} />
      
      {/* View options */}
      {views.map((view) => (
        <TouchableOpacity
          key={view}
          style={styles.option}
          onPress={() => handleViewChange(view)}
          activeOpacity={0.7}
        >
          <Feather
            name={viewIcons[view] as any}
            size={14}
            color={currentView === view ? colors.neutral[0] : colors.neutral[500]}
          />
          <Caption
            style={[
              styles.optionText,
              {
                color: currentView === view ? colors.neutral[0] : colors.neutral[500],
              },
            ]}
          >
            {viewLabels[view]}
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
    width: 260, // Increased width for better spacing
    maxWidth: '100%', // Responsive on small screens
  },
  slider: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 62, // Adjusted for better spacing
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
    fontSize: 10, // Smaller font for more options
  },
});