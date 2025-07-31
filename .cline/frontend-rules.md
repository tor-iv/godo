# Frontend .clinerules - Event Discovery App

## Project Context
React Native (Expo) Tinder-like event discovery app. Two-tab layout with swipe-based event discovery for NYC young professionals.

## Tech Stack
- **React Native with Expo SDK 51+**
- **TypeScript strict mode** 
- **React Navigation 6 (tabs + stack)**
- **React Query for data fetching**
- **Reanimated 3 for animations**
- **Expo Image for performance**

## App Structure
```
Tab 1: "Discover" - Main event feed with swipe interface
Tab 2: "My Events" - Personal calendar + saved collections  
Profile: Top-right icon access (not dedicated tab)
```

## Swipe Mechanics
```typescript
RIGHT = "want_to_go"      // Purple checkmark → Add to calendar
LEFT = "not_interested"   // Gray X → Remove from feed
UP = "save_later"         // Bookmark → Save for future  
DOWN = "like_cant_go"     // Heart → Like but can't attend
```

## Design System
```typescript
const colors = {
  primary: '#8B5CF6',     // Purple primary
  secondary: '#FFFFFF',    // White/off-white  
  accent: '#C4B5FD',      // Light purple
  text: '#4C1D95',        // Dark purple
  background: '#FAFAFF'    // Off-white background
}
```

## Component Rules
- **Functional components + hooks only**
- **TypeScript interfaces for all props**
- **StyleSheet.create for styles** (no inline)
- **Expo Image instead of Image**
- **Custom hooks for business logic**
- **React.memo for expensive components**

## Animation Requirements
- **60fps swipe animations** with Reanimated 3
- **Haptic feedback** on swipe completion
- **Visual feedback** during swipe (card tilt, overlays)
- **Smooth tab transitions**
- **Loading skeletons** (not spinners)

## Screen Patterns

### Discover Screen
- Toggle: "Happening Now" / "Planning Ahead"
- Infinite scroll with React Query
- Pull-to-refresh functionality
- Filter options in top bar

### My Events Screen  
- Default: Calendar view (right swipes)
- Top nav: "Saved Later" / "Liked Can't Go"
- Event detail modals
- External ticket links

## Data Management
```typescript
// React Query for server state
const { data, isLoading } = useQuery(['events', mode], fetchEvents)

// AsyncStorage for preferences
AsyncStorage.setItem('user_prefs', JSON.stringify(prefs))

// Context for global UI state only
```

## Performance Rules
- **FlatList for event feeds** (virtualization)
- **Image caching** with Expo Image
- **Lazy load** non-critical screens
- **Dispose resources** on unmount
- **Profile animations** to maintain 60fps

## TypeScript Standards
```typescript
interface EventCardProps {
  event: Event
  onSwipe: (direction: SwipeDirection) => void
}

enum SwipeDirection {
  RIGHT = 'want_to_go',
  LEFT = 'not_interested', 
  UP = 'save_later',
  DOWN = 'like_cant_go'
}
```

## Platform Specifics
- **iOS primary, Android secondary**
- **Safe area handling** with hooks
- **Purple status bar** styling
- **Deep linking** for event sharing

## DO NOT
- Use class components or inline styles
- Put business logic in render methods
- Ignore TypeScript errors
- Use deprecated navigation patterns
- Import entire icon libraries
- Block the main thread with heavy operations