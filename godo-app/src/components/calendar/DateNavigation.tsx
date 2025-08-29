import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Vibration,
  Dimensions,
} from 'react-native';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getWeek,
  getYear,
} from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../design';
import { Body, Button } from '../../components/base';
import { ViewType } from './ViewToggle';

interface DateNavigationProps {
  selectedDate: string;
  viewType: ViewType;
  onDateChange: (date: string) => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = props => {
  const { selectedDate, viewType, onDateChange } = props;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const selectedDateObj = new Date(selectedDate);

  // Calculate available width for responsive text formatting
  const screenWidth = Dimensions.get('window').width;
  const availableTextWidth = useMemo(() => {
    const navigationButtonWidth = 44 * 2; // Left and right arrows
    const paddingWidth = spacing[4] * 2; // Container padding
    const todayButtonWidth = isToday(selectedDateObj) ? 0 : 80; // Today button when visible
    const calendarIconWidth = 24; // Calendar icon space
    const margins = spacing[2] * 2; // Title container margins

    return (
      screenWidth -
      navigationButtonWidth -
      paddingWidth -
      todayButtonWidth -
      calendarIconWidth -
      margins
    );
  }, [screenWidth, selectedDateObj]);

  // Smart year display logic - show year when contextually important
  const shouldShowYear = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const selectedYear = getYear(selectedDateObj);
    const isNearYearBoundary =
      selectedDateObj.getMonth() === 0 || // January
      selectedDateObj.getMonth() === 11; // December

    return selectedYear !== currentYear || isNearYearBoundary;
  }, [selectedDateObj]);

  // Enhanced responsive text formatting
  const getResponsiveDisplayText = useCallback(() => {
    const avgCharWidth = 8; // Approximate character width for font size 16
    const maxChars = Math.floor(availableTextWidth / avgCharWidth);

    switch (viewType) {
      case 'day': {
        const showYear = shouldShowYear();

        if (maxChars < 10) {
          // Ultra compact: "Jan 1" or "1/1" if very tight
          return maxChars < 7
            ? format(selectedDateObj, 'M/d')
            : format(selectedDateObj, 'MMM d');
        }
        if (maxChars < 14) {
          // Compact: "Mon, Jan 1"
          return (
            format(selectedDateObj, 'EEE, MMM d') +
            (showYear ? `, ${format(selectedDateObj, 'yy')}` : '')
          );
        }
        if (maxChars < 20) {
          // Standard: "Monday, Jan 1"
          return (
            format(selectedDateObj, 'EEEE, MMM d') +
            (showYear ? `, ${format(selectedDateObj, 'yy')}` : '')
          );
        }
        // Full: "Monday, January 1, 2025"
        return format(
          selectedDateObj,
          showYear ? 'EEEE, MMMM d, yyyy' : 'EEEE, MMMM d'
        );
      }

      case 'week': {
        const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
        const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();
        const isSameYear = weekStart.getFullYear() === weekEnd.getFullYear();
        const showYear = shouldShowYear();
        const weekNumber = getWeek(selectedDateObj, { weekStartsOn: 1 });

        if (maxChars < 10) {
          // Ultra compact: "W48" or "1-7"
          return maxChars < 7
            ? `W${weekNumber}`
            : `${format(weekStart, 'd')}-${format(weekEnd, 'd')}`;
        }
        if (maxChars < 14) {
          // Compact: "1-7 Jan" or "31 Oct-6 Nov"
          if (isSameMonth) {
            return `${format(weekStart, 'd')}-${format(weekEnd, 'd')} ${format(weekStart, 'MMM')}`;
          }
          return `${format(weekStart, 'd')} ${format(weekStart, 'MMM')}-${format(weekEnd, 'd')} ${format(weekEnd, 'MMM')}`;
        }
        if (maxChars < 18) {
          // Standard: "Jan 1-7" or "Oct 25-Nov 2"
          if (isSameMonth) {
            return (
              `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}` +
              (showYear ? ` '${format(weekStart, 'yy')}` : '')
            );
          }
          return (
            `${format(weekStart, 'MMM d')}-${format(weekEnd, 'MMM d')}` +
            (showYear && !isSameYear ? ` '${format(weekEnd, 'yy')}` : '')
          );
        }
        // Full: "January 1-7, 2025" or "Oct 25 - Nov 2, 2025"
        if (isSameMonth) {
          return `${format(weekStart, 'MMMM d')}-${format(weekEnd, 'd')}${showYear ? `, ${format(weekStart, 'yyyy')}` : ''}`;
        }
        if (isSameYear) {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}${showYear ? `, ${format(weekStart, 'yyyy')}` : ''}`;
        }
        return `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }

      case 'month':
        return format(selectedDateObj, shouldShowYear() ? 'MMMM yyyy' : 'MMMM');

      case 'agenda':
        return 'Upcoming Events';

      default:
        return format(selectedDateObj, 'MMM d, yyyy');
    }
  }, [viewType, selectedDateObj, availableTextWidth, shouldShowYear]);

  // Legacy methods for compatibility (can be removed if not used elsewhere)
  const getDisplayText = () => getResponsiveDisplayText();

  const getCompactDisplayText = () => {
    // Force a more compact version by reducing available width
    const compactWidth = availableTextWidth * 0.7;
    const avgCharWidth = 8;
    const maxChars = Math.floor(compactWidth / avgCharWidth);

    switch (viewType) {
      case 'day':
        return maxChars < 12
          ? format(selectedDateObj, 'EEE, MMM d')
          : format(selectedDateObj, 'EEEE, MMM d');
      case 'week': {
        const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}`;
      }
      case 'month':
        return format(selectedDateObj, 'MMM yyyy');
      case 'agenda':
        return 'Upcoming';
      default:
        return format(selectedDateObj, 'MMM d');
    }
  };

  const navigatePrevious = useCallback(() => {
    if (isNavigating) return;

    setIsNavigating(true);
    console.log(
      `[DateNavigation] Navigating previous from ${selectedDate} in ${viewType} view`
    );

    const currentDate = new Date(selectedDate);
    let newDate: Date;

    switch (viewType) {
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
      default:
        newDate = subDays(currentDate, 1);
    }

    const newDateString = format(newDate, 'yyyy-MM-dd');
    console.log(`[DateNavigation] New date: ${newDateString}`);
    onDateChange(newDateString);

    setTimeout(() => setIsNavigating(false), 200);
  }, [selectedDate, viewType, onDateChange, isNavigating]);

  const navigateNext = useCallback(() => {
    if (isNavigating) return;

    setIsNavigating(true);
    console.log(
      `[DateNavigation] Navigating next from ${selectedDate} in ${viewType} view`
    );

    const currentDate = new Date(selectedDate);
    let newDate: Date;

    switch (viewType) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      default:
        newDate = addDays(currentDate, 1);
    }

    const newDateString = format(newDate, 'yyyy-MM-dd');
    console.log(`[DateNavigation] New date: ${newDateString}`);
    onDateChange(newDateString);

    setTimeout(() => setIsNavigating(false), 200);
  }, [selectedDate, viewType, onDateChange, isNavigating]);

  const goToToday = useCallback(() => {
    if (isNavigating) return;

    setIsNavigating(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    console.log(
      `[DateNavigation] Going to today: ${today} from current: ${selectedDate}`
    );

    // Add haptic feedback
    Vibration.vibrate(50);

    onDateChange(today);

    setTimeout(() => setIsNavigating(false), 300);
  }, [selectedDate, onDateChange, isNavigating]);

  const handleDateSelect = useCallback(
    (day: any) => {
      console.log(
        `[DateNavigation] Date selected from picker: ${day.dateString}`
      );
      onDateChange(day.dateString);
      setShowDatePicker(false);
    },
    [onDateChange]
  );

  const calendarTheme = {
    backgroundColor: colors.neutral[0],
    calendarBackground: colors.neutral[0],
    textSectionTitleColor: colors.neutral[600],
    selectedDayBackgroundColor: colors.primary[500],
    selectedDayTextColor: colors.neutral[0],
    todayTextColor: colors.primary[600],
    dayTextColor: colors.neutral[800],
    textDisabledColor: colors.neutral[300],
    arrowColor: colors.primary[500],
    monthTextColor: colors.neutral[800],
    indicatorColor: colors.primary[500],
    textDayFontWeight: '400' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '600' as const,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  // Don't show navigation for agenda view
  if (viewType === 'agenda') {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Body
            style={styles.titleText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {getResponsiveDisplayText()}
          </Body>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Previous button */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={navigatePrevious}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Go to previous ${viewType}`}
        accessibilityHint={`Navigate to the previous ${viewType} in the calendar`}
        accessible={true}
        focusable={true}
      >
        <Feather name="chevron-left" size={20} color={colors.neutral[600]} />
      </TouchableOpacity>

      {/* Date display */}
      <TouchableOpacity
        style={styles.titleContainer}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Current date: ${getResponsiveDisplayText()}`}
        accessibilityHint="Tap to open date picker"
        accessible={true}
        focusable={true}
      >
        <Body
          style={styles.titleText}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {getResponsiveDisplayText()}
        </Body>
        <Feather
          name="calendar"
          size={16}
          color={colors.neutral[500]}
          style={styles.calendarIcon}
        />
      </TouchableOpacity>

      {/* Next button */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={navigateNext}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Go to next ${viewType}`}
        accessibilityHint={`Navigate to the next ${viewType} in the calendar`}
        accessible={true}
        focusable={true}
      >
        <Feather name="chevron-right" size={20} color={colors.neutral[600]} />
      </TouchableOpacity>

      {/* Today button */}
      {!isToday(selectedDateObj) && (
        <TouchableOpacity
          style={styles.todayButton}
          onPress={goToToday}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          accessibilityHint="Jump to today's date"
          accessible={true}
          focusable={true}
        >
          <Body style={styles.todayText}>Today</Body>
        </TouchableOpacity>
      )}

      {/* Date picker modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Calendar
              current={selectedDate}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: colors.primary[500],
                },
              }}
              onDayPress={handleDateSelect}
              theme={calendarTheme}
              firstDay={1}
              hideExtraDays={true}
              enableSwipeMonths={true}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowDatePicker(false)}
                variant="ghost"
                size="small"
                style={styles.modalButton}
              />
              <Button
                title="Today"
                onPress={() => {
                  goToToday();
                  setShowDatePicker(false);
                }}
                variant="primary"
                size="small"
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    minHeight: 60,
  },
  navButton: {
    width: 44, // Increased to meet 44pt minimum touch target
    height: 44, // Increased to meet 44pt minimum touch target
    borderRadius: 8,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    minWidth: 100, // Ensure minimum readable width
    maxWidth: 300, // Prevent excessive stretching on large screens
  },
  titleText: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    flexShrink: 1,
    color: colors.neutral[800],
    // Allow text to scale down gracefully when needed
    maxWidth: '100%',
  },
  calendarIcon: {
    marginLeft: spacing[2],
  },
  todayButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.neutral[0],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  todayText: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  modalContent: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing[4],
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
  },
});
