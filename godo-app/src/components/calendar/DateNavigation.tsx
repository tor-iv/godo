import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { format, addDays, addWeeks, addMonths, isSameDay } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { CalendarViewType } from './CalendarViewToggle';

interface DateNavigationProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onTodayPress: () => void;
}

const getDateTitle = (date: Date, viewType: CalendarViewType): string => {
  switch (viewType) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week':
      return `Week of ${format(date, 'MMM d, yyyy')}`;
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    case 'agenda':
      return 'My Events';
    default:
      return format(date, 'MMMM yyyy');
  }
};

const navigateDate = (date: Date, viewType: CalendarViewType, direction: 'prev' | 'next'): Date => {
  const multiplier = direction === 'next' ? 1 : -1;
  
  switch (viewType) {
    case 'month':
      return addMonths(date, multiplier);
    case 'week':
      return addWeeks(date, multiplier);
    case 'day':
      return addDays(date, multiplier);
    case 'agenda':
      return date; // No navigation for agenda
    default:
      return date;
  }
};

export default function DateNavigation({ 
  currentDate, 
  viewType, 
  onDateChange, 
  onTodayPress 
}: DateNavigationProps) {
  const handlePrevious = () => {
    const newDate = navigateDate(currentDate, viewType, 'prev');
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = navigateDate(currentDate, viewType, 'next');
    onDateChange(newDate);
  };

  const isToday = isSameDay(currentDate, new Date());
  const showNavigation = viewType !== 'agenda';

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <Text style={styles.dateTitle}>{getDateTitle(currentDate, viewType)}</Text>
        {!isToday && (
          <TouchableOpacity style={styles.todayButton} onPress={onTodayPress}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {showNavigation && (
        <View style={styles.navigationSection}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginRight: SPACING.SM,
  },
  todayButton: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    ...SHADOWS.SMALL,
  },
  todayButtonText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  navigationSection: {
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.OFF_WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  navButtonText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.PRIMARY_PURPLE,
    fontWeight: 'bold',
  },
});