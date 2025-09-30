# Discover Page Toggle: "Happening Now" vs "Future Events"

Implementation plan for adding a toggle to the Discover screen that allows users to switch between events happening right now and future planned events.

## Overview

**Goal**: Enable users to toggle between:
1. **"Happening Now"** - Events happening today or within the next few hours
2. **"Future Events"** - Events happening tomorrow and beyond (planning ahead mode)

This addresses the core use case: helping users decide what to do **right now** vs. what to plan for later.

---

## UI Design

### Toggle Component

**Design**: Segmented control (iOS-style) with two options

```
┌─────────────────────────────────┐
│  Happening Now  │ Future Events │
│      (filled)   │   (outline)   │
└─────────────────────────────────┘
```

**Placement**: Below the header subtitle, above the swipe stack

**Specifications**:
- Width: Full screen width minus padding (layout.screenPadding * 2)
- Height: 44px (iOS touch target)
- Border radius: 8px (medium)
- Border: 1px solid colors.borders.light
- Active state: Filled with colors.primary[500], white text
- Inactive state: Transparent background, colors.neutral[700] text
- Animation: 200ms transition on toggle

### Visual Hierarchy

```
┌──────────────────────────────────────┐
│  Discover                            │ ← Navigation header
├──────────────────────────────────────┤
│  Swipe to explore NYC events         │ ← Subtitle
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Happening Now │ Future Events│   │ ← NEW: Toggle
│  └──────────────────────────────┘   │
│                                      │
│  ┌────────────────────────────┐     │
│  │                            │     │
│  │    [Event Card]            │     │
│  │                            │     │
│  └────────────────────────────┘     │
│                                      │
└──────────────────────────────────────┘
```

---

## Time-Based Filtering Logic

### "Happening Now" Definition

Events that meet ANY of these criteria:
1. **Today's events** - Event date is same as current date
2. **Within next 6 hours** - Event starts within the next 6 hours
3. **Currently ongoing** - Event has started but hasn't ended yet (if we have end times)

```typescript
function isHappeningNow(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.datetime);

  // Check if event is today
  const isToday = eventDate.toDateString() === now.toDateString();

  // Check if event is within next 6 hours
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithinSixHours = hoursUntilEvent >= 0 && hoursUntilEvent <= 6;

  return isToday || isWithinSixHours;
}
```

### "Future Events" Definition

Events that are:
1. **Tomorrow or later** - Event date is after today
2. **More than 6 hours away** - Gives time to plan ahead

```typescript
function isFutureEvent(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.datetime);

  // Event is more than 6 hours away
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilEvent > 6;
}
```

---

## Frontend Implementation

### 1. Create Toggle Component

**File**: `/godo-app/src/components/base/SegmentedControl.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../design/flatTokens';

export type SegmentedControlOption = {
  label: string;
  value: string;
};

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
              isFirst && styles.segmentFirst,
              isLast && styles.segmentLast,
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borders.light,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.neutral[50],
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: colors.borders.light,
  },
  segmentFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentLast: {
    borderRightWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentSelected: {
    backgroundColor: colors.primary[500],
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  segmentTextSelected: {
    color: '#FFFFFF',
  },
});
```

Export from `/godo-app/src/components/base/index.ts`:
```typescript
export * from './SegmentedControl';
```

### 2. Add Time Filter Type

**File**: `/godo-app/src/types/index.ts`

Add new enum:
```typescript
export enum TimeFilter {
  HAPPENING_NOW = 'happening_now',
  FUTURE = 'future',
}
```

### 3. Update EventService

**File**: `/godo-app/src/services/EventService.ts`

Add new methods:
```typescript
// Get events happening now (today or within next 6 hours)
public async getHappeningNowEvents(): Promise<Event[]> {
  const now = new Date();
  const allEvents = await this.getAllEvents();

  return allEvents.filter(event => {
    const eventDate = new Date(event.datetime);

    // Check if event is today
    const isToday = eventDate.toDateString() === now.toDateString();

    // Check if event is within next 6 hours
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isWithinSixHours = hoursUntilEvent >= 0 && hoursUntilEvent <= 6;

    return isToday || isWithinSixHours;
  }).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
}

// Get future events (more than 6 hours away)
public async getFutureEvents(): Promise<Event[]> {
  const now = new Date();
  const allEvents = await this.getAllEvents();

  return allEvents.filter(event => {
    const eventDate = new Date(event.datetime);
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilEvent > 6;
  }).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
}

// Get unswiped events filtered by time
public async getUnswipedEventsByTime(timeFilter: TimeFilter): Promise<Event[]> {
  const filteredEvents = timeFilter === TimeFilter.HAPPENING_NOW
    ? await this.getHappeningNowEvents()
    : await this.getFutureEvents();

  return filteredEvents.filter(event => !this.swipedEvents.has(event.id));
}
```

