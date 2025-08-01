import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, SwipeDirection, FeedMode } from '../types';
import { mockEvents } from '../data/mockEvents';

// State interface
interface AppState {
  // Events data
  allEvents: Event[];
  privateEvents: Event[];
  publicEvents: Event[];
  savedEvents: Event[];
  passedEvents: Event[];

  // UI state
  currentEventIndex: number;
  feedMode: FeedMode;
  loading: boolean;

  // Stats
  swipeStats: {
    private: number;
    public: number;
    saved: number;
    passed: number;
  };
}

// Action types
type AppAction =
  | {
      type: 'SWIPE_EVENT';
      payload: { direction: SwipeDirection; event: Event };
    }
  | { type: 'SET_FEED_MODE'; payload: FeedMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_EVENTS'; payload: Event[] }
  | { type: 'RESET_CURRENT_INDEX' }
  | { type: 'NEXT_EVENT' };

// Initial state
const initialState: AppState = {
  allEvents: mockEvents,
  privateEvents: [],
  publicEvents: [],
  savedEvents: [],
  passedEvents: [],
  currentEventIndex: 0,
  feedMode: FeedMode.HAPPENING_NOW,
  loading: false,
  swipeStats: {
    private: 0,
    public: 0,
    saved: 0,
    passed: 0,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SWIPE_EVENT': {
      const { direction, event } = action.payload;
      console.log('SWIPE_EVENT reducer called with:', direction, event.title);
      let updatedState = { ...state };

      // Add event to appropriate category
      switch (direction) {
        case SwipeDirection.RIGHT:
          updatedState.privateEvents = [...state.privateEvents, event];
          updatedState.swipeStats.private += 1;
          console.log('Added to private events, count:', updatedState.swipeStats.private);
          break;
        case SwipeDirection.UP:
          updatedState.publicEvents = [...state.publicEvents, event];
          updatedState.swipeStats.public += 1;
          console.log('Added to public events, count:', updatedState.swipeStats.public);
          break;
        case SwipeDirection.DOWN:
          updatedState.savedEvents = [...state.savedEvents, event];
          updatedState.swipeStats.saved += 1;
          console.log('Added to saved events, count:', updatedState.swipeStats.saved);
          break;
        case SwipeDirection.LEFT:
          updatedState.passedEvents = [...state.passedEvents, event];
          updatedState.swipeStats.passed += 1;
          console.log('Added to passed events, count:', updatedState.swipeStats.passed);
          break;
      }

      // Move to next event
      updatedState.currentEventIndex =
        (state.currentEventIndex + 1) % state.allEvents.length;
      console.log('Next event index:', updatedState.currentEventIndex);

      return updatedState;
    }

    case 'SET_FEED_MODE':
      return {
        ...state,
        feedMode: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'LOAD_EVENTS':
      return {
        ...state,
        allEvents: action.payload,
        currentEventIndex: 0,
      };

    case 'RESET_CURRENT_INDEX':
      return {
        ...state,
        currentEventIndex: 0,
      };

    case 'NEXT_EVENT':
      return {
        ...state,
        currentEventIndex:
          (state.currentEventIndex + 1) % state.allEvents.length,
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Selector hooks for better performance
export function useCurrentEvent() {
  const { state } = useApp();
  return state.allEvents[state.currentEventIndex];
}

export function useNextEvent() {
  const { state } = useApp();
  const nextIndex = (state.currentEventIndex + 1) % state.allEvents.length;
  return state.allEvents[nextIndex];
}

export function useSwipeStats() {
  const { state } = useApp();
  return state.swipeStats;
}

export function useEventsByCategory() {
  const { state } = useApp();
  return {
    private: state.privateEvents,
    public: state.publicEvents,
    saved: state.savedEvents,
    passed: state.passedEvents,
  };
}
