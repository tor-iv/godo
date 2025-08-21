import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Container, Heading1, Body, Button } from '../../components/base';
import { spacing, colors } from '../../design';
import { EventService } from '../../services';
import { Event } from '../../types';
import { formatEventDate, formatPrice } from '../../utils';

export const DiscoverScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventService = EventService.getInstance();
      const upcomingEvents = await eventService.getUpcomingEvents(7);
      setEvents(upcomingEvents.slice(0, 3)); // Show first 3 events
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container variant="screenCentered">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Body color={colors.neutral[500]} align="center" style={styles.loadingText}>
          Loading events...
        </Body>
      </Container>
    );
  }

  return (
    <Container variant="screen">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading1 align="center" style={styles.title}>
          Discover Events
        </Heading1>
        <Body color={colors.neutral[500]} align="center" style={styles.subtitle}>
          Swipe interface coming soon! Here are some upcoming events:
        </Body>
        
        {events.map((event) => (
          <Container key={event.id} variant="card" style={styles.eventCard}>
            <Heading1 style={styles.eventTitle}>{event.title}</Heading1>
            <Body color={colors.neutral[600]} style={styles.eventDate}>
              {formatEventDate(event.date)}
            </Body>
            <Body color={colors.neutral[500]} style={styles.eventLocation}>
              📍 {event.venue.name}, {event.venue.neighborhood}
            </Body>
            <Body color={colors.primary[600]} style={styles.eventPrice}>
              {formatPrice(event.priceMin, event.priceMax)}
            </Body>
            {event.description && (
              <Body color={colors.neutral[500]} style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Body>
            )}
          </Container>
        ))}
        
        <Button 
          title="Swipe Interface Coming Soon" 
          onPress={() => {}} 
          style={styles.comingSoonButton}
          disabled
        />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing[8],
    marginBottom: spacing[2],
  },
  subtitle: {
    marginBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },
  loadingText: {
    marginTop: spacing[4],
  },
  eventCard: {
    marginBottom: spacing[4],
  },
  eventTitle: {
    marginBottom: spacing[2],
  },
  eventDate: {
    marginBottom: spacing[1],
  },
  eventLocation: {
    marginBottom: spacing[1],
  },
  eventPrice: {
    marginBottom: spacing[2],
    fontWeight: '600',
  },
  eventDescription: {
    lineHeight: 20,
  },
  comingSoonButton: {
    marginTop: spacing[8],
    marginBottom: spacing[12],
  },
});