### 4. Update DiscoverScreen

**File**: `/godo-app/src/screens/discover/DiscoverScreen.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Container,
  Heading2,
  Body,
  Button,
  SegmentedControl,
  type SegmentedControlOption
} from '../../components/base';
import type { DiscoverStackParamList } from '../../navigation/DiscoverStackNavigator';
import { SwipeStack } from '../../components/events';
import { spacing, colors, layout } from '../../design';
import { deviceInfo } from '../../design/responsiveTokens';
import { EventService } from '../../services';
import { SwipeInteractionTracker } from '../../services/SwipeInteractionTracker';
import { Event, SwipeDirection, TimeFilter } from '../../types';

type NavigationProp = StackNavigationProp<DiscoverStackParamList>;

const TIME_FILTER_OPTIONS: SegmentedControlOption[] = [
  { label: 'Happening Now', value: TimeFilter.HAPPENING_NOW },
  { label: 'Future Events', value: TimeFilter.FUTURE },
];

export const DiscoverScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.HAPPENING_NOW);

  useEffect(() => {
    loadEvents();
  }, [timeFilter]); // Reload when filter changes

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventService = EventService.getInstance();
      const unswipedEvents = await eventService.getUnswipedEventsByTime(timeFilter);
      setEvents(unswipedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilterChange = useCallback((value: string) => {
    setTimeFilter(value as TimeFilter);
  }, []);

  const handleSwipe = useCallback((event: Event, direction: SwipeDirection) => {
    setSwipeCount(prev => prev + 1);

    // Track the swipe interaction
    const swipeTracker = SwipeInteractionTracker.getInstance();
    swipeTracker.recordSwipe(direction);
  }, []);

  const handleEventPress = useCallback(
    (event: Event) => {
      navigation.navigate('EventDetail', { event });
    },
    [navigation]
  );

  const handleStackEmpty = useCallback(() => {
    const filterLabel = timeFilter === TimeFilter.HAPPENING_NOW
      ? 'happening now'
      : 'upcoming';

    Alert.alert(
      'All done! 🎉',
      `You've swiped through all ${filterLabel} events. ${
        timeFilter === TimeFilter.HAPPENING_NOW
          ? 'Check out Future Events for more!'
          : 'Check back later for more events!'
      }`,
      [
        {
          text: timeFilter === TimeFilter.HAPPENING_NOW ? 'View Future Events' : 'View Happening Now',
          onPress: () => {
            setTimeFilter(
              timeFilter === TimeFilter.HAPPENING_NOW
                ? TimeFilter.FUTURE
                : TimeFilter.HAPPENING_NOW
            );
          },
        },
        { text: 'OK' },
      ]
    );
  }, [timeFilter]);

  if (loading) {
    return (
      <Container variant="screenCentered">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Body
          color={colors.neutral[500]}
          align="center"
          style={styles.loadingText}
        >
          Loading events...
        </Body>
      </Container>
    );
  }

  return (
    <Container variant="screen">
      {/* Header with proper spacing */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Body
          color={colors.neutral[500]}
          align="center"
          style={styles.subtitle}
        >
          Swipe to explore NYC events • {swipeCount} swiped
        </Body>

        {/* Time Filter Toggle */}
        <SegmentedControl
          options={TIME_FILTER_OPTIONS}
          selectedValue={timeFilter}
          onValueChange={handleTimeFilterChange}
          style={styles.toggle}
        />
      </View>

      {/* Swipe Stack */}
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heading2 align="center" style={styles.emptyTitle}>
            No Events Available
          </Heading2>
          <Body
            color={colors.neutral[500]}
            align="center"
            style={styles.emptySubtitle}
          >
            {timeFilter === TimeFilter.HAPPENING_NOW
              ? "Nothing happening right now. Check out Future Events!"
              : "No upcoming events. Check back later!"}
          </Body>
          <Button
            title={timeFilter === TimeFilter.HAPPENING_NOW ? "View Future Events" : "View Happening Now"}
            onPress={() => {
              setTimeFilter(
                timeFilter === TimeFilter.HAPPENING_NOW
                  ? TimeFilter.FUTURE
                  : TimeFilter.HAPPENING_NOW
              );
            }}
            style={styles.switchButton}
          />
        </View>
      ) : (
        <View style={styles.swipeContainer}>
          <SwipeStack
            events={events}
            onSwipe={handleSwipe}
            onEventPress={handleEventPress}
            onStackEmpty={handleStackEmpty}
            maxVisibleCards={3}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[6],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  subtitle: {
    fontSize: deviceInfo.isSmallDevice ? 12 : 14,
    lineHeight: deviceInfo.isSmallDevice ? 16 : 20,
    fontWeight: '500',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  toggle: {
    marginTop: spacing[2],
  },
  loadingText: {
    marginTop: spacing[4],
  },
  swipeContainer: {
    flex: 1,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    marginBottom: spacing[8],
  },
  switchButton: {
    minWidth: 200,
  },
});
```

