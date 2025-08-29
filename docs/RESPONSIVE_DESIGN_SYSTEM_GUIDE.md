# Responsive Typography & Layout System Guide

## Overview

This comprehensive design system provides scalable, accessible, and mobile-first typography and layout patterns for React Native applications. It automatically adapts to different screen sizes while maintaining consistency and usability.

## 📱 Device Detection & Responsive Scaling

### Device Categories
- **Small** (< 375px): iPhone SE, compact devices
- **Medium** (375-413px): iPhone 8, standard phones  
- **Large** (414-767px): iPhone Pro, larger phones
- **XLarge** (768px+): Tablets and large devices

### Auto-Scaling Features
- **Typography**: Scales 0.85x - 1.25x based on device size
- **Spacing**: Adaptive spacing with device-specific multipliers
- **Touch Targets**: Minimum 44px (iOS HIG compliant)
- **Icons**: Contextual sizing (20-24px on small, up to 28px on large)

## 🔤 Typography System

### Responsive Font Scaling
```typescript
import { getResponsiveFontSize } from '../src/design/responsiveTokens';

// Auto-scales: 12px on small, 14px on medium, 15px on large, 17px on xlarge
const bodySize = getResponsiveFontSize('md', { min: 12, max: 18 });

// With constraints
const headingSize = getResponsiveFontSize('2xl', { 
  min: 18,  // Never smaller than 18px
  max: 28   // Never larger than 28px  
});
```

### Typography Hierarchy

#### Display Typography (Headlines)
```typescript
// Display 1: 28-44px (Page titles, major headings)
responsiveTypography.display[1]

// Display 2: 24-36px (Section headers)
responsiveTypography.display[2] 

// Display 3: 20-32px (Sub-section headers)
responsiveTypography.display[3]
```

#### Body Typography
```typescript
// Large body: 14-18px (Primary content)
responsiveTypography.body.large

// Medium body: 12-16px (Standard content)  
responsiveTypography.body.medium

// Small body: 10-14px (Secondary content)
responsiveTypography.body.small
```

#### UI Typography
```typescript
// Button text: 12-16px (Interactive elements)
responsiveTypography.ui.button

// Labels: 10-14px (Form labels, captions)
responsiveTypography.ui.label

// Captions: 9-12px (Fine print, metadata)
responsiveTypography.ui.caption
```

#### Stats & Numbers
```typescript
// Large stats: 24-32px (Profile stats, metrics)
responsiveTypography.stats.large

// Medium stats: 18-24px (Card statistics)
responsiveTypography.stats.medium

// Small stats: 14-18px (Inline numbers)
responsiveTypography.stats.small
```

## 📐 Spacing & Layout System

### Responsive Spacing
```typescript
import { getResponsiveSpacing } from '../src/design/responsiveTokens';

// Auto-scales: 14px on small, 16px on medium, 18px on large, 20px on xlarge
const spacing = getResponsiveSpacing(4);

// With constraints
const padding = getResponsiveSpacing(6, { min: 16, max: 32 });
```

### Layout Patterns

#### Screen Containers
```typescript
import { layoutPatterns } from '../src/design/layoutPatterns';

// Basic screen with flex: 1
const screenStyle = layoutPatterns.container.screen.base;

// Screen with responsive padding
const paddedScreenStyle = layoutPatterns.container.screen.padded;

// Safe area with responsive margins
const safeAreaStyle = layoutPatterns.container.screen.safeArea;
```

#### Card Layouts
```typescript
// Standard card with border
const cardStyle = layoutPatterns.container.card.bordered;

// Elevated card with shadow
const elevatedStyle = layoutPatterns.container.card.elevated;

// Interactive card with press states
const interactiveStyle = layoutPatterns.container.card.interactive;
```

#### Touch Patterns
```typescript
// Standard button (44px minimum height)
const buttonStyle = layoutPatterns.touch.button.base;

// Large touch target (52-60px)
const largeButtonStyle = layoutPatterns.touch.button.large;

// Icon button (44x44px minimum)  
const iconButtonStyle = layoutPatterns.touch.button.icon;

// List item with proper touch target
const listItemStyle = layoutPatterns.touch.listItem.base;
```

## 📱 Text Truncation & Fitting

### Single Line Truncation
```typescript
import { textTruncation } from '../src/design/responsiveTokens';

// Basic single line with ellipsis
<Text style={textTruncation.singleLine}>
  Very long text that will be truncated...
</Text>
```

