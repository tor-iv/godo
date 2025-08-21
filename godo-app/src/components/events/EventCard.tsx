import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Event } from '../../types';
import { colors, typography, spacing, layout, shadows } from '../../design';
import { formatEventDate, formatPrice, formatFriendsAttending } from '../../utils';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - (layout.screenPadding * 2);

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress,
  style 
}) => {
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

  const formatCapacity = (current?: number, capacity?: number) => {
    if (!current) return '';
    if (!capacity) return `${current} attending`;
    return `${current}/${capacity} attending`;
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
          source={{ uri: event.imageUrl }} 
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
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary[500] }]}>
          <Feather 
            name={getCategoryIcon(event.category) as any} 
            size={12} 
            color={colors.neutral[0]} 
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryText}>
            {event.category.replace('_', ' ')}
          </Text>
        </View>
        
        {/* Price Badge (if paid event) */}
        {(event.priceMin ?? 0) > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {formatPrice(event.priceMin, event.priceMax)}
            </Text>
          </View>
        )}
        
        {/* Featured Badge */}
        {event.isFeatured && (
          <View style={styles.featuredBadge}>
            <Feather name="star" size={16} color={colors.warning[500]} />
          </View>
        )}
      </View>
      
      {/* Content Container */}
      <View style={styles.content}>
        {/* Event Title */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
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
              {formatEventDate(event.date)}
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
              {`${event.venue.name}${event.venue.neighborhood ? ` • ${event.venue.neighborhood}` : ''}`}
            </Text>
          </View>
          
          {/* Attendees (if available) */}
          {event.currentAttendees && event.currentAttendees > 0 && (
            <View style={styles.metadataRow}>
              <Feather 
                name="users" 
                size={16} 
                color={colors.neutral[400]}
                style={styles.metadataIcon}
              />
              <Text style={styles.metadataText}>
                {formatCapacity(event.currentAttendees, event.capacity)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Social Proof */}
        {event.friendsAttending && event.friendsAttending > 0 && (
          <View style={styles.socialProof}>
            <View style={styles.friendIndicator}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>+{event.friendsAttending}</Text>
              </View>
            </View>
            <Text style={styles.socialText}>
              {formatFriendsAttending(event.friendsAttending)}
            </Text>
          </View>
        )}
        
        {/* Description Preview */}
        {event.description && (
          <Text style={styles.description} numberOfLines={3}>
            {event.description}
          </Text>
        )}
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