import React, { useLayoutEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { Event, SwipeDirection } from '../../types';
import { colors, spacing, layout, shadows, typography } from '../../design';
import {
  Body,
  Caption,
  Heading1,
  Heading3,
  Button,
  Container,
  LoadingSpinner,
} from '../../components/base';
import {
  getCategoryColor,
  getCategoryDisplayName,
  formatPrice,
  formatEventDate,
} from '../../utils';
import { EventService } from '../../services';

// Support both navigation stacks
type EventDetailParams = { event: Event };

interface EventDetailScreenProps {
  route: RouteProp<any, any> & { params: EventDetailParams };
}

export const EventDetailScreen: React.FC<EventDetailScreenProps> = ({
  route,
}) => {
  const navigation = useNavigation<any>();
  const { event } = route.params;
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Event Details',
      headerRight: () => (
        <View style={styles.headerActions}>
          <Button
            title=""
            onPress={handleShare}
            variant="ghost"
            style={styles.headerButton}
          >
            <Feather name="share" size={20} color={colors.neutral[600]} />
          </Button>
        </View>
      ),
    });
  }, [navigation]);

  const handleRemoveFromCalendar = useCallback(() => {
    Alert.alert(
      'Remove Event',
      'Are you sure you want to remove this event from your calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              eventService.removeSwipe(event.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove event. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [event.id, navigation, eventService]);

  const handleOpenMap = useCallback(() => {
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
  }, [event]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Check out this event: ${event.title}\n\nWhen: ${formatEventDate(
          event.date
        )}\nWhere: ${event.venue.name}\n\n${event.description || ''}`,
        url: event.url || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share event');
    }
  }, [event]);

  const handleAddToCalendar = useCallback(() => {
    // Navigate back to discover screen to let user swipe
    // First go back to the tab navigator level, then to discover
    navigation.getParent()?.navigate('Discover');
  }, [navigation]);

  const swipeAction = getSwipeActionText(swipeDirection);

  if (isLoading) {
    return (
      <Container style={styles.container}>
        <LoadingSpinner text="Updating event..." />
      </Container>
    );
  }

  return (
    <Container style={[styles.container, { paddingTop: 0 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.eventImage}
            resizeMode="cover"
          />

          {/* Image Overlay */}
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

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Heading1 style={styles.eventTitle}>{event.title}</Heading1>

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
                size={24}
                color={colors.neutral[400]}
                style={styles.detailIcon}
              />
              <View style={styles.detailContent}>
                <Heading3 style={styles.detailTitle}>Date & Time</Heading3>
                <Body color={colors.neutral[600]} style={styles.detailText}>
                  {formatEventDate(event.date)}
                </Body>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailSection}>
            <Button
              title=""
              variant="ghost"
              onPress={handleOpenMap}
              style={styles.locationButton}
            >
              <View style={styles.detailRow}>
                <Feather
                  name="map-pin"
                  size={24}
                  color={colors.neutral[400]}
                  style={styles.detailIcon}
                />
                <View style={styles.detailContent}>
                  <Heading3 style={styles.detailTitle}>Location</Heading3>
                  <Body color={colors.neutral[600]} style={styles.detailText}>
                    {event.venue.name}
                  </Body>
                  {event.venue.neighborhood && (
                    <Caption color={colors.neutral[500]}>
                      {event.venue.neighborhood}
                    </Caption>
                  )}
                  {event.location?.address && (
                    <Caption color={colors.neutral[500]}>
                      {event.location.address}
                    </Caption>
                  )}
                </View>
                <Feather
                  name="external-link"
                  size={20}
                  color={colors.neutral[400]}
                />
              </View>
            </Button>
          </View>

          {/* Attendees */}
          {event.currentAttendees && event.currentAttendees > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Feather
                  name="users"
                  size={24}
                  color={colors.neutral[400]}
                  style={styles.detailIcon}
                />
                <View style={styles.detailContent}>
                  <Heading3 style={styles.detailTitle}>Attendees</Heading3>
                  <Body color={colors.neutral[600]}>
                    {event.currentAttendees} attending
                    {event.capacity && ` of ${event.capacity}`}
                  </Body>
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
                <View>
                  <Body style={styles.friendsText}>
                    {event.friendsAttending}{' '}
                    {String(
                      event.friendsAttending === 1 ? 'friend' : 'friends'
                    )}{' '}
                    interested
                  </Body>
                  <Caption color={colors.neutral[500]}>See who's going</Caption>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Heading3 style={styles.sectionTitle}>About This Event</Heading3>
              <Body color={colors.neutral[600]} style={styles.description}>
                {event.description}
              </Body>
            </View>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Heading3 style={styles.sectionTitle}>Tags</Heading3>
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

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom }]}>
        {swipeDirection ? (
          <Button
            title="Remove from Calendar"
            onPress={handleRemoveFromCalendar}
            variant="outline"
            style={styles.actionButton}
          />
        ) : (
          <Button
            title="Add to Calendar"
            onPress={handleAddToCalendar}
            variant="primary"
            style={styles.actionButton}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  scrollView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 300,
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
    paddingVertical: spacing[6],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
  content: {
    padding: spacing[6],
  },
  eventTitle: {
    marginBottom: spacing[4],
    lineHeight: 32,
    color: colors.neutral[800],
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
    marginBottom: spacing[6],
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
    marginBottom: spacing[2],
    color: colors.neutral[800],
  },
  detailText: {
    lineHeight: 22,
  },
  locationButton: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  socialSection: {
    marginBottom: spacing[6],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  friendCount: {
    color: colors.neutral[0],
    fontSize: 12,
    fontWeight: '700',
  },
  friendsText: {
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  descriptionSection: {
    marginBottom: spacing[6],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[4],
    color: colors.neutral[800],
  },
  description: {
    lineHeight: 24,
  },
  tagsSection: {
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
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
    color: colors.neutral[700],
  },
  bottomActions: {
    padding: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  actionButton: {
    width: '100%',
  },
});
