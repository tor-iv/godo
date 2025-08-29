import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn().mockImplementation(c => c),
    Directions: {},
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getId: jest.fn(),
  }),
  useRoute: () => ({
    key: 'test-key',
    name: 'test-name',
    params: {},
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
}));

// Mock Expo modules
jest.mock('expo-linear-gradient', () => 'LinearGradient');
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Global test utilities
global.mockUser = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  preferences: {
    categories: ['NETWORKING', 'CULTURE'],
    neighborhoods: ['Manhattan', 'Brooklyn'],
  },
};

global.mockEvent = {
  id: 'test-event-123',
  title: 'Test Event',
  description: 'Test event description',
  date: new Date().toISOString(),
  datetime: new Date().toISOString(),
  location: {
    name: 'Test Venue',
    address: '123 Test St, New York, NY',
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  venue: { name: 'Test Venue', neighborhood: 'Manhattan' },
  category: 'NETWORKING',
  source: 'EVENTBRITE',
  imageUrl: 'https://example.com/image.jpg',
  priceMin: 25,
  priceMax: 50,
  capacity: 100,
  currentAttendees: 45,
  friendsAttending: 3,
  tags: ['networking', 'tech', 'startup'],
};

// Suppress specific warnings during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});