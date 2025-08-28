import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Commented out - may not be available
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { Event, SwipeDirection } from '../../types';
import { colors, spacing, layout, shadows, typography } from '../../design';
import {
  Body,
  Caption,
  Heading2,
  Heading3,
  Button,
} from '../../components/base';
import {
  getCategoryColor,
  getCategoryDisplayName,
  formatPrice,
  formatEventDate,
} from '../../utils';
import { EventService } from '../../services';

interface EventModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onRemoveFromCalendar?: (event: Event) => void;
}

export const EventModal: React.FC<EventModalProps> = props => {
  const { event, visible, onClose, onRemoveFromCalendar } = props;
  if (!event) return null;

  const eventService = EventService.getInstance();
  const swipeDirection = eventService.getSwipeDirection(event.id);

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

  const getSwipeActionText = (direction: SwipeDirection | null) => {
    switch (direction) {
      case SwipeDirection.UP:
        return {
          text: 'Added to Public Calendar',
          color: colors.success[600],
          icon: 'calendar',
        };
      case SwipeDirection.RIGHT:
        return {
          text: 'Added to Private Calendar',
          color: colors.info[600],
          icon: 'calendar',
        };
      case SwipeDirection.DOWN:
        return {
          text: 'Saved for Later',
          color: colors.warning[600],
          icon: 'bookmark',
        };
      default:
        return null;
    }
  };

  const handleRemoveFromCalendar = () => {
    Alert.alert(
      'Remove Event',
      'Are you sure you want to remove this event from your calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            eventService.removeSwipe(event.id);
            onRemoveFromCalendar?.(event);
            onClose();
          },
        },
      ]
    );
  };

  const handleOpenMap = () => {
    if (event.location?.coordinates) {
      const { lat, lng } = event.location.coordinates;
      const url = `https://maps.apple.com/?q=${lat},${lng}`;
      Linking.openURL(url);
    } else if (event.venue?.name) {
      const query = encodeURIComponent(
        `${event.venue.name} ${event.venue.neighborhood || ''}`
      );
      const url = `https://maps.apple.com/?q=${query}`;
      Linking.openURL(url);
    }
  };

  const handleShare = () => {
    // This would integrate with React Native's share functionality
    Alert.alert('Share Event', 'Share functionality would be implemented here');
  };

  const swipeAction = getSwipeActionText(swipeDirection);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.neutral[600]} />
          </TouchableOpacity>

          <Heading3 style={styles.headerTitle}>Event Details</Heading3>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Feather name="share" size={20} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.eventImage}
              resizeMode="cover"
            />

            {/* Overlay content */}
            <View style={styles.imageOverlay}>
              <View style={styles.imageContent}>
                {/* Category Badge */}
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(event.category) },
                  ]}
                >
                  <Feather
                    name={getCategoryIcon(event.category) as any}
                    size={16}
                    color={colors.neutral[0]}
                  />
                  <Caption style={styles.categoryText}>
                    {getCategoryDisplayName(event.category)}
                  </Caption>
                </View>

                {/* Price */}
                {(event.priceMin ?? 0) > 0 && (
                  <View style={styles.priceBadge}>
                    <Caption style={styles.priceText}>
                      {formatPrice(event.priceMin, event.priceMax)}
                    </Caption>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Event Info */}
          <View style={styles.infoContainer}>
            {/* Title */}
            <Heading2 style={styles.eventTitle}>{event.title}</Heading2>

            {/* Status Badge */}
            {swipeAction && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: swipeAction.color },
                ]}
              >
                <Feather
                  name={swipeAction.icon as any}
                  size={14}
                  color={colors.neutral[0]}
                />
                <Caption style={styles.statusText}>{swipeAction.text}</Caption>
              </View>
            )}

            {/* Date & Time */}
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Feather
                  name="calendar"
                  size={20}
                  color={colors.neutral[400]}
                  style={styles.detailIcon}
                />
                <View style={styles.detailContent}>
                  <Body style={styles.detailTitle}>Date & Time</Body>
                  <Caption color={colors.neutral[500]}>
                    {formatEventDate(event.date)}
                  </Caption>
                </View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailSection}>
              <Pressable style={styles.detailRow} onPress={handleOpenMap}>
                <Feather
                  name="map-pin"
                  size={20}
                  color={colors.neutral[400]}
                  style={styles.detailIcon}
                />
                <View style={styles.detailContent}>
                  <Body style={styles.detailTitle}>Location</Body>
                  <Caption color={colors.neutral[500]}>
                    {event.venue.name}
                  </Caption>
                  {event.venue.neighborhood && (
                    <Caption color={colors.neutral[400]}>
                      {event.venue.neighborhood}
                    </Caption>
                  )}
                  {event.location?.address && (
                    <Caption color={colors.neutral[400]}>
                      {event.location.address}
                    </Caption>
                  )}
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={colors.neutral[400]}
                />
              </Pressable>
            </View>

            {/* Attendees */}
            {event.currentAttendees && event.currentAttendees > 0 && (
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Feather
                    name="users"
                    size={20}
                    color={colors.neutral[400]}
                    style={styles.detailIcon}
                  />
                  <View style={styles.detailContent}>
                    <Body style={styles.detailTitle}>Attendees</Body>
                    <Caption color={colors.neutral[500]}>
                      {event.currentAttendees} attending
                    </Caption>
                  </View>
                </View>
              </View>
            )}

            {/* Friends Attending */}
            {event.friendsAttending && event.friendsAttending > 0 && (
              <View style={styles.socialSection}>
                <View style={styles.friendsRow}>
                  <View style={styles.friendIndicator}>
                    <Caption style={styles.friendCount}>
                      +{event.friendsAttending}
                    </Caption>
                  </View>
                  <Body style={styles.friendsText}>
                    {event.friendsAttending}{' '}
                    {String(
                      event.friendsAttending === 1 ? 'friend' : 'friends'
                    )}{' '}
                    interested
                  </Body>
                </View>
              </View>
            )}

            {/* Description */}
            {event.description && (
              <View style={styles.descriptionSection}>
                <Body style={styles.sectionTitle}>About</Body>
                <Body color={colors.neutral[600]} style={styles.description}>
                  {event.description}
                </Body>
              </View>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Body style={styles.sectionTitle}>Tags</Body>
                <View style={styles.tagsContainer}>
                  {event.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Caption style={styles.tagText}>{tag}</Caption>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Actions */}
        {swipeDirection && (
          <View style={styles.actions}>
            <Button
              title="Remove from Calendar"
              onPress={handleRemoveFromCalendar}
              variant="ghost"
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const TouchableOpacity = Pressable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  categoryText: {
    color: colors.neutral[0],
    fontWeight: '600',
    marginLeft: spacing[2],
  },
  priceBadge: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
    ...shadows.small,
  },
  priceText: {
    fontWeight: '700',
    color: colors.neutral[800],
  },
  infoContainer: {
    padding: spacing[6],
  },
  eventTitle: {
    marginBottom: spacing[4],
    lineHeight: 28,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
    marginBottom: spacing[6],
  },
  statusText: {
    color: colors.neutral[0],
    fontWeight: '600',
    marginLeft: spacing[2],
  },
  detailSection: {
    marginBottom: spacing[5],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginRight: spacing[4],
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  socialSection: {
    marginBottom: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  friendCount: {
    color: colors.neutral[0],
    fontSize: 11,
    fontWeight: '700',
  },
  friendsText: {
    color: colors.primary[600],
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  description: {
    lineHeight: 22,
  },
  tagsSection: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
  },
  tagText: {
    fontWeight: '500',
  },
  actions: {
    padding: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  actionButton: {
    width: '100%',
  },
});
