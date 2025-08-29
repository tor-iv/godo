# State Management & Data Flow Analysis - Visibility Issues

## Executive Summary

**Primary Issue**: Component render visibility problems stemming from state management complexity and async operations timing. No global state management (Redux/Context) is implemented - components rely on local state and singleton service patterns.

## Key Findings

### 1. State Management Architecture

**Pattern**: Local Component State + Singleton Service
- **MyEventsScreen**: Uses 8 local state variables managed with `useState`
- **EventService**: Singleton pattern with in-memory Map for swipe tracking
- **No Global State**: No Context API, Redux, or other global state solutions

**Critical Dependencies**:
```typescript
// MyEventsScreen.tsx - Lines 25-35
const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
const [savedEvents, setSavedEvents] = useState<Event[]>([]);
const [eventFilter, setEventFilter] = useState<EventFilterType>('all');
const [viewType, setViewType] = useState<ViewType>('month');
const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [showEventModal, setShowEventModal] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 2. Data Flow Analysis

**Event Loading Chain**:
1. `useEffect` → `loadEvents()` (Line 60-62)
2. `useFocusEffect` → `loadEvents()` (Line 65-69) 
3. `EventService.getInstance()` → synchronous data retrieval (Line 43-51)
4. State updates via `setCalendarEvents()` and `setSavedEvents()`

**Swipe Gesture Integration**:
```typescript
// EventService.ts - Lines 71-73
public swipeEvent(eventId: string, direction: SwipeDirection): void {
  this.swipedEvents.set(eventId, direction);
}
```

### 3. Async Operations & Timing Issues

**Mock Async Delay** (Potential Issue):
```typescript
// EventService.ts - Lines 21-25
public async getAllEvents(): Promise<Event[]> {
  // Simulate API delay - THIS COULD CAUSE VISIBILITY ISSUES
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...this.events];
}
```

**Loading State Handling**:
- Loading spinner shows for 500ms minimum due to mock delay
- Early return prevents component rendering during loading state
- Components depend on successful data loading for visibility

### 4. Component Rendering Conditions

**Critical Render Blocks**:
```typescript
// MyEventsScreen.tsx - Lines 158-164
if (isLoading) {
  return <LoadingSpinner text="Loading your events..." />;
}

if (error) {
  return <ErrorBoundary ... />;
}
```

**Empty State Management**:
```typescript
// Lines 198-208
{calendarEvents.length === 0 && (
  <View style={styles.emptyHint}>
    <Body>Swipe on events in Discover to add them here</Body>
  </View>
)}
```

### 5. TypeScript Interface Analysis

**Event Data Structure**:
```typescript
// types/index.ts - Lines 94-112
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;        // ISO string for consistency
  datetime: string;    // ISO string for compatibility - DUAL DATE FIELDS
  location: Location;
  venue: Venue;
  category: EventCategory;
  // ... other fields
}
```

**Potential Data Inconsistency**: Dual date fields (`date` and `datetime`) could cause confusion.

### 6. Swipe Gesture State Integration

**State Change Flow**:
1. User swipes in DiscoverScreen → `EventService.swipeEvent()`
2. Event stored in `swipedEvents` Map with direction
3. MyEventsScreen `useFocusEffect` → reloads data on screen focus
4. Filtered events retrieved via service methods:
   - `getPrivateCalendarEvents()` (RIGHT swipes)
   - `getPublicCalendarEvents()` (UP swipes)
   - `getSavedEvents()` (DOWN swipes)

### 7. Loading States That Prevent Rendering

**Component Hierarchy Blocks**:
1. **MyEventsScreen**: `isLoading` state blocks entire screen
2. **CalendarView**: Depends on `events` prop from parent
3. **Individual Views**: All calendar views require events data

**Sequential Loading Issues**:
- Mock 500ms delay creates artificial loading time
- No progressive loading or skeleton states
- All-or-nothing render approach

## Potential Visibility Issues

### 1. **Race Conditions**
- Multiple `loadEvents()` calls from `useEffect` and `useFocusEffect`
- Async operations without proper cleanup
- State updates after component unmount

### 2. **State Synchronization**
- Local state in MyEventsScreen vs. global singleton service
- No reactive updates when service data changes
- Manual refresh required after swipe actions

### 3. **Component Mount/Unmount Timing**
- `useFocusEffect` may not fire properly during navigation
- State initialization timing with navigation stack

### 4. **Memory Management**
- Singleton service persists across app lifecycle
- No state cleanup on component unmount
- Potential memory leaks with event listeners

## Recommendations

### 1. **Implement Global State Management**
```typescript
// Suggested: React Context + useReducer
const EventContext = React.createContext();
const EventProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  // ...
};
```

### 2. **Add State Persistence**
```typescript
// AsyncStorage integration for swipe data
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### 3. **Improve Loading UX**
- Progressive loading with skeleton components
- Optimistic updates for swipe actions
- Background refresh without blocking UI

### 4. **Enhanced Error Handling**
```typescript
// Granular error boundaries
const EventErrorBoundary = ({ fallback, children }) => {
  // Component-specific error handling
};
```

### 5. **State Synchronization**
```typescript
// Event-driven updates
const useEventService = () => {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const unsubscribe = EventService.subscribe((newEvents) => {
      setEvents(newEvents);
    });
    return unsubscribe;
  }, []);
};
```

## Files Analyzed

- `/src/screens/calendar/MyEventsScreen.tsx` - Main calendar screen with local state
- `/src/services/EventService.ts` - Singleton service for data management
- `/src/components/calendar/CalendarView.tsx` - Calendar display component
- `/src/components/calendar/DateNavigation.tsx` - Date navigation with state
- `/src/types/index.ts` - TypeScript interfaces and enums
- `/src/data/mockEvents.ts` - Static mock data source

## Next Steps

1. **Immediate**: Remove artificial 500ms delay in EventService
2. **Short-term**: Implement React Context for event state management
3. **Medium-term**: Add AsyncStorage persistence for swipe data
4. **Long-term**: Migrate to more robust state management (Redux Toolkit/Zustand)

---

**Analysis completed**: State management complexity with local state + singleton pattern creates potential visibility issues through loading states, async timing, and lack of reactive updates.