### Multi-Line Truncation
```typescript
// Exactly 2 lines
<Text style={textTruncation.multiLine(2)}>
  Longer content that spans multiple lines but truncates after exactly 2 lines with an ellipsis...
</Text>
```

### Responsive Truncation
```typescript
// Adapts lines based on screen size
<Text style={textTruncation.responsive.title}>
  {/* 1 line on small screens, 2 lines on larger screens */}
  Article Title That Adapts to Screen Size
</Text>

<Text style={textTruncation.responsive.description}>
  {/* 3 lines on small, 4 lines on larger screens */}
  Longer description content...
</Text>
```

## 🎯 Component Examples

### Responsive Profile Stats
```typescript
import { ResponsiveProfileStats } from '../src/components/profile/ResponsiveProfileStats';

// Basic usage - auto-adapts to screen size
<ResponsiveProfileStats 
  stats={{
    eventsAttended: 42,
    eventsSaved: 128,
    friendsConnected: 89
  }}
/>

// Compact variant for smaller spaces
<ResponsiveProfileStats 
  stats={stats}
  variant="compact"
/>

// Interactive with press handlers
<ResponsiveProfileStats 
  stats={stats}
  onStatPress={(statType) => {
    navigation.navigate('StatDetail', { type: statType });
  }}
/>
```

### Responsive Calendar Toggle
```typescript
import { ResponsiveEventFilterToggle } from '../src/components/calendar/ResponsiveEventFilterToggle';

// Dropdown variant (space-efficient)
<ResponsiveEventFilterToggle
  currentFilter="all"
  onFilterChange={setFilter}
  variant="dropdown"
  size="medium"
/>

// Tabs variant (better for mobile)
<ResponsiveEventFilterToggle
  currentFilter="private"
  onFilterChange={setFilter}  
  variant="tabs"
  size="small"
  fullWidth={true}
/>

// Pills variant (modern look)
<ResponsiveEventFilterToggle
  currentFilter="public"
  onFilterChange={setFilter}
  variant="pills"
  showIcons={true}
/>
```

## 🔧 Utility Functions

### Quick Design Utilities
```typescript
import { designUtils } from '../src/design/designSystem';

// Create consistent card styles
const cardStyle = designUtils.createCardStyle('bordered');
const elevatedCard = designUtils.createCardStyle('elevated');

// Create button styles with size variants
const primaryButton = designUtils.createButtonStyle('primary', 'medium');
const smallSecondary = designUtils.createButtonStyle('secondary', 'small');

// Create text styles with truncation
const headingStyle = designUtils.createTextStyle('heading');
const truncatedBody = designUtils.createTextStyle('body', 2); // 2 lines max

// Responsive spacing helper
const spacing = designUtils.getSpacing(2); // 2x base spacing

// Icon sizing
const smallIcon = designUtils.getIconSize('small'); // 18px
const largeIcon = designUtils.getIconSize('large'); // 36px

// Color with opacity
const overlayColor = designUtils.addOpacity('#000000', 0.5); // #00000080
```

### Device Detection
```typescript
// Check current device characteristics
if (designUtils.isSmallScreen()) {
  // Special handling for small screens
}

if (designUtils.isTablet()) {
  // Tablet-specific layout
}

// Access device info
console.log(deviceInfo.size); // 'small' | 'medium' | 'large' | 'xlarge'  
console.log(deviceInfo.type); // 'phone' | 'tablet' | 'desktop'
console.log(deviceInfo.width); // Screen width in pixels
```

## 📱 Mobile-First Best Practices

### Touch Targets
- **Minimum**: 44px (iOS Human Interface Guidelines)
- **Comfortable**: 48-52px for primary actions  
- **Large**: 56-60px for important CTAs
- **Icon buttons**: 44x44px minimum with 8px internal padding

### Typography Guidelines
- **Minimum font size**: 10px (accessibility consideration)
- **Body text**: 12-16px range for readability
- **Touch labels**: 12px+ for finger-friendly interaction
- **Line height**: 1.2-1.5x font size for optimal reading

### Spacing Principles  
- **Screen padding**: 16-32px based on device size
- **Component spacing**: 12-20px between related elements
- **Section spacing**: 24-40px between major sections
- **Form fields**: 16-24px vertical spacing for thumb navigation

### Responsive Breakpoints
```typescript
// Use built-in media queries
if (mediaQuery.small) {
  // < 375px: Compact layout, minimal text
}
if (mediaQuery.medium) {  
  // 375-413px: Standard phone layout
}
if (mediaQuery.large) {
  // 414-767px: Large phone, more breathing room
}
if (mediaQuery.xlarge) {
  // 768px+: Tablet layout, multi-column options
}
```

