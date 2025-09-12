import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../design';
import { Body } from '../base';

export type TimeFilter = 'now' | 'future';

interface TimeFilterToggleProps {
  selectedFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

export const TimeFilterToggle: React.FC<TimeFilterToggleProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.option,
          selectedFilter === 'now' && styles.optionSelected,
        ]}
        onPress={() => onFilterChange('now')}
        activeOpacity={0.7}
      >
        <Body
          style={[
            styles.optionText,
            selectedFilter === 'now' && styles.optionTextSelected,
          ]}
        >
          Happening Now
        </Body>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.option,
          selectedFilter === 'future' && styles.optionSelected,
        ]}
        onPress={() => onFilterChange('future')}
        activeOpacity={0.7}
      >
        <Body
          style={[
            styles.optionText,
            selectedFilter === 'future' && styles.optionTextSelected,
          ]}
        >
          Planning Ahead
        </Body>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontWeight: '500',
    color: colors.neutral[500],
    fontSize: 13,
  },
  optionTextSelected: {
    color: colors.primary[500],
    fontWeight: '600',
  },
});
