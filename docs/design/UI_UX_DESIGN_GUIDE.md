# Godo UI/UX Design System Guide

## Overview
Complete design system overhaul inspired by Anthropic's minimalism and Beli's premium feel, transforming Godo into a sophisticated NYC event discovery app with exceptional user experience.

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Design System Foundation](#design-system-foundation)
3. [Component Library](#component-library)
4. [Interaction Design](#interaction-design)
5. [Visual Enhancements](#visual-enhancements)
6. [Implementation Strategy](#implementation-strategy)
7. [Performance Considerations](#performance-considerations)

## Design Philosophy

### Inspiration Analysis

#### Anthropic's Design Principles:
- **Extreme Minimalism**: Maximum white space, zero visual noise
- **Content-First Design**: Design serves content, never competes
- **Subtle Sophistication**: Understated elegance over flashy elements
- **Consistent Hierarchy**: Clear information architecture
- **Purposeful Animation**: Motion that serves function, not decoration

#### Beli's Premium Feel:
- **High-Quality Imagery**: Professional photos with consistent treatment
- **Sophisticated Color Palettes**: Muted, refined color choices
- **Generous Spacing**: Breathing room creates premium perception
- **Social Context Integration**: Seamless blend of social features
- **Mobile-First Excellence**: Perfect touch targets and thumb-friendly design

### Godo's Design Goals:
1. **Trustworthy & Professional**: NYC professionals should feel confident using the app
2. **Effortlessly Social**: Social features that feel natural, not forced
3. **Locally Relevant**: Design that resonates with NYC culture and lifestyle
4. **Premium but Accessible**: High-end feel without intimidation
5. **Swipe-Optimized**: Interface designed around gesture-based interaction

## Design System Foundation

### Typography System

#### Font Stack:
```typescript
export const fonts = {
  // iOS System Fonts (high quality, optimized)
  display: 'SF Pro Display',     // Headlines, titles
  text: 'SF Pro Text',          // Body text, captions
  mono: 'SF Mono',              // Code, technical text
  
  // Android Fallbacks
  androidDisplay: 'Roboto',
  androidText: 'Roboto',
  androidMono: 'Roboto Mono',
};

// Dynamic font selection
export const getFontFamily = (type: 'display' | 'text' | 'mono') => {
  const isIOS = Platform.OS === 'ios';
  
  switch (type) {
    case 'display':
      return isIOS ? fonts.display : fonts.androidDisplay;
    case 'text':
      return isIOS ? fonts.text : fonts.androidText;
    case 'mono':
      return isIOS ? fonts.mono : fonts.androidMono;
    default:
      return isIOS ? fonts.text : fonts.androidText;
  }
};
```

#### Typography Scale:
```typescript
export const typography = {
  // Display Typography (Headings)
  display1: {
    fontFamily: getFontFamily('display'),
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  display2: {
    fontFamily: getFontFamily('display'),
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  display3: {
    fontFamily: getFontFamily('display'),
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  
  // Heading Typography
  h1: {
    fontFamily: getFontFamily('display'),
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: getFontFamily('display'),
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: getFontFamily('display'),
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  
  // Body Typography
  body1: {
    fontFamily: getFontFamily('text'),
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body2: {
    fontFamily: getFontFamily('text'),
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  // Supporting Typography
  caption: {
    fontFamily: getFontFamily('text'),
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  label: {
    fontFamily: getFontFamily('text'),
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: getFontFamily('text'),
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
};
```

### Color System

#### Primary Palette (Sophisticated Purple):
```typescript
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#faf7ff',   // Almost white with purple tint
    100: '#f3edff',  // Very light purple
    200: '#e6d7ff',  // Light purple
    300: '#d1b5ff',  // Medium light purple
    400: '#b887ff',  // Medium purple
    500: '#8B5CF6',  // Main brand color (unchanged)
    600: '#7C3AED',  // Primary dark
    700: '#6D28D9',  // Darker purple
    800: '#5B21B6',  // Very dark purple
    900: '#4C1D95',  // Darkest purple
  },
  
  // Neutral Palette (Warm Grays - Anthropic Inspired)
  neutral: {
    0: '#FFFFFF',     // Pure white
    25: '#FDFDFD',    // Almost white (for slight elevation)
    50: '#FAFAFA',    // Off-white backgrounds
    100: '#F4F4F5',   // Light gray backgrounds
    200: '#E4E4E7',   // Border colors
    300: '#D4D4D8',   // Disabled colors
    400: '#A1A1AA',   // Secondary text
    500: '#71717A',   // Medium text
    600: '#52525B',   // Primary text (light mode)
    700: '#3F3F46',   // Strong text
    800: '#27272A',   // Headings
    900: '#18181B',   // Darkest text
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#10b981',   // Main success color
    600: '#059669',   // Darker success
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',   // Main warning color
    600: '#d97706',   // Darker warning
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',   // Main error color
    600: '#dc2626',   // Darker error
  },
  
  // NYC-Specific Accent Colors
  nyc: {
    taxi: '#F7B801',      // NYC Taxi Yellow
    subway: '#0039A6',     // MTA Blue
    central_park: '#228B22', // Park Green
    brooklyn: '#FF6B35',   // Brooklyn Bridge Orange
  },
  
  // Social Colors (for friend features)
  social: {
    online: '#10b981',     // Green for online friends
    activity: '#3b82f6',   // Blue for activity indicators
    invitation: '#8b5cf6',  // Purple for invitations
  },
};
```

#### Dark Mode Support:
```typescript
export const darkColors = {
  primary: colors.primary, // Primary colors remain consistent
  
  neutral: {
    0: '#000000',     // Pure black
    25: '#0A0A0A',    // Almost black
    50: '#1A1A1A',    // Dark gray backgrounds
    100: '#262626',   // Card backgrounds
    200: '#404040',   // Border colors
    300: '#525252',   // Disabled colors
    400: '#737373',   // Secondary text
    500: '#A3A3A3',   // Medium text
    600: '#D4D4D4',   // Primary text (dark mode)
    700: '#E5E5E5',   // Strong text
    800: '#F5F5F5',   // Headings
    900: '#FFFFFF',   // Darkest text -> white in dark mode
  },
  
  // Semantic colors adjusted for dark mode
  success: {
    50: '#064e3b',
    500: '#34d399',
    600: '#10b981',
  },
  warning: {
    50: '#451a03',
    500: '#fbbf24',
    600: '#f59e0b',
  },
  error: {
    50: '#450a0a',
    500: '#f87171',
    600: '#ef4444',
  },
};
```

### Spacing & Layout System

#### Spacing Scale:
```typescript
export const spacing = {
  // Base spacing units
  0: 0,
  1: 4,     // 0.25rem - Tiny gaps
  2: 8,     // 0.5rem  - Small gaps
  3: 12,    // 0.75rem - Medium-small gaps
  4: 16,    // 1rem    - Standard gaps
  5: 20,    // 1.25rem - Medium gaps
  6: 24,    // 1.5rem  - Large gaps
  8: 32,    // 2rem    - Extra large gaps
  10: 40,   // 2.5rem  - Section gaps
  12: 48,   // 3rem    - Major section gaps
  16: 64,   // 4rem    - Page section gaps
  20: 80,   // 5rem    - Very large gaps
  24: 96,   // 6rem    - Extreme gaps
};

// Semantic spacing (Beli-inspired generous spacing)
export const layout = {
  // Screen-level spacing
  screenPadding: spacing[6],        // 24px - Edge padding for screens
  screenPaddingLarge: spacing[8],   // 32px - Large screen edge padding
  
  // Component spacing
  componentPadding: spacing[5],     // 20px - Internal component padding
  componentMargin: spacing[4],      // 16px - Between components
  
  // Card spacing
  cardPadding: spacing[6],          // 24px - Internal card padding
  cardMargin: spacing[4],           // 16px - Between cards
  cardBorderRadius: 20,             // Rounded corners for premium feel
  
  // Section spacing
  sectionSpacing: spacing[10],      // 40px - Between major sections
  sectionPadding: spacing[8],       // 32px - Section internal padding
  
  // Touch targets (44pt minimum for iOS)
  touchTarget: 44,                  // Minimum touch target size
  buttonHeight: 52,                 // Comfortable button height
  tabBarHeight: 80,                 // Tab bar with proper spacing
  
  // Content spacing
  paragraphSpacing: spacing[4],     // Between paragraphs
  listItemSpacing: spacing[3],      // Between list items
  
  // Form spacing
  formFieldSpacing: spacing[5],     // Between form fields
  formSectionSpacing: spacing[8],   // Between form sections
};
```

#### Layout Containers:
```typescript
export const containers = {
  // Screen containers
  screen: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: layout.screenPadding,
  },
  
  screenCentered: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  // Card container
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    padding: layout.cardPadding,
    marginBottom: layout.cardMargin,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Premium card with stronger shadow
  premiumCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    padding: layout.cardPadding,
    marginBottom: layout.cardMargin,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
```

## Component Library

### Event Card Component

#### Premium Event Card (Beli-Inspired):
```typescript
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - (layout.screenPadding * 2);

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress,
  style 
}) => {
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { duration: 100 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { duration: 100 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const formatEventDate = (date: Date) => {
    return format(date, 'EEE, MMM d • h:mm a');
  };
  
  const formatPrice = (min?: number, max?: number) => {
    if (!min || min === 0) return 'Free';
    if (!max || min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };
  
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, animatedStyle, style]}>
        {/* Hero Image Container */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: event.imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            locations={[0.5, 1]}
            style={styles.imageGradient}
          />
          
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary[500] }]}>
            <Text style={styles.categoryText}>
              {event.category.toUpperCase()}
            </Text>
          </View>
          
          {/* Price Badge (if paid event) */}
          {event.priceMin > 0 && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                {formatPrice(event.priceMin, event.priceMax)}
              </Text>
            </View>
          )}
          
          {/* Featured Badge */}
          {event.isFeatured && (
            <View style={styles.featuredBadge}>
              <Feather name="star" size={14} color={colors.warning[500]} />
            </View>
          )}
        </View>
        
        {/* Content Container */}
        <View style={styles.content}>
          {/* Event Title */}
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          
          {/* Event Metadata */}
          <View style={styles.metadata}>
            {/* Date & Time */}
            <View style={styles.metadataRow}>
              <Feather 
                name="calendar" 
                size={16} 
                color={colors.neutral[400]} 
                style={styles.metadataIcon}
              />
              <Text style={styles.metadataText}>
                {formatEventDate(event.dateTime)}
              </Text>
            </View>
            
            {/* Location */}
            <View style={styles.metadataRow}>
              <Feather 
                name="map-pin" 
                size={16} 
                color={colors.neutral[400]}
                style={styles.metadataIcon}
              />
              <Text style={styles.metadataText} numberOfLines={1}>
                {event.locationName}
                {event.neighborhood && ` • ${event.neighborhood}`}
              </Text>
            </View>
            
            {/* Attendees (if available) */}
            {event.currentAttendees > 0 && (
              <View style={styles.metadataRow}>
                <Feather 
                  name="users" 
                  size={16} 
                  color={colors.neutral[400]}
                  style={styles.metadataIcon}
                />
                <Text style={styles.metadataText}>
                  {event.currentAttendees} attending
                  {event.capacity && ` of ${event.capacity}`}
                </Text>
              </View>
            )}
          </View>
          
          {/* Social Proof */}
          {event.friendsAttending > 0 && (
            <View style={styles.socialProof}>
              <View style={styles.friendAvatars}>
                {/* Friend avatars would go here */}
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>+{event.friendsAttending}</Text>
                </View>
              </View>
              <Text style={styles.socialText}>
                {event.friendsAttending} {event.friendsAttending === 1 ? 'friend' : 'friends'} interested
              </Text>
            </View>
          )}
          
          {/* Description Preview */}
          {event.description && (
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
    overflow: 'hidden',
    ...containers.premiumCard,
    padding: 0, // Remove default padding for image
  },
  
  imageContainer: {
    height: 200,
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  
  categoryBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  
  categoryText: {
    ...typography.caption,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  
  priceBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  priceText: {
    ...typography.caption,
    color: colors.neutral[800],
    fontWeight: '700',
  },
  
  featuredBadge: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    width: 32,
    height: 32,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  content: {
    padding: spacing[6],
  },
  
  title: {
    ...typography.h2,
    color: colors.neutral[800],
    marginBottom: spacing[3],
  },
  
  metadata: {
    marginBottom: spacing[4],
  },
  
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  
  metadataIcon: {
    marginRight: spacing[2],
  },
  
  metadataText: {
    ...typography.body2,
    color: colors.neutral[500],
    flex: 1,
  },
  
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  
  friendAvatars: {
    flexDirection: 'row',
    marginRight: spacing[2],
  },
  
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  friendAvatarText: {
    ...typography.caption,
    color: colors.neutral[0],
    fontSize: 10,
    fontWeight: '700',
  },
  
  socialText: {
    ...typography.body2,
    color: colors.primary[600],
    fontWeight: '600',
  },
  
  description: {
    ...typography.body2,
    color: colors.neutral[500],
    lineHeight: 20,
  },
});
```

### Navigation Components

#### Clean Tab Bar (Anthropic-Inspired):
```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_CONFIG = {
  Discover: {
    icon: 'compass',
    label: 'Discover',
  },
  Calendar: {
    icon: 'calendar',
    label: 'My Events',
  },
  Friends: {
    icon: 'users',
    label: 'Friends',
  },
  Profile: {
    icon: 'user',
    label: 'Profile',
  },
};

export const CleanTabBar: React.FC<TabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
          
          if (!config) return null;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          
          return (
            <TabBarItem
              key={route.key}
              icon={config.icon}
              label={config.label}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

interface TabBarItemProps {
  icon: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}

const TabBarItem: React.FC<TabBarItemProps> = ({ 
  icon, 
  label, 
  isFocused, 
  onPress 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);
  
  React.useEffect(() => {
    opacity.value = withSpring(isFocused ? 1 : 0.6);
  }, [isFocused]);
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Feather
          name={icon as any}
          size={24}
          color={isFocused ? colors.primary[500] : colors.neutral[400]}
        />
        <Text 
          style={[
            styles.tabLabel,
            { color: isFocused ? colors.primary[500] : colors.neutral[400] }
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing[2],
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
    minHeight: layout.touchTarget,
    justifyContent: 'center',
  },
  
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabLabel: {
    ...typography.caption,
    marginTop: spacing[1],
    fontWeight: '600',
  },
});
```

### Swipe Overlay System

#### Sophisticated Swipe Feedback:
```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SwipeOverlayProps {
  direction: 'left' | 'right' | 'up' | 'down';
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
}

const OVERLAY_CONFIG = {
  right: {
    colors: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)'],
    textColor: colors.success[600],
    icon: 'calendar-plus',
    title: 'GOING',
    subtitle: 'Added to private calendar',
    position: 'right',
  },
  up: {
    colors: ['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.3)'],
    textColor: colors.primary[600],
    icon: 'users',
    title: 'SHARING',
    subtitle: 'Added to shared calendar',
    position: 'top',
  },
  down: {
    colors: ['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.3)'],
    textColor: colors.warning[600],
    icon: 'bookmark',
    title: 'SAVED',
    subtitle: 'Saved for later',
    position: 'bottom',
  },
  left: {
    colors: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)'],
    textColor: colors.error[600],
    icon: 'x',
    title: 'PASS',
    subtitle: 'Not interested',
    position: 'left',
  },
};

export const SwipeOverlay: React.FC<SwipeOverlayProps> = ({ 
  direction, 
  translateX, 
  translateY 
}) => {
  const config = OVERLAY_CONFIG[direction];
  
  const animatedStyle = useAnimatedStyle(() => {
    let opacity = 0;
    
    if (direction === 'left' || direction === 'right') {
      opacity = interpolate(
        Math.abs(translateX.value),
        [50, 150],
        [0, 1],
        Extrapolate.CLAMP
      );
    } else {
      opacity = interpolate(
        Math.abs(translateY.value),
        [50, 150],
        [0, 1],
        Extrapolate.CLAMP
      );
    }
    
    return {
      opacity,
    };
  });
  
  const getOverlayStyle = () => {
    switch (config.position) {
      case 'left':
        return styles.overlayLeft;
      case 'right':
        return styles.overlayRight;
      case 'top':
        return styles.overlayTop;
      case 'bottom':
        return styles.overlayBottom;
      default:
        return styles.overlayRight;
    }
  };
  
  return (
    <Animated.View style={[styles.overlay, getOverlayStyle(), animatedStyle]}>
      <LinearGradient
        colors={config.colors}
        style={styles.overlayGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.overlayContent}>
          <View style={[styles.iconContainer, { backgroundColor: config.textColor }]}>
            <Feather 
              name={config.icon as any} 
              size={28} 
              color={colors.neutral[0]} 
            />
          </View>
          
          <Text style={[styles.overlayTitle, { color: config.textColor }]}>
            {config.title}
          </Text>
          
          <Text style={styles.overlaySubtitle}>
            {config.subtitle}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    zIndex: 1000,
  },
  
  overlayLeft: {
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing[8],
  },
  
  overlayRight: {
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: spacing[8],
  },
  
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing[8],
  },
  
  overlayBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing[8],
  },
  
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  overlayContent: {
    alignItems: 'center',
  },
  
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  overlayTitle: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  
  overlaySubtitle: {
    ...typography.body2,
    color: colors.neutral[500],
    textAlign: 'center',
    fontWeight: '500',
  },
});
```

## Button System

### Premium Button Components:
```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const handlePressIn = () => {
    scale.value = withSpring(0.96);
    opacity.value = withSpring(0.8);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const getButtonStyle = () => {
    return [
      styles.button,
      styles[variant],
      styles[size],
      disabled && styles.disabled,
      style,
    ];
  };
  
  const getTextStyle = () => {
    return [
      styles.text,
      styles[`${variant}Text`],
      styles[`${size}Text`],
      disabled && styles.disabledText,
    ];
  };
  
  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;
    
    return (
      <Feather
        name={icon as any}
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
        color={getIconColor()}
        style={position === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };
  
  const getIconColor = () => {
    if (disabled) return colors.neutral[300];
    
    switch (variant) {
      case 'primary':
        return colors.neutral[0];
      case 'secondary':
        return colors.neutral[0];
      case 'outline':
        return colors.primary[500];
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.neutral[0];
    }
  };
  
  const renderContent = () => (
    <View style={styles.content}>
      {renderIcon('left')}
      
      {loading ? (
        <ActivityIndicator
          color={getIconColor()}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
      
      {renderIcon('right')}
    </View>
  );
  
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={getButtonStyle()}
          >
            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <Animated.View style={[getButtonStyle(), animatedStyle]}>
        {renderContent()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  primary: {
    // Gradient applied via LinearGradient component
  },
  
  secondary: {
    backgroundColor: colors.neutral[800],
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  small: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 36,
  },
  
  medium: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    minHeight: layout.buttonHeight,
  },
  
  large: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    minHeight: 56,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Text styles
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  
  primaryText: {
    color: colors.neutral[0],
  },
  
  secondaryText: {
    color: colors.neutral[0],
  },
  
  outlineText: {
    color: colors.primary[500],
  },
  
  ghostText: {
    color: colors.primary[500],
  },
  
  smallText: {
    fontSize: 14,
  },
  
  mediumText: {
    fontSize: 16,
  },
  
  largeText: {
    fontSize: 18,
  },
  
  disabledText: {
    opacity: 0.5,
  },
  
  // Icons
  iconLeft: {
    marginRight: spacing[2],
  },
  
  iconRight: {
    marginLeft: spacing[2],
  },
});
```

## Implementation Strategy

### Week 1: Foundation & Core Components

#### Day 1-2: Design System Setup
```typescript
// Create design tokens file
// src/design/tokens.ts
export { colors, typography, spacing, layout } from './tokens';

// Create base components
// src/components/base/
// - Typography.tsx
// - Container.tsx  
// - Card.tsx
// - Button.tsx
```

#### Day 3-4: Event Card Redesign
```typescript
// Replace existing EventCard component
// Add image handling and optimization
// Implement sophisticated layout
// Add micro-animations
```

#### Day 5-7: Navigation & Interactions
```typescript
// Redesign tab bar with clean aesthetics
// Add swipe overlay system
// Implement touch feedback animations
// Test on multiple screen sizes
```

### Week 2: Advanced Components & Screens

#### Day 8-10: Screen Layouts
```typescript
// Redesign DiscoverScreen with new event cards
// Update CalendarScreen with clean interface
// Redesign ProfileScreen with premium feel
// Add proper spacing and typography throughout
```

#### Day 11-12: Forms & Inputs
```typescript
// Create premium input components
// Add form validation UI
// Implement search interface
// Add friend invitation modals
```

#### Day 13-14: Polish & Optimization
```typescript
// Optimize animations for 60fps
// Add loading states and skeletons
// Implement error states
// Test accessibility features
```

### Week 3: Final Polish & Testing

#### Day 15-17: Advanced Features
```typescript
// Add notification system UI
// Implement settings screens
// Add onboarding flow
// Create empty states
```

#### Day 18-19: Performance & Testing
```typescript
// Optimize component rendering
// Add image caching and optimization
// Test on various devices
// Fix any performance issues
```

#### Day 20-21: Launch Preparation
```typescript
// Final design QA
// Animation polish
// Accessibility testing
// Documentation updates
```

## Performance Considerations

### Animation Optimization:
```typescript
// Use native driver for all animations
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}), []);

// Avoid animating layout properties
// Good: transform, opacity
// Avoid: width, height, padding, margin

// Use worklets for complex calculations
const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
  onStart: (event) => {
    'worklet';
    // Complex calculations run on UI thread
  },
});
```

### Image Optimization:
```typescript
// Implement progressive image loading
const ProgressiveImage = ({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return (
    <View style={style}>
      <Image
        source={{ uri: source.uri + '?w=400&q=75' }} // Optimize URL
        style={StyleSheet.absoluteFillObject}
        onLoad={() => {
          setLoaded(true);
          opacity.value = withSpring(1);
        }}
        resizeMode="cover"
      />
      {!loaded && (
        <View style={[StyleSheet.absoluteFillObject, styles.placeholder]} />
      )}
    </View>
  );
};
```

### Memory Management:
```typescript
// Clean up animations on unmount
useEffect(() => {
  return () => {
    // Cancel any running animations
    cancelAnimation(translateX);
    cancelAnimation(translateY);
  };
}, []);

// Optimize FlatList rendering
const EventList = ({ events }) => (
  <FlatList
    data={events}
    renderItem={renderEventCard}
    removeClippedSubviews={true}
    maxToRenderPerBatch={5}
    windowSize={10}
    getItemLayout={(data, index) => ({
      length: EVENT_CARD_HEIGHT,
      offset: EVENT_CARD_HEIGHT * index,
      index,
    })}
  />
);
```

## Accessibility Guidelines

### Typography Accessibility:
```typescript
// Support dynamic type scaling
const getDynamicFontSize = (baseSize: number) => {
  const scale = PixelRatio.getFontScale();
  return Math.min(baseSize * scale, baseSize * 1.5); // Cap at 150%
};

// Use semantic HTML-like roles
<Text
  style={styles.heading}
  accessibilityRole="header"
  accessibilityLevel={2}
>
  Event Title
</Text>
```

### Color Contrast:
```typescript
// Ensure WCAG AA compliance (4.5:1 contrast ratio)
const validateContrast = (foreground: string, background: string) => {
  // Implementation would check contrast ratio
  return contrastRatio >= 4.5;
};

// Provide alternative indicators beyond color
const StatusIndicator = ({ status }) => (
  <View style={styles.status}>
    <Feather name={getStatusIcon(status)} size={16} />
    <Text>{getStatusText(status)}</Text>
  </View>
);
```

### Touch Targets:
```typescript
// Ensure minimum 44pt touch targets
const TouchableArea = ({ children, onPress }) => (
  <TouchableOpacity
    style={[styles.touchable, { minWidth: 44, minHeight: 44 }]}
    onPress={onPress}
    accessibilityRole="button"
  >
    {children}
  </TouchableOpacity>
);
```

This comprehensive design system will transform Godo from a functional app into a premium, sophisticated experience that rivals the best design-forward applications while maintaining excellent usability for NYC event discovery.