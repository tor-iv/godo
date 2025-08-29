import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../../design';
import { Caption } from '../../components/base';
import { deviceInfo } from '../../design/responsiveTokens';

export type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = props => {
  const { currentView, onViewChange } = props;
  const views: ViewType[] = ['month', 'week', 'day', 'agenda'];

  const viewIcons = {
    month: 'calendar',
    week: 'columns',
    day: 'square',
    agenda: 'list',
  };

  // Full labels for active state
  const viewLabels = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
  };

  // Abbreviated labels for inactive state
  const viewLabelsShort = {
    month: 'Mo',
    week: 'Wk',
    day: 'Day',
    agenda: 'List',
  };

  // Device-specific sizing
  const getContainerWidth = () => {
    switch (deviceInfo.size) {
      case 'small':
        return 200;
      case 'medium':
        return 240;
      case 'large':
      case 'xlarge':
        return 280;
      default:
        return 240;
    }
  };

  // Calculate button widths - active button gets more space
  const containerWidth = getContainerWidth();
  const totalPadding = 4; // 2px padding on each side
  const availableWidth = containerWidth - totalPadding;
  const activeButtonWidth = Math.floor(availableWidth * 0.4); // 40% for active
  const inactiveButtonWidth = Math.floor(
    (availableWidth - activeButtonWidth) / 3
  ); // Split remaining among 3 inactive

  // Calculate slider position
  const currentIndex = views.indexOf(currentView);
  const getSliderPosition = () => {
    let position = 2; // Initial padding
    for (let i = 0; i < currentIndex; i++) {
      position += inactiveButtonWidth;
    }
    return position;
  };

  const translateX = useSharedValue(getSliderPosition());

  React.useEffect(() => {
    translateX.value = withSpring(getSliderPosition(), {
      damping: 20,
      stiffness: 300,
    });
  }, [currentView]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleViewChange = (view: ViewType) => {
    if (view !== currentView) {
      onViewChange(view);
    }
  };

  const getButtonStyle = (view: ViewType) => {
    const isActive = currentView === view;
    return [
      styles.option,
      {
        width: isActive ? activeButtonWidth : inactiveButtonWidth,
        paddingHorizontal: isActive ? spacing[3] : spacing[1],
        paddingVertical: isActive ? spacing[2] : spacing[1],
      },
    ];
  };

  const getTextLabel = (view: ViewType) => {
    const isActive = currentView === view;
    return isActive ? viewLabels[view] : viewLabelsShort[view];
  };

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      {/* Background slider */}
      <Animated.View
        style={[styles.slider, animatedStyle, { width: activeButtonWidth }]}
      />

      {/* View options */}
      {views.map(view => {
        const isActive = currentView === view;
        return (
          <TouchableOpacity
            key={view}
            style={getButtonStyle(view)}
            onPress={() => handleViewChange(view)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${viewLabels[view]} view`}
            accessibilityState={{ selected: isActive }}
          >
            <Feather
              name={viewIcons[view] as any}
              size={isActive ? 16 : 14}
              color={isActive ? colors.neutral[0] : colors.neutral[500]}
            />
            <Caption
              style={[
                styles.optionText,
                {
                  color: isActive ? colors.neutral[0] : colors.neutral[500],
                  fontSize: isActive ? 12 : 10,
                  fontWeight: isActive ? '700' : '600',
                  marginLeft: isActive ? spacing[2] : spacing[1],
                },
              ]}
              numberOfLines={1}
            >
              {getTextLabel(view)}
            </Caption>
          </TouchableOpacity>
        );
      })}
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
    alignSelf: 'center',
  },
  slider: {
    position: 'absolute',
    top: 2,
    height: 44, // Increased height for proper vertical alignment
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    shadowColor: colors.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    minWidth: 0,
    height: 44, // Increased height for proper vertical alignment
  },
  optionText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