## ♿ Accessibility Features

### Text Scaling Support
```typescript
// Respects user's accessibility text size preferences
const accessibleSize = accessibility.getAccessibleFontSize(16, userScaleFactor);
```

### Touch Target Validation
```typescript
// Validates minimum touch target sizes  
const isValid = designValidation.validateTouchTarget(42); // false - too small
const isValidLarge = designValidation.validateTouchTarget(48); // true
```

### High Contrast Support
```typescript
// Enhanced borders and focus indicators for accessibility
const highContrastStyle = {
  borderWidth: accessibility.highContrast.borderWidth, // 2px
  focusOutlineWidth: accessibility.highContrast.focusOutlineWidth, // 3px
};
```

## 🎨 Color System Integration

### Semantic Colors
```typescript
// Use semantic color tokens that adapt to themes
const successColor = colors.success[500]; // British Racing Green
const warningColor = colors.warning[500]; // Warning orange
const errorColor = colors.error[500]; // Error red  
const infoColor = colors.info[500]; // Info blue
```

### Neutral Palette  
```typescript
// Well-balanced neutral colors for text and backgrounds
const primaryText = colors.neutral[800]; // Dark text
const secondaryText = colors.neutral[500]; // Medium text  
const disabledText = colors.neutral[400]; // Light text
const borderColor = colors.neutral[200]; // Subtle borders
const backgroundColor = colors.neutral[50]; // Light backgrounds
```

## 🚀 Performance Optimizations

### Pre-calculated Values
```typescript
import { designPerformance } from '../src/design/designSystem';

// Use pre-calculated common values to avoid runtime computation
const { preCalculatedStyles } = designPerformance;

const styles = StyleSheet.create({
  container: {
    padding: preCalculatedStyles.screenPadding, // Pre-calculated
    borderRadius: preCalculatedStyles.cardBorderRadius, // Pre-calculated
    minHeight: preCalculatedStyles.touchTargetSize, // Pre-calculated
  }
});
```

### Memoization
```typescript
// Memoize expensive style calculations
const expensiveStyle = useMemo(() => 
  designPerformance.createMemoizedStyle(() => ({
    // Complex style calculations here
  })), 
  [dependency]
);
```

## 📖 Implementation Guide

### 1. Import the Design System
```typescript
import designSystem, { 
  responsiveTypography,
  layoutPatterns,
  getResponsiveSpacing,
  designUtils 
} from '../src/design/designSystem';
```

### 2. Create Component Styles
```typescript
const styles = StyleSheet.create({
  container: {
    ...layoutPatterns.container.screen.padded,
  },
  title: {
    ...responsiveTypography.heading[1],
    marginBottom: getResponsiveSpacing(4),
  },
  card: {
    ...designUtils.createCardStyle('bordered'),
  },
  button: {
    ...designUtils.createButtonStyle('primary', 'medium'),
  }
});
```

### 3. Handle Device-Specific Logic
```typescript
const MyComponent = () => {
  const isSmall = designUtils.isSmallScreen();
  const iconSize = designUtils.getIconSize(isSmall ? 'small' : 'medium');
  
  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        isSmall && { fontSize: quickAccess.fonts.subtitle }
      ]}>
        {isSmall ? 'Events' : 'My Events'}
      </Text>
    </View>
  );
};
```

## 🔄 Migration from Existing Components

### Before (Fixed Sizing)
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    height: 44,
    paddingHorizontal: 16,
  }
});
```

### After (Responsive)
```typescript
const styles = StyleSheet.create({
  title: {
    ...responsiveTypography.heading[2],
    marginBottom: getResponsiveSpacing(4),
  },
  button: {
    ...designUtils.createButtonStyle('primary', 'medium'),
  }
});
```

## 📱 Testing Responsive Behavior

### Simulator Testing
1. Test on iPhone SE (small screens)
2. Test on iPhone 14 Pro (large screens) 
3. Test on iPad (xlarge screens)
4. Verify text truncation works correctly
5. Check touch target accessibility

### Accessibility Testing  
1. Enable large text sizes in iOS Settings
2. Test with VoiceOver/TalkBack enabled
3. Verify color contrast ratios
4. Test touch target sizes with accessibility tools

---

This design system ensures your React Native app provides an excellent user experience across all device sizes while maintaining design consistency and accessibility standards.