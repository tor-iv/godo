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

export type ViewType = 'calendar' | 'list';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
}) => {
  const translateX = useSharedValue(currentView === 'calendar' ? 0 : 60);
  
  React.useEffect(() => {
    translateX.value = withSpring(currentView === 'calendar' ? 0 : 60);
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
      
      {/* Calendar option */}
      <TouchableOpacity
        style={styles.option}
        onPress={() => handleViewChange('calendar')}
        activeOpacity={0.7}
      >
        <Feather
          name="calendar"
          size={16}
          color={currentView === 'calendar' ? colors.neutral[0] : colors.neutral[500]}
        />
        <Caption
          style={[
            styles.optionText,
            {
              color: currentView === 'calendar' ? colors.neutral[0] : colors.neutral[500],
            },
          ]}
        >
          Calendar
        </Caption>
      </TouchableOpacity>
      
      {/* List option */}
      <TouchableOpacity
        style={styles.option}
        onPress={() => handleViewChange('list')}
        activeOpacity={0.7}
      >
        <Feather
          name="list"
          size={16}
          color={currentView === 'list' ? colors.neutral[0] : colors.neutral[500]}
        />
        <Caption
          style={[
            styles.optionText,
            {
              color: currentView === 'list' ? colors.neutral[0] : colors.neutral[500],
            },
          ]}
        >
          List
        </Caption>
      </TouchableOpacity>
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
    width: 124,
  },
  slider: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 60,
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
    paddingHorizontal: spacing[2],
    borderRadius: 10,
  },
  optionText: {
    marginLeft: spacing[1],
    fontWeight: '600',
    fontSize: 11,
  },
});