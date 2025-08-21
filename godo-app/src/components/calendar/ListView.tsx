import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  View,
  Image,
} from 'react-native';
import { format } from 'date-fns';
import { Event } from '../../types';
import { colors, typography, spacing, layout, shadows } from '../../design';
import { Body, Caption, Heading3 } from '../../components/base';
import { formatEventDate, formatPrice } from '../../utils';
import { Feather } from '@expo/vector-icons';

interface ListViewProps {
  events: Event[];
  onEventPress?: (event: Event) => void;
  emptyMessage?: string;
}

export const ListView: React.FC<ListViewProps> = ({
  events,
  onEventPress,
  emptyMessage = 'No events to show',
}) => {
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'NETWORKING': colors.info[500],
      'CULTURE': colors.primary[500],
      'FITNESS': colors.success[500],
      'FOOD': colors.warning[500],
      'NIGHTLIFE': '#ec4899',
      'OUTDOOR': '#059669',
      'PROFESSIONAL': '#6366f1',
    };
    return categoryColors[category] || colors.neutral[400];
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
        <Body color={colors.neutral[400]} align="center" style={styles.emptyText}>
          {emptyMessage}
        </Body>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {events.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.eventCard}
          onPress={() => onEventPress?.(event)}
          activeOpacity={0.7}
        >
          {/* Event Image */}
          <View style={styles.imageContainer}>
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
                size={12} 
                color={colors.neutral[0]} 
              />
            </View>
            
            {/* Price Badge */}
            {(event.priceMin ?? 0) > 0 && (
              <View style={styles.priceBadge}>
                <Caption style={styles.priceText}>
                  {formatPrice(event.priceMin, event.priceMax)}
                </Caption>
              </View>
            )}
          </View>
          
          {/* Event Content */}
          <View style={styles.eventContent}>
            <Heading3 style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Heading3>
            
            <View style={styles.metadataContainer}>
              {/* Date & Time */}
              <View style={styles.metadataRow}>
                <Feather 
                  name="calendar" 
                  size={14} 
                  color={colors.neutral[400]} 
                  style={styles.metadataIcon}
                />
                <Caption color={colors.neutral[500]}>
                  {formatEventDate(event.date)}
                </Caption>
              </View>
              
              {/* Location */}
              <View style={styles.metadataRow}>
                <Feather 
                  name="map-pin" 
                  size={14} 
                  color={colors.neutral[400]}
                  style={styles.metadataIcon}
                />
                <Caption color={colors.neutral[500]} numberOfLines={1} style={styles.locationText}>
                  {event.venue.name}, {event.venue.neighborhood}
                </Caption>
              </View>
              
              {/* Attendees */}
              {event.currentAttendees && event.currentAttendees > 0 && (
                <View style={styles.metadataRow}>
                  <Feather 
                    name="users" 
                    size={14} 
                    color={colors.neutral[400]}
                    style={styles.metadataIcon}
                  />
                  <Caption color={colors.neutral[500]}>
                    {event.currentAttendees} attending
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
            
            {/* Description */}
            {event.description && (
              <Body color={colors.neutral[500]} style={styles.description} numberOfLines={2}>
                {event.description}
              </Body>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  contentContainer: {
    padding: spacing[4],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyText: {
    marginTop: spacing[4],
  },
  eventCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    marginBottom: spacing[4],
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    height: 120,
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 8,
    ...shadows.small,
  },
  priceText: {
    fontWeight: '600',
    color: colors.neutral[800],
  },
  eventContent: {
    padding: spacing[4],
  },
  eventTitle: {
    marginBottom: spacing[2],
    lineHeight: 22,
  },
  metadataContainer: {
    marginBottom: spacing[3],
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  metadataIcon: {
    marginRight: spacing[2],
  },
  locationText: {
    flex: 1,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  friendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  friendCount: {
    color: colors.neutral[0],
    fontSize: 10,
    fontWeight: '700',
  },
  friendText: {
    fontWeight: '500',
  },
  description: {
    lineHeight: 18,
  },
});