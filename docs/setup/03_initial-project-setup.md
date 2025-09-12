# Day 1 Setup Guide - Event Discovery App
*Comprehensive step-by-step instructions for project foundation*

## Prerequisites Check
Before starting, verify you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn package manager
- [ ] Git installed and configured
- [ ] Code editor (VS Code recommended)
- [ ] iOS Simulator (Mac) or Android Studio (for testing)

If missing any prerequisites, install them first before proceeding.

---

## Morning Session (3-4 hours)

### Step 1: Initialize Expo Project (30 minutes)

**1.1 Install/Update Expo CLI**
```bash
# Install latest Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

**1.2 Create New Expo Project**
```bash
# Navigate to your development directory
cd /Users/torcox/godo

# Create new Expo project with TypeScript template
npx create-expo-app godo-app --template expo-template-blank-typescript

# Navigate into project
cd godo-app

# Verify project structure
ls -la
```

**Expected output:** You should see `App.tsx`, `package.json`, `tsconfig.json`, etc.

**1.3 Test Initial Setup**
```bash
# Start development server
npx expo start

# Press 'i' for iOS simulator or 'a' for Android
# You should see "Open up App.tsx to start working on your app!"
```

**Verification:** App loads successfully in simulator with default Expo screen.

### Step 2: Install Core Dependencies (45 minutes)

**2.1 Navigation Dependencies**
```bash
# Install React Navigation 6
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack

# Install required peer dependencies for Expo
npx expo install react-native-screens react-native-safe-area-context
```

**2.2 Animation and Gesture Dependencies**
```bash
# Install Reanimated 3 and Gesture Handler
npx expo install react-native-reanimated react-native-gesture-handler

# Install Expo Image for performance
npx expo install expo-image
```

**2.3 Data Fetching and State Management**
```bash
# Install React Query (TanStack Query)
npm install @tanstack/react-query

# Install AsyncStorage for local storage
npx expo install @react-native-async-storage/async-storage
```

**2.4 Additional Utilities**
```bash
# Install date utilities
npm install date-fns

# Install vector icons
npx expo install @expo/vector-icons

