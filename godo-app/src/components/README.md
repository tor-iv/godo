# Godo App Components

This directory contains all the reusable UI components for the Godo event discovery app. The components are organized into two main categories: common UI components and event-specific components.

## Architecture Overview

The component system follows React Native best practices with:

- **TypeScript** for type safety
- **React Native Reanimated 3** for smooth 60fps animations
- **Gesture Handler** for swipe interactions
- **Expo Haptics** for tactile feedback
- **Purple theme** consistent with app branding

## Component Categories

### Common Components (`/common`)

Reusable UI components that can be used throughout the app.

#### Typography

- **Purpose**: Consistent text styling across the app
- **Variants**: h1, h2, h3, body, caption, button
- **Features**: Customizable color, numberOfLines support
- **Usage**: `<Typography variant="h2" color="#6B46C1">Title</Typography>`

#### Button

- **Purpose**: Interactive buttons with purple theme
- **Variants**: primary, secondary, outline
- **Sizes**: small, medium, large
- **Features**: Disabled state, custom styling, haptic feedback
- **Usage**: `<Button title="Get Started" onPress={handlePress} variant="primary" />`

#### Badge

- **Purpose**: Small labels for categories, status, and prices
- **Variants**: category, status, price
- **Features**: Custom colors, auto-sizing
- **Usage**: `<Badge text="NIGHTLIFE" variant="category" />`

#### IconButton

- **Purpose**: Circular buttons with Ionicons
- **Features**: Customizable size, color, background
- **Usage**: `<IconButton iconName="heart" onPress={handleLike} />`

#### LoadingCard

- **Purpose**: Skeleton loading state for event cards
- **Features**: Shimmer animation, matches EventCard dimensions
- **Usage**: `<LoadingCard />` (no props needed)

### Event Components (`/events`)

Specialized components for the event discovery experience.

#### EventCard

- **Purpose**: Visual display of event information
- **Features**:
  - High-quality image with gradient overlay
  - Event title, description, location, time
  - Category badge with emoji
  - Price display (free vs paid)
  - Attendee count indicator
- **Usage**: `<EventCard event={eventData} />`

#### SwipeOverlay

- **Purpose**: Visual feedback during swipe gestures
- **Features**:
  - Direction-specific colors and icons
  - Animated opacity and scale
  - Text labels for each swipe action
- **Swipe Actions**:
  - **Right**: Purple "GOING!" with checkmark
  - **Left**: Gray "NOPE" with X
  - **Up**: Blue "SAVED" with bookmark
  - **Down**: Red "LIKED" with heart
- **Usage**: `<SwipeOverlay direction={SwipeDirection.RIGHT} progress={animatedValue} />`

#### SwipeCard

- **Purpose**: Core swipeable card with 4-directional gestures
- **Features**:
  - Smooth 60fps animations with Reanimated 3
  - 4-directional swipe detection (right, left, up, down)
  - Haptic feedback on swipe completion
  - Card rotation and scaling effects
  - Stack depth visual effects
  - Velocity-based swipe completion
- **Gesture Thresholds**:
  - **Distance**: 100px minimum swipe
  - **Velocity**: 1000px/s for quick swipes
  - **Completion**: 70% overlay opacity
- **Usage**: `<SwipeCard event={event} onSwipe={handleSwipe} index={0} totalCards={3} />`

#### SwipeStack

- **Purpose**: Manages multiple SwipeCards in a stack
- **Features**:
  - Shows 3 cards at once (current + 2 behind)
  - Automatic loading of more events
  - Empty state handling
  - Loading indicators
  - Stack depth visual effects
- **Usage**:

```tsx
<SwipeStack
  events={eventList}
  onSwipe={handleSwipe}
  onLoadMore={loadMoreEvents}
  loading={isLoading}
  hasMore={hasMoreEvents}
/>
```

## Swipe Mechanics

The app implements a 4-directional swipe system:

### Swipe Directions & Actions

