import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewToggleProps {
  activeView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

interface ViewOption {
  key: CalendarViewType;
  label: string;
  icon: string;
}

const viewOptions: ViewOption[] = [
  { key: 'month', label: 'Month', icon: '📅' },
  { key: 'week', label: 'Week', icon: '📊' },
  { key: 'day', label: 'Day', icon: '🗓️' },
  { key: 'agenda', label: 'List', icon: '📋' },
];

export default function CalendarViewToggle({ 
  activeView, 
  onViewChange 
}: CalendarViewToggleProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {viewOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.viewButton,
              activeView === option.key && styles.viewButtonActive,
            ]}
            onPress={() => onViewChange(option.key)}
          >
            <Text style={styles.viewIcon}>{option.icon}</Text>
            <Text
              style={[
                styles.viewLabel,
                activeView === option.key && styles.viewLabelActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SMALL,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    gap: SPACING.XS,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    backgroundColor: COLORS.OFF_WHITE,
    marginRight: SPACING.XS,
    ...SHADOWS.SMALL,
  },
  viewButtonActive: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
    ...SHADOWS.MEDIUM,
  },
  viewIcon: {
    fontSize: FONT_SIZES.SM,
    marginRight: SPACING.XS,
  },
  viewLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_MEDIUM,
  },
  viewLabelActive: {
    color: COLORS.WHITE,
  },
});