# Install haptics for feedback
npx expo install expo-haptics
```

**Verification:** Check `package.json` - all dependencies should be listed.

### Step 3: Configure TypeScript and Development Tools (30 minutes)

**3.1 Update tsconfig.json**
```bash
# Replace tsconfig.json content
```

Create/update `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/constants/*": ["src/constants/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

**3.2 Setup ESLint and Prettier**
```bash
# Install development dependencies
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier eslint-plugin-prettier
```

Create `.eslintrc.js`:
```javascript
module.exports = {
  extends: [
    'expo',
    '@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Step 4: Create Project Structure (45 minutes)

**4.1 Create Source Directory Structure**
```bash
# Create main source directories
mkdir -p src/{components,screens,services,types,utils,constants}

# Create component subdirectories
mkdir -p src/components/{common,events}

# Create screen subdirectories  
mkdir -p src/screens/{auth,discover,calendar}

# Verify structure
tree src/ || find src -type d
```

**Expected structure:**
```
src/
├── components/
│   ├── common/
│   └── events/
├── screens/
│   ├── auth/
│   ├── discover/
│   └── calendar/
├── services/
├── types/
├── utils/
└── constants/
```

**4.2 Create Initial Type Definitions**

Create `src/types/index.ts`:
```typescript
// Core Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  category: EventCategory;
  imageUrl: string;
  ticketUrl?: string;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
  capacity?: number;
  attendeeCount?: number;
}

export enum EventCategory {
  NETWORKING = 'networking',
  CULTURE = 'culture',
  FITNESS = 'fitness',
  FOOD = 'food',
  NIGHTLIFE = 'nightlife',
  OUTDOOR = 'outdoor',
  PROFESSIONAL = 'professional',
}

export enum SwipeDirection {
  RIGHT = 'want_to_go',
  LEFT = 'not_interested',
  UP = 'save_later',
  DOWN = 'like_cant_go',
}

export enum FeedMode {
  HAPPENING_NOW = 'happening_now',
  PLANNING_AHEAD = 'planning_ahead',
}

// User Types
export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  avatarUrl?: string;
}

export interface UserPreferences {
  categories: EventCategory[];
  priceRange: {
    min: number;
    max: number;
  };
  radius: number; // in miles
  notifications: boolean;
}

// Swipe Types
export interface SwipeAction {
  userId: string;
  eventId: string;
  direction: SwipeDirection;
  timestamp: Date;
}
```

**4.3 Create Constants File**

Create `src/constants/index.ts`:
```typescript
// Color Scheme (Purple & White Theme)
export const COLORS = {
  PRIMARY_PURPLE: '#8B5CF6',
  SECONDARY_PURPLE: '#A78BFA', 
  LIGHT_PURPLE: '#C4B5FD',
  DARK_PURPLE: '#4C1D95',
  WHITE: '#FFFFFF',
  OFF_WHITE: '#FAFAFF',
  BACKGROUND: '#F9FAFB',
  TEXT_DARK: '#1F2937',
  TEXT_LIGHT: '#6B7280',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
} as const;

// Typography
export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System',
  BOLD: 'System',
  LIGHT: 'System',
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
} as const;

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

// Layout
export const LAYOUT = {
  CARD_HEIGHT: 600,
  CARD_WIDTH: 350,
  BORDER_RADIUS: 12,
  SHADOW_RADIUS: 8,
} as const;

// Animation
export const ANIMATION = {
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,
  SPRING_CONFIG: {
    damping: 15,
    stiffness: 150,
  },
} as const;

// App Configuration
export const CONFIG = {
  MAX_SWIPES_PER_DAY: 100,
  CARD_STACK_SIZE: 3,
  IMAGE_CACHE_SIZE: 50,
  API_TIMEOUT: 10000,
} as const;
```

**Verification:** Run `npx tsc --noEmit` to check TypeScript compilation.

---

## Afternoon Session (3-4 hours)

### Step 5: Setup Navigation Structure (60 minutes)

**5.1 Create Navigation Types**

Create `src/types/navigation.ts`:
```typescript
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Root Tab Navigator
export type RootTabParamList = {
  Discover: undefined;
  MyEvents: undefined;
};

// Discover Stack Navigator
export type DiscoverStackParamList = {
  DiscoverFeed: undefined;
  EventDetail: { eventId: string };
  Profile: undefined;
};

// My Events Stack Navigator
export type MyEventsStackParamList = {
  Calendar: undefined;
  SavedEvents: undefined;
  LikedEvents: undefined;
  EventDetail: { eventId: string };
};

// Screen Props Types
export type DiscoverScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Discover'>,
  StackScreenProps<DiscoverStackParamList>
>;

export type MyEventsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'MyEvents'>,
  StackScreenProps<MyEventsStackParamList>
>;
```

**5.2 Create Tab Navigator**

Create `src/navigation/TabNavigator.tsx`:
```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { RootTabParamList } from '../types/navigation';
import DiscoverStack from './DiscoverStack';
import MyEventsStack from './MyEventsStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Discover') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'MyEvents') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY_PURPLE,
        tabBarInactiveTintColor: COLORS.TEXT_LIGHT,
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopColor: COLORS.LIGHT_PURPLE,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStack}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name="MyEvents" 
        component={MyEventsStack}
        options={{ tabBarLabel: 'My Events' }}
      />
    </Tab.Navigator>
  );
}
```

**5.3 Create Stack Navigators**

Create `src/navigation/DiscoverStack.tsx`:
```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants';
import { DiscoverStackParamList } from '../types/navigation';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import EventDetailScreen from '../screens/common/EventDetailScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';

const Stack = createStackNavigator<DiscoverStackParamList>();

export default function DiscoverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.PRIMARY_PURPLE,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="DiscoverFeed" 
        component={DiscoverScreen}
        options={{ 
          title: 'Discover',
          headerRight: () => (
            // Profile icon will be added here
            null
          ),
        }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        options={{ title: 'Event Details' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
```

Create `src/navigation/MyEventsStack.tsx`:
```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants';
import { MyEventsStackParamList } from '../types/navigation';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import SavedEventsScreen from '../screens/calendar/SavedEventsScreen';
import LikedEventsScreen from '../screens/calendar/LikedEventsScreen';
import EventDetailScreen from '../screens/common/EventDetailScreen';

const Stack = createStackNavigator<MyEventsStackParamList>();

export default function MyEventsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.PRIMARY_PURPLE,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'My Events' }}
      />
      <Stack.Screen 
        name="SavedEvents" 
        component={SavedEventsScreen}
        options={{ title: 'Saved for Later' }}
      />
      <Stack.Screen 
        name="LikedEvents" 
        component={LikedEventsScreen}
        options={{ title: 'Liked Events' }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        options={{ title: 'Event Details' }}
      />
    </Stack.Navigator>
  );
}
```

### Step 6: Create Basic Screen Components (90 minutes)

**6.1 Create Discover Screen**

Create `src/screens/discover/DiscoverScreen.tsx`:
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { FeedMode } from '../../types';

export default function DiscoverScreen() {
  const [feedMode, setFeedMode] = useState<FeedMode>(FeedMode.HAPPENING_NOW);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              feedMode === FeedMode.HAPPENING_NOW && styles.toggleButtonActive,
            ]}
            onPress={() => setFeedMode(FeedMode.HAPPENING_NOW)}
          >
            <Text
              style={[
                styles.toggleText,
                feedMode === FeedMode.HAPPENING_NOW && styles.toggleTextActive,
              ]}
            >
              Happening Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              feedMode === FeedMode.PLANNING_AHEAD && styles.toggleButtonActive,
            ]}
            onPress={() => setFeedMode(FeedMode.PLANNING_AHEAD)}
          >
            <Text
              style={[
                styles.toggleText,
                feedMode === FeedMode.PLANNING_AHEAD && styles.toggleTextActive,
              ]}
            >
              Planning Ahead
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Event cards will go here
        </Text>
        <Text style={styles.subtext}>
          Current mode: {feedMode}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_PURPLE,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.OFF_WHITE,
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
  },
  toggleText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  toggleTextActive: {
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
  },
  placeholder: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_PURPLE,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
});
```

**6.2 Create Calendar Screen**

Create `src/screens/calendar/CalendarScreen.tsx`:
```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity style={[styles.tab, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>
              My Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Saved Later</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Liked Events</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Calendar view will go here
        </Text>
        <Text style={styles.subtext}>
          Your confirmed events (right swipes)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_PURPLE,
  },
  tabContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  tab: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.OFF_WHITE,
  },
  tabActive: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
  },
  tabText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  tabTextActive: {
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
  },
  placeholder: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_PURPLE,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
});
```

**6.3 Create Placeholder Screens**

Create `src/screens/common/EventDetailScreen.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function EventDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Event Detail Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.PRIMARY_PURPLE,
  },
});
```

Create `src/screens/auth/ProfileScreen.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Profile Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.PRIMARY_PURPLE,
  },
});
```

Create `src/screens/calendar/SavedEventsScreen.tsx` and `src/screens/calendar/LikedEventsScreen.tsx` with similar placeholder content.

### Step 7: Update Main App Component (30 minutes)

**7.1 Update App.tsx**

Replace the content of `App.tsx`:
```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/constants';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={COLORS.PRIMARY_PURPLE} />
          <TabNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

**7.2 Test Complete Setup**
```bash
# Clear Metro cache and restart
npx expo start --clear

# Test in simulator
# Press 'i' for iOS or 'a' for Android
```

**Expected Result:** 
- App loads with purple-themed tab navigation
- Two tabs: "Discover" and "My Events"
- Toggle buttons work on Discover screen
- Tab navigation works between screens
- Purple color scheme applied throughout

---

## End of Day 1 Verification Checklist

- [ ] Expo project created with TypeScript
- [ ] All core dependencies installed
- [ ] Project structure organized according to specifications
- [ ] TypeScript configuration with strict mode
- [ ] Navigation structure implemented (tabs + stacks)
- [ ] Purple/white color scheme applied
- [ ] Basic screens created with placeholder content
- [ ] App runs successfully in simulator
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npx eslint src/`)

## Troubleshooting Common Issues

**Metro bundler issues:**
```bash
npx expo start --clear
# or
rm -rf node_modules && npm install
```

**TypeScript path mapping not working:**
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

**Simulator not loading:**
```bash
# Reset iOS Simulator
# Device -> Erase All Content and Settings
```

## Next Steps (Day 2 Preview)

Tomorrow you'll focus on:
1. Creating the swipeable event card component
2. Implementing gesture handling for swipe actions
3. Adding visual feedback and animations
4. Creating mock event data
5. Building the basic feed functionality

---

**Total estimated time:** 6-8 hours
**Key deliverable:** Working app foundation with navigation and basic UI
