import * as React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Event } from '../../types';
import { colors, typography, spacing, shadows } from '../../design';
import {
  formatEventDate,
  formatPrice,
  formatFriendsAttending,
} from '../../utils';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  style?: object;
}

export const EventCard: React.FC<EventCardProps> = props => {
  const { event, onPress, style } = props;
  // Simple null check
  if (!event) {
    return null;
  }

  const safeEvent = event;
  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      NETWORKING: 'users',
      CULTURE: 'camera',
      FITNESS: 'activity',
      FOOD: 'coffee',
      NIGHTLIFE: 'music',
      OUTDOOR: 'sun',
      PROFESSIONAL: 'briefcase',
    };
    return iconMap[category] || 'calendar';
  };

  const formatCapacity = (current?: number, capacity?: number): string => {
    if (!current || current === 0) return '0 attending';
    const currentNum = Number(current);
    if (!capacity) return `${currentNum} attending`;
    const capacityNum = Number(capacity);
    return `${currentNum}/${capacityNum} attending`;
  };

  // Safe text rendering helper to prevent text rendering errors
  const safeText = (value: any, fallback: string = ''): string => {
    try {
      if (value === null || value === undefined || value === '')
        return fallback;
      if (typeof value === 'object' && value !== null) return fallback;
      const stringValue = String(value).trim();
      if (
        stringValue === '' ||
        stringValue === 'undefined' ||
        stringValue === 'null'
      ) {
        return fallback;
      }
      return stringValue;
    } catch (error) {
      return fallback;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Hero Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: safeEvent.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          locations={[0.4, 1]}
          style={styles.imageGradient}
        />

        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: colors.primary[500] },
          ]}
        >
          <Feather
            name={
              getCategoryIcon(
                safeEvent.category
              ) as keyof typeof Feather.glyphMap
            }
            size={12}
            color={colors.neutral[0]}
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryText}>
            {safeText(safeEvent.category?.replace(/_/g, ' '), 'Event')}
          </Text>
        </View>

        {/* Price Badge (if paid event) */}
        {(safeEvent.priceMin ?? 0) > 0 ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {(() => {
                try {
                  const formattedPrice = formatPrice(
                    safeEvent.priceMin,
                    safeEvent.priceMax
                  );
                  return safeText(formattedPrice, 'Free');
                } catch (error) {
                  return 'Free';
                }
              })()}
            </Text>
          </View>
        ) : null}
        {/* Featured Badge */}
        {safeEvent.isFeatured ? (
          <View style={styles.featuredBadge}>
            <Feather name="star" size={16} color={colors.warning[500]} />
          </View>
        ) : null}
      </View>

      {/* Content Container */}
      <View style={styles.content}>
        {/* Event Title */}
        <Text style={styles.title} numberOfLines={2}>
          {safeText(safeEvent.title, 'Event Title')}
        </Text>

        {/* Event Metadata */}
        <View style={styles.metadata}>
          {/* Date & Time */}
          <View style={styles.metadataRow}>
            <Feather
              name="calendar"
              size={16}
              color={colors.neutral[400]}
              style={styles.metadataIcon}
            />
            <Text style={styles.metadataText}>
              {(() => {
                try {
                  // Use datetime string instead of Date object for consistency
                  const formattedDate = formatEventDate(
                    safeEvent.datetime || safeEvent.date
                  );
                  return safeText(formattedDate, 'Date TBA');
                } catch (error) {
                  return 'Date TBA';
                }
              })()}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.metadataRow}>
            <Feather
              name="map-pin"
              size={16}
              color={colors.neutral[400]}
              style={styles.metadataIcon}
            />
            <Text style={styles.metadataText} numberOfLines={1}>
              {(() => {
                if (safeEvent.venue?.neighborhood) {
                  const venueName = safeText(safeEvent.venue.name, 'Venue');
                  const neighborhood = safeText(
                    safeEvent.venue.neighborhood,
                    ''
                  );
                  if (neighborhood) {
                    return `${venueName} • ${neighborhood}`;
                  }
                  return venueName;
                }
                return safeText(safeEvent.venue?.name, 'Venue TBA');
              })()}
            </Text>
          </View>

          {/* Attendees (if available) */}
          {safeEvent.currentAttendees && safeEvent.currentAttendees > 0 ? (
            <View style={styles.metadataRow}>
              <Feather
                name="users"
                size={16}
                color={colors.neutral[400]}
                style={styles.metadataIcon}
              />
              <Text style={styles.metadataText}>
                {safeText(
                  formatCapacity(
                    safeEvent.currentAttendees,
                    safeEvent.capacity
                  ),
                  '0 attending'
                )}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Social Proof */}
        {safeEvent.friendsAttending && safeEvent.friendsAttending > 0 ? (
          <View style={styles.socialProof}>
            <View style={styles.friendIndicator}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>
                  {`+${safeText(safeEvent.friendsAttending, '0')}`}
                </Text>
              </View>
            </View>
            <Text style={styles.socialText}>
              {(() => {
                try {
                  const formattedFriends = formatFriendsAttending(
                    safeEvent.friendsAttending
                  );
                  return safeText(formattedFriends, '');
                } catch (error) {
                  return '';
                }
              })()}
            </Text>
          </View>
        ) : null}
        {/* Description Preview */}
        {safeEvent.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {safeText(safeEvent.description, 'No description available')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    ...shadows.large,
  },

  imageContainer: {
    height: 220,
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  categoryBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },

  categoryIcon: {
    marginRight: spacing[1],
  },

  categoryText: {
    ...typography.caption,
    color: colors.neutral[0],
    fontWeight: '700',
    fontSize: 10,
  },

  priceBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    ...shadows.small,
  },

  priceText: {
    ...typography.caption,
    color: colors.neutral[800],
    fontWeight: '700',
  },

  featuredBadge: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    width: 32,
    height: 32,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },

  content: {
    padding: spacing[6],
  },

  title: {
    ...typography.h2,
    color: colors.neutral[800],
    marginBottom: spacing[3],
    lineHeight: 26,
  },

  metadata: {
    marginBottom: spacing[4],
  },

  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  metadataIcon: {
    marginRight: spacing[2],
  },

  metadataText: {
    ...typography.body2,
    color: colors.neutral[500],
    flex: 1,
  },

  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },

  friendIndicator: {
    marginRight: spacing[2],
  },

  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },

  friendAvatarText: {
    ...typography.caption,
    color: colors.neutral[0],
    fontSize: 10,
    fontWeight: '700',
  },

  socialText: {
    ...typography.body2,
    color: colors.primary[600],
    fontWeight: '600',
  },

  description: {
    ...typography.body2,
    color: colors.neutral[500],
    lineHeight: 20,
  },
});