- **Right Swipe** → `SwipeDirection.RIGHT` → "Want to go" (Add to private calendar)
- **Left Swipe** → `SwipeDirection.LEFT` → "Not interested" (Dismiss)
- **Up Swipe** → `SwipeDirection.UP` → "Save for later" (Bookmark)
- **Down Swipe** → `SwipeDirection.DOWN` → "Like but can't go" (Social signal)

### Animation Details

- **Card Rotation**: Subtle rotation based on horizontal swipe
- **Stack Scaling**: Background cards scale down (95%, 90%)
- **Stack Translation**: Background cards offset vertically (-10px, -20px)
- **Overlay Animation**: Progressive opacity and scale based on swipe progress
- **Exit Animation**: Cards animate off-screen in swipe direction

## Color Theme

The components use a consistent purple theme:

```typescript
const COLORS = {
  PRIMARY_PURPLE: '#8B5CF6', // Main purple
  SECONDARY_PURPLE: '#A78BFA', // Lighter purple
  LIGHT_PURPLE: '#C4B5FD', // Very light purple
  DARK_PURPLE: '#4C1D95', // Dark purple text
  WHITE: '#FFFFFF', // Pure white
  OFF_WHITE: '#FAFAFF', // Slightly tinted white
};
```

## Performance Optimizations

- **React.memo**: Expensive components are memoized
- **useCallback**: Event handlers are memoized to prevent re-renders
- **Reanimated 3**: All animations run on the UI thread for 60fps
- **Image Caching**: EventCard uses optimized image loading
- **Gesture Optimization**: Gesture handlers use worklet functions

## Testing

A demo component is available for testing:

```tsx
import SwipeDemo from './demo/SwipeDemo';

// Shows SwipeStack with mock events and alert feedback
<SwipeDemo />;
```

## Integration Examples

### Basic Swipe Stack

```tsx
import { SwipeStack } from '../components/events';
import { mockEvents } from '../data/mockEvents';

const DiscoverScreen = () => {
  const handleSwipe = (direction: SwipeDirection, event: Event) => {
    // Handle swipe action
    console.log(`Swiped ${direction} on ${event.title}`);
  };

  return <SwipeStack events={mockEvents} onSwipe={handleSwipe} />;
};
```

### Custom Event Card

```tsx
import { EventCard } from '../components/events';

const CustomEventDisplay = ({ event }) => {
  return <EventCard event={event} style={{ marginVertical: 10 }} />;
};
```

### Loading States

```tsx
import { LoadingCard } from '../components/common';

const LoadingScreen = () => {
  return (
    <View>
      {Array.from({ length: 3 }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </View>
  );
};
```

## Future Enhancements

- **Accessibility**: Add screen reader support and gesture alternatives
- **Customization**: Allow theme customization per user preferences
- **Analytics**: Add swipe tracking and user behavior analytics
- **Offline**: Cache swiped events for offline viewing
- **Social**: Add friend activity indicators on cards
- **Filters**: Visual filter chips for categories and preferences

## Dependencies

- `react-native-reanimated`: ^3.17.4
- `react-native-gesture-handler`: ^2.24.0
- `expo-haptics`: ^14.1.4
- `expo-linear-gradient`: ^14.1.5
- `@expo/vector-icons`: ^14.1.0

## File Structure

```
src/components/
├── common/
│   ├── Typography.tsx      # Text component with variants
│   ├── Button.tsx          # Purple-themed buttons
│   ├── Badge.tsx           # Category and status badges
│   ├── IconButton.tsx      # Circular icon buttons
│   ├── LoadingCard.tsx     # Skeleton loading state
│   └── index.ts           # Common exports
├── events/
│   ├── EventCard.tsx       # Event display component
│   ├── SwipeCard.tsx       # Core swipeable card
│   ├── SwipeOverlay.tsx    # Swipe feedback overlay
│   ├── SwipeStack.tsx      # Card stack manager
│   └── index.ts           # Event exports
├── demo/
│   └── SwipeDemo.tsx       # Testing component
├── index.ts               # Main exports
└── README.md              # This file
```
