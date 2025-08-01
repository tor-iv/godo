import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addHours,
  isWithinInterval,
  getHours,
  getMinutes,
} from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { Event, EventCategory } from '../../types';
import { getCategoryIcon } from '../../data/mockEvents';

interface WeekViewProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventPress?: (event: Event) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const HOURS_IN_DAY = 24;
const DAY_WIDTH = (screenWidth - 60) / 7; // Account for time column

const getCategoryColor = (category: EventCategory): string => {
  switch (category) {
    case EventCategory.NETWORKING:
      return COLORS.SECONDARY;
    case EventCategory.CULTURE:
      return '#EC4899';
    case EventCategory.FITNESS:
      return COLORS.SUCCESS;
    case EventCategory.FOOD:
      return COLORS.WARNING;
    case EventCategory.NIGHTLIFE:
      return COLORS.ACCENT;
    case EventCategory.OUTDOOR:
      return '#10B981';
    case EventCategory.PROFESSIONAL:
      return '#3B82F6';
    default:
      return COLORS.PRIMARY;
  }
};

const TimeColumn = () => {
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);
  
  return (
    <View style={styles.timeColumn}>
      {hours.map((hour) => (
        <View key={hour} style={styles.timeSlot}>
          <Text style={styles.timeText}>
            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
          </Text>
        </View>
      ))}
    </View>
  );
};

const DayColumn = ({ 
  date, 
  events, 
  isSelected, 
  onPress, 
  onEventPress 
}: {
  date: Date;
  events: Event[];
  isSelected: boolean;
  onPress: () => void;
  onEventPress?: (event: Event) => void;
}) => {
  const dayEvents = events.filter(event => isSameDay(new Date(event.date), date));
  const isToday = isSameDay(date, new Date());

  const getEventPosition = (event: Event) => {
    const eventDate = new Date(event.date);
    const hours = getHours(eventDate);
    const minutes = getMinutes(eventDate);
    const topPosition = (hours * HOUR_HEIGHT) + (minutes * HOUR_HEIGHT / 60);
    
    return {
      top: topPosition,
      height: HOUR_HEIGHT * 1.5, // Default 1.5 hour duration
    };
  };

  return (
    <TouchableOpacity style={styles.dayColumn} onPress={onPress}>
      <View style={[
        styles.dayHeader,
        isSelected && styles.dayHeaderSelected,
        isToday && styles.dayHeaderToday,
      ]}>
        <Text style={[
          styles.dayHeaderText,
          isSelected && styles.dayHeaderTextSelected,
          isToday && styles.dayHeaderTextToday,
        ]}>
          {format(date, 'EEE')}
        </Text>
        <Text style={[
          styles.dayNumberText,
          isSelected && styles.dayNumberTextSelected,
          isToday && styles.dayNumberTextToday,
        ]}>
          {format(date, 'd')}
        </Text>
      </View>
      
      <View style={styles.dayContent}>
        {/* Hour grid lines */}
        {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
          <View key={hour} style={[styles.hourLine, { top: hour * HOUR_HEIGHT }]} />
        ))}
        
        {/* Events */}
        {dayEvents.map((event, index) => {
          const position = getEventPosition(event);
          return (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventBlock,
                {
                  top: position.top,
                  height: position.height,
                  backgroundColor: getCategoryColor(event.category),
                  left: index * 2, // Slight offset for overlapping events
                  right: index * 2,
                }
              ]}
              onPress={() => onEventPress?.(event)}
            >
              <Text style={styles.eventBlockTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.eventBlockTime}>
                {format(new Date(event.date), 'h:mm a')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

export default function WeekView({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventPress 
}: WeekViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get the week days starting from Sunday
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to current time on mount
  React.useEffect(() => {
    const currentHour = new Date().getHours();
    const scrollToPosition = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: scrollToPosition, animated: false });
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
      {/* Week header */}
      <View style={styles.weekHeader}>
        <View style={styles.timeColumnHeader} />
        {weekDays.map((day) => (
          <View key={day.toISOString()} style={styles.dayHeaderContainer}>
            <TouchableOpacity
              style={[
                styles.dayHeaderButton,
                isSameDay(day, selectedDate) && styles.dayHeaderButtonSelected,
                isSameDay(day, new Date()) && styles.dayHeaderButtonToday,
              ]}
              onPress={() => onDateSelect(day)}
            >
              <Text style={[
                styles.dayHeaderButtonText,
                isSameDay(day, selectedDate) && styles.dayHeaderButtonTextSelected,
                isSameDay(day, new Date()) && styles.dayHeaderButtonTextToday,
              ]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[
                styles.dayHeaderButtonNumber,
                isSameDay(day, selectedDate) && styles.dayHeaderButtonNumberSelected,
                isSameDay(day, new Date()) && styles.dayHeaderButtonNumberToday,
              ]}>
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Scrollable content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: HOURS_IN_DAY * HOUR_HEIGHT }}
      >
        <View style={styles.weekContent}>
          <TimeColumn />
          {weekDays.map((day) => (
            <DayColumn
              key={day.toISOString()}
              date={day}
              events={events}
              isSelected={isSameDay(day, selectedDate)}
              onPress={() => onDateSelect(day)}
              {...(onEventPress && { onEventPress })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
    paddingVertical: SPACING.SM,
    ...SHADOWS.SMALL,
  },
  timeColumnHeader: {
    width: 50,
  },
  dayHeaderContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderButton: {
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  dayHeaderButtonSelected: {
    backgroundColor: COLORS.SECONDARY,
  },
  dayHeaderButtonToday: {
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  dayHeaderButtonText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayHeaderButtonTextSelected: {
    color: COLORS.WHITE,
  },
  dayHeaderButtonTextToday: {
    color: COLORS.ACCENT,
  },
  dayHeaderButtonNumber: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_DARK,
    fontWeight: 'bold',
  },
  dayHeaderButtonNumberSelected: {
    color: COLORS.WHITE,
  },
  dayHeaderButtonNumberToday: {
    color: COLORS.ACCENT,
  },
  scrollView: {
    flex: 1,
  },
  weekContent: {
    flexDirection: 'row',
    position: 'relative',
  },
  timeColumn: {
    width: 50,
    backgroundColor: COLORS.WHITE,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER_LIGHT,
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: SPACING.XS,
    paddingRight: SPACING.XS,
  },
  timeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'right',
  },
  dayColumn: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER_LIGHT,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  dayHeaderSelected: {
    backgroundColor: COLORS.SECONDARY,
  },
  dayHeaderToday: {
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  dayHeaderText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '500',
  },
  dayHeaderTextSelected: {
    color: COLORS.WHITE,
  },
  dayHeaderTextToday: {
    color: COLORS.ACCENT,
  },
  dayNumberText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_DARK,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dayNumberTextSelected: {
    color: COLORS.WHITE,
  },
  dayNumberTextToday: {
    color: COLORS.ACCENT,
  },
  dayContent: {
    flex: 1,
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.BORDER_LIGHT,
  },
  eventBlock: {
    position: 'absolute',
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    padding: SPACING.XS,
    margin: 1,
    ...SHADOWS.SMALL,
  },
  eventBlockTitle: {
    fontSize: FONT_SIZES.XS - 1,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventBlockTime: {
    fontSize: FONT_SIZES.XS - 2,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});