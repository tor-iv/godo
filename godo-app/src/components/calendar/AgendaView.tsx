import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisYear,
  startOfDay,
  parseISO,
} from 'date-fns';
import { Event } from '../../types';
import { colors, typography, spacing, layout, shadows } from '../../design';
import { Body, Caption, Heading3 } from '../../components/base';
import { getCategoryColor, formatEventDate } from '../../utils';
import { Feather } from '@expo/vector-icons';

interface AgendaViewProps {
  events: Event[];
  onEventPress?: (event: Event) => void;
}

interface EventsByDate {
  [dateString: string]: Event[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  onEventPress,
}) => {
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: EventsByDate = {};
    
    events.forEach(event => {
      const dateString = format(new Date(event.datetime), 'yyyy-MM-dd');
      if (!grouped[dateString]) {
        grouped[dateString] = [];
      }
      grouped[dateString].push(event);
    });
    
    // Sort events within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
    });
    
    return grouped;
  }, [events]);

  // Get sorted date keys
  const sortedDates = useMemo(() => {
    return Object.keys(eventsByDate).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }, [eventsByDate]);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    }
    
    if (isTomorrow(date)) {
      return 'Tomorrow';
    }
    
    if (isThisWeek(date)) {
      return format(date, 'EEEE'); // "Monday"
    }
    
    if (isThisYear(date)) {
      return format(date, 'EEEE, MMMM d'); // "Monday, August 24"
    }
    
    return format(date, 'EEEE, MMMM d, yyyy'); // "Monday, August 24, 2024"
  };

  const formatDateSubtitle = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date) || isTomorrow(date)) {
      return format(date, 'MMMM d, yyyy');
    }
    
    return format(date, 'MMMM d, yyyy');
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      'NETWORKING': 'users',
      'CULTURE': 'camera',
      'FITNESS': 'activity',
      'FOOD': 'coffee',
      'NIGHTLIFE': 'music',
      'OUTDOOR': 'sun',
      'PROFESSIONAL': 'briefcase',
    };
    return iconMap[category] || 'calendar';
  };

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="calendar" size={48} color={colors.neutral[300]} />
        <Heading3 color={colors.neutral[400]} align="center" style={styles.emptyTitle}>
          No Events Scheduled
        </Heading3>
        <Body color={colors.neutral[400]} align="center" style={styles.emptyText}>
          Your upcoming events will appear here in chronological order
        </Body>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {sortedDates.map((dateString) => {
        const dayEvents = eventsByDate[dateString];
        const date = new Date(dateString);
        const isDayToday = isToday(date);
        const isDayTomorrow = isTomorrow(date);
        
        return (
          <View key={dateString} style={styles.dateSection}>
            {/* Date Header */}
            <View style={[
              styles.dateHeader,
              isDayToday && styles.todayHeader,
              isDayTomorrow && styles.tomorrowHeader,
            ]}>
              <View style={styles.dateHeaderContent}>
                <Heading3 
                  style={[
                    styles.dateTitle,
                    isDayToday && styles.todayTitle,
                    isDayTomorrow && styles.tomorrowTitle,
                  ]}
                >
                  {formatDateHeader(dateString)}
                </Heading3>
                <Caption 
                  color={isDayToday || isDayTomorrow ? colors.neutral[0] : colors.neutral[500]} 
                  style={styles.dateSubtitle}
                >
                  {formatDateSubtitle(dateString)}
                </Caption>
              </View>
              <View style={[
                styles.eventCountBadge,
                isDayToday && styles.todayBadge,
                isDayTomorrow && styles.tomorrowBadge,
              ]}>
                <Caption 
                  style={[
                    styles.eventCountText,
                    (isDayToday || isDayTomorrow) && styles.eventCountTextLight,
                  ]}
                >
                  {dayEvents.length}
                </Caption>
              </View>
            </View>

            {/* Events for this date */}
            <View style={styles.eventsContainer}>
              {dayEvents.map((event, index) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventCard,
                    index === dayEvents.length - 1 && styles.lastEventCard,
                  ]}
                  onPress={() => onEventPress?.(event)}
                  activeOpacity={0.7}
                >
                  {/* Event Image */}
                  <View style={styles.eventImageContainer}>
                    <Image 
                      source={{ uri: event.imageUrl }} 
                      style={styles.eventImage}
                      resizeMode="cover"
                    />
                    
                    {/* Category Badge */}
                    <View 
                      style={[
                        styles.categoryBadge, 
                        { backgroundColor: getCategoryColor(event.category) }
                      ]}
                    >
                      <Feather 
                        name={getCategoryIcon(event.category) as any} 
                        size={10} 
                        color={colors.neutral[0]} 
                      />
                    </View>
                  </View>

                  {/* Event Content */}
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Body style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                      </Body>
                      <Caption color={colors.neutral[500]} style={styles.eventTime}>
                        {format(new Date(event.datetime), 'h:mm a')}
                      </Caption>
                    </View>

                    {/* Event Details */}
                    <View style={styles.eventDetails}>
                      {/* Location */}
                      <View style={styles.detailRow}>
                        <Feather 
                          name="map-pin" 
                          size={12} 
                          color={colors.neutral[400]}
                          style={styles.detailIcon}
                        />
                        <Caption color={colors.neutral[500]} numberOfLines={1} style={styles.detailText}>
                          {event.venue.name}
                          {event.venue.neighborhood && `, ${event.venue.neighborhood}`}
                        </Caption>
                      </View>

                      {/* Attendees */}
                      {event.currentAttendees && event.currentAttendees > 0 && (
                        <View style={styles.detailRow}>
                          <Feather 
                            name="users" 
                            size={12} 
                            color={colors.neutral[400]}
                            style={styles.detailIcon}
                          />
                          <Caption color={colors.neutral[500]}>
                            {event.currentAttendees} attending
                          </Caption>
                        </View>
                      )}

                      {/* Price */}
                      {(event.priceMin ?? 0) > 0 && (
                        <View style={styles.detailRow}>
                          <Feather 
                            name="dollar-sign" 
                            size={12} 
                            color={colors.neutral[400]}
                            style={styles.detailIcon}
                          />
                          <Caption color={colors.neutral[500]}>
                            {event.priceMax && event.priceMax !== event.priceMin 
                              ? `$${event.priceMin} - $${event.priceMax}`
                              : `$${event.priceMin}`
                            }
                          </Caption>
                        </View>
                      )}
                    </View>

                    {/* Friends Attending */}
                    {event.friendsAttending && event.friendsAttending > 0 && (
                      <View style={styles.socialRow}>
                        <View style={styles.friendIndicator}>
                          <Caption style={styles.friendCount}>+{event.friendsAttending}</Caption>
                        </View>
                        <Caption color={colors.primary[600]} style={styles.friendText}>
                          {event.friendsAttending} {event.friendsAttending === 1 ? 'friend' : 'friends'} interested
                        </Caption>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  scrollContent: {
    paddingVertical: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  dateSection: {
    marginBottom: spacing[4],
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.neutral[50],
  },
  todayHeader: {
    backgroundColor: colors.primary[500],
  },
  tomorrowHeader: {
    backgroundColor: colors.primary[400],
  },
  dateHeaderContent: {
    flex: 1,
  },
  dateTitle: {
    marginBottom: spacing[1] / 2,
    fontWeight: '700',
  },
  todayTitle: {
    color: colors.neutral[0],
  },
  tomorrowTitle: {
    color: colors.neutral[0],
  },
  dateSubtitle: {
    fontSize: 12,
  },
  eventCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBadge: {
    backgroundColor: colors.neutral[0],
  },
  tomorrowBadge: {
    backgroundColor: colors.neutral[0],
  },
  eventCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  eventCountTextLight: {
    color: colors.primary[600],
  },
  eventsContainer: {
    paddingHorizontal: spacing[4],
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    marginBottom: spacing[2],
    overflow: 'hidden',
    ...shadows.small,
  },
  lastEventCard: {
    marginBottom: 0,
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing[1],
    left: spacing[1],
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    padding: spacing[3],
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  eventTitle: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
    marginRight: spacing[2],
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 8,
  },
  eventDetails: {
    marginBottom: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  detailIcon: {
    marginRight: spacing[2],
    width: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  friendIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  friendCount: {
    color: colors.neutral[0],
    fontSize: 9,
    fontWeight: '700',
  },
  friendText: {
    fontWeight: '500',
    fontSize: 12,
  },
});