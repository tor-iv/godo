import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { borders, flatColors } from '../../design/flatTokens';
import { colors, spacing } from '../../design';

export type SegmentedControlOption = {
  label: string;
  value: string;
};

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
              isFirst && styles.segmentFirst,
              isLast && styles.segmentLast,
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${option.label}, ${isSelected ? 'selected' : 'not selected'}`}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: borders.widths.thin,
    borderColor: borders.colors.light,
    borderRadius: borders.radius.medium,
    overflow: 'hidden',
    backgroundColor: flatColors.backgrounds.secondary,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRightWidth: borders.widths.thin,
    borderRightColor: borders.colors.light,
  },
  segmentFirst: {
    borderTopLeftRadius: borders.radius.medium,
    borderBottomLeftRadius: borders.radius.medium,
  },
  segmentLast: {
    borderRightWidth: 0,
    borderTopRightRadius: borders.radius.medium,
    borderBottomRightRadius: borders.radius.medium,
  },
  segmentSelected: {
    backgroundColor: colors.primary[500],
    borderRightColor: colors.primary[500],
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  segmentTextSelected: {
    color: '#FFFFFF',
  },
});