---

## Backend API Updates (Future)

When connecting to a real backend, the API should support time-based filtering:

### Endpoint: `GET /api/v1/events/feed`

**Query Parameters**:
```typescript
{
  time_filter?: 'happening_now' | 'future',
  exclude_swiped?: boolean,
  limit?: number,
  offset?: number,
}
```

**Example Request**:
```
GET /api/v1/events/feed?time_filter=happening_now&exclude_swiped=true&limit=20
```

**Example Response**:
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Rooftop Networking",
      "datetime": "2024-12-15T18:30:00Z",
      "location": {...},
      "category": "NETWORKING",
      ...
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "meta": {
    "filter_applied": "happening_now",
    "results_count": 20
  }
}
```

### Database Query Optimization

Index on `events.datetime` for efficient time-based queries:

```sql
CREATE INDEX idx_events_datetime ON events(datetime);
CREATE INDEX idx_events_datetime_active ON events(datetime) WHERE is_active = true;
```

---

## User Experience Considerations

### Default State
- **First-time users**: Default to "Happening Now" to encourage immediate action
- **Returning users**: Remember last selected filter in AsyncStorage

### Empty States
- **Happening Now empty**: Suggest checking Future Events
- **Future Events empty**: Suggest checking back later or expanding preferences

### Transition Animation
- Smooth fade between event stacks when toggling (250ms)
- Loading indicator while fetching new events

### Accessibility
- Toggle buttons have clear labels
- VoiceOver announces: "Happening Now, selected, button 1 of 2"
- Haptic feedback on toggle change

---

## Implementation Checklist

### Phase 1: UI Component (Week 1)
- [ ] Create SegmentedControl component
- [ ] Add TimeFilter enum to types
- [ ] Update DiscoverScreen with toggle UI
- [ ] Test toggle interaction and styling

### Phase 2: Event Filtering (Week 1)
- [ ] Add getHappeningNowEvents() to EventService
- [ ] Add getFutureEvents() to EventService
- [ ] Add getUnswipedEventsByTime() to EventService
- [ ] Update mock data with varied event times
- [ ] Test filtering logic with different times

### Phase 3: State Management (Week 1)
- [ ] Implement filter state in DiscoverScreen
- [ ] Handle loading state during filter changes
- [ ] Update empty states based on filter
- [ ] Add AsyncStorage persistence for filter preference

### Phase 4: Polish & Testing (Week 1)
- [ ] Add transition animations
- [ ] Implement haptic feedback
- [ ] Add accessibility labels
- [ ] Test with various event distributions
- [ ] User testing with real NYC events

### Phase 5: Backend Integration (Future)
- [ ] Update backend API to support time_filter param
- [ ] Add database indexes for datetime queries
- [ ] Test query performance with large datasets
- [ ] Monitor API response times

---

## Testing Strategy

### Unit Tests
```typescript
describe('EventService time filtering', () => {
  it('should return only events happening now', async () => {
    const events = await eventService.getHappeningNowEvents();
    events.forEach(event => {
      const hoursUntil = getHoursUntilEvent(event);
      expect(hoursUntil).toBeLessThanOrEqual(6);
    });
  });

  it('should return only future events', async () => {
    const events = await eventService.getFutureEvents();
    events.forEach(event => {
      const hoursUntil = getHoursUntilEvent(event);
      expect(hoursUntil).toBeGreaterThan(6);
    });
  });
});
```

### Integration Tests
- Toggle switches filters correctly
- Events reload when filter changes
- Empty states show appropriate messages
- Swipe count persists across filter changes

### User Acceptance Tests
- Users can easily understand the toggle
- "Happening Now" shows relevant immediate events
- "Future Events" shows planning-ahead options
- Transition between filters feels smooth

---

## Success Metrics

- **Engagement**: Measure toggle usage rate
- **Conversion**: Track swipe-to-attend ratio by filter type
- **Session length**: Compare time spent in each filter mode
- **User preference**: Track which filter is used more often

---

## Future Enhancements

### V2 Features
1. **"This Week" filter** - Middle option for 1-7 day range
2. **Custom time ranges** - Let users define their own ranges
3. **Smart defaults** - Show "Happening Now" in evenings, "Future" in mornings
4. **Filter badges** - Show count of events in each filter
5. **Quick filters** - Additional filters like "With Friends", "Free Events"

### Analytics
- Track filter toggle frequency
- Measure conversion by time filter
- A/B test default filter (Now vs Future)
- Analyze time-of-day usage patterns