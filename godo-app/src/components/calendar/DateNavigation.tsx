import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
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
} from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../design';
import { Body, Button } from '../../components/base';
import { ViewType } from './ViewToggle';

interface DateNavigationProps {
  selectedDate: string;
  viewType: ViewType;
  onDateChange: (date: string) => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  viewType,
  onDateChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedDateObj = new Date(selectedDate);

  const getDisplayText = () => {
    switch (viewType) {
      case 'day':
        return format(selectedDateObj, 'EEEE, MMM d');
      case 'week': {
        const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
        }
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(selectedDateObj, 'MMMM yyyy');
      case 'agenda':
        return 'Upcoming Events';
      default:
        return format(selectedDateObj, 'MMM d, yyyy');
    }
  };

  const navigatePrevious = () => {
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

    onDateChange(format(newDate, 'yyyy-MM-dd'));
  };

  const navigateNext = () => {
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

    onDateChange(format(newDate, 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    onDateChange(today);
  };

  const handleDateSelect = (day: any) => {
    onDateChange(day.dateString);
    setShowDatePicker(false);
  };

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
          <Body style={styles.titleText}>{getDisplayText()}</Body>
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
      >
        <Feather name="chevron-left" size={20} color={colors.neutral[600]} />
      </TouchableOpacity>

      {/* Date display */}
      <TouchableOpacity
        style={styles.titleContainer}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Body style={styles.titleText}>{getDisplayText()}</Body>
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
      >
        <Feather name="chevron-right" size={20} color={colors.neutral[600]} />
      </TouchableOpacity>

      {/* Today button */}
      {!isToday(selectedDateObj) && (
        <TouchableOpacity
          style={styles.todayButton}
          onPress={goToToday}
          activeOpacity={0.7}
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
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  titleText: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  calendarIcon: {
    marginLeft: spacing[2],
  },
  todayButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
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
    borderRadius: 16,
    padding: spacing[4],
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
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