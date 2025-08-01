import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, EventCategory } from '../../types';
import Typography from '../common/Typography';
import Badge from '../common/Badge';
import { getCategoryIcon, formatEventTime } from '../../data/mockEvents';
import {
  getResponsiveDimensions,
  getResponsiveSpacing,
} from '../../utils/responsive';

const { cardWidth: CARD_WIDTH, cardHeight: CARD_HEIGHT } =
  getResponsiveDimensions();

interface EventCardProps {
  event: Event;
  style?: any;
}

const EventCard: React.FC<EventCardProps> = ({ event, style }) => {
  const formatPrice = () => {
    if (!event.price || (event.price.min === 0 && event.price.max === 0)) {
      return 'Free';
    }
    if (event.price.min === event.price.max) {
      return `$${event.price.min}`;
    }
    return `$${event.price.min}-${event.price.max}`;
  };

  const getAttendeeText = () => {
    if (!event.attendeeCount) return '';
    return `${event.attendeeCount} going`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        <ImageBackground
          source={{ uri: event.imageUrl }}
          style={styles.imageBackground}
          imageStyle={styles.image}
        >
          <View style={styles.overlay}>
            <View style={styles.content}>
              {/* Category badge */}
              <View style={styles.topRow}>
                <Badge
                  text={event.category.toUpperCase()}
                  variant="category"
                  backgroundColor="rgba(255,255,255,0.9)"
                  color="#6B46C1"
                />
                {event.attendeeCount && (
                  <View style={styles.attendeeContainer}>
                    <Ionicons name="people" size={14} color="#FFFFFF" />
                    <Typography
                      variant="caption"
                      color="#FFFFFF"
                      style={styles.attendeeText}
                    >
                      {getAttendeeText()}
                    </Typography>
                  </View>
                )}
              </View>

              {/* Event details */}
              <View style={styles.bottomContent}>
                <Typography
                  variant="h3"
                  color="#FFFFFF"
                  numberOfLines={2}
                  style={styles.title}
                >
                  {event.title}
                </Typography>

                <Typography
                  variant="body"
                  color="#E5E7EB"
                  numberOfLines={2}
                  style={styles.description}
                >
                  {event.description}
                </Typography>

                <View style={styles.metaRow}>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color="#E5E7EB" />
                    <Typography
                      variant="caption"
                      color="#E5E7EB"
                      numberOfLines={1}
                      style={styles.locationText}
                    >
                      {event.location.name}
                    </Typography>
                  </View>

                  <View style={styles.timeContainer}>
                    <Ionicons name="time" size={16} color="#E5E7EB" />
                    <Typography
                      variant="caption"
                      color="#E5E7EB"
                      style={styles.timeText}
                    >
                      {formatEventTime(event.date)}
                    </Typography>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Typography variant="h3" color="#FFFFFF" style={styles.price}>
                    {formatPrice()}
                  </Typography>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  attendeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendeeText: {
    marginLeft: 4,
    fontSize: 12,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  description: {
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    marginLeft: 4,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
  },
  priceRow: {
    alignItems: 'flex-start',
  },
  price: {
    fontWeight: '700',
    fontSize: 24,
  },
});

export default EventCard;
