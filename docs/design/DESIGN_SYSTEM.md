# Godo Design System

Complete design system for the Godo event discovery app, featuring a British Racing Green palette with flat, minimalist design principles.

## Overview

This design system is inspired by:
- **Anthropic's minimalism** - Extreme white space, content-first design
- **Beli's premium feel** - High-quality imagery, sophisticated palettes, generous spacing
- **Flat design principles** - No shadows or gradients, clean borders and spacing

### Core Design Goals

1. **Trustworthy & Professional** - NYC professionals feel confident using the app
2. **Effortlessly Social** - Natural social features without forced interaction
3. **Premium but Accessible** - High-end feel without intimidation
4. **Swipe-Optimized** - Interface designed around gesture-based interaction
5. **Content-First** - Design serves content, never competes with it

---

## Color System

### British Racing Green Palette

The primary color is British Racing Green (#004225), a sophisticated deep green that conveys trust, growth, and local NYC energy.

```typescript
primary: {
  50: '#e6f2ed',   // Lightest tint
  100: '#ccf0e0',
  200: '#99e0c1',
  300: '#66d1a2',
  400: '#33c183',
  500: '#004225',  // British Racing Green (main brand)
  600: '#003a20',
  700: '#00311b',
  800: '#002916',
  900: '#002011',  // Darkest shade
}
```

### Neutral Palette

Grayscale for text, borders, and backgrounds with flat design aesthetic.

```typescript
neutral: {
  50: '#FAFAFA',   // Background
  100: '#F5F5F5',  // Card surfaces
  200: '#E4E4E7',  // Borders (light)
  300: '#D4D4D8',  // Disabled states
  400: '#A1A1AA',  // Active borders
  500: '#71717A',  // Secondary text
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',  // Primary text
}
```

### Semantic Colors

```typescript
semantic: {
  success: '#10B981',   // Green for positive actions
  warning: '#F59E0B',   // Amber for warnings
  error: '#EF4444',     // Red for errors
  info: '#3B82F6',      // Blue for information
}
```

---

## Typography

### Font Stack

```typescript
fonts: {
  display: 'SF Pro Display',  // iOS headlines
  text: 'SF Pro Text',        // iOS body text
  mono: 'SF Mono',            // Code/technical

  // Android fallbacks
  androidDisplay: 'Roboto',
  androidText: 'Roboto',
  androidMono: 'Roboto Mono',
}
```

### Typography Scale

```typescript
typography: {
  // Display (Headlines)
  display1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  display2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  display3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: -0.4,
  },

  // Headings
  heading1: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Body
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  // Supporting
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
}
```

---

## Flat Design System

### Border Specifications

Replace shadows and elevation with clean, consistent borders.

```typescript
borders: {
  colors: {
    light: '#E4E4E7',    // Main outline (neutral[200])
    medium: '#D4D4D8',   // Disabled states (neutral[300])
    dark: '#A1A1AA',     // Active states (neutral[400])
    accent: '#004225',   // Selected states (primary[500])
  },
  widths: {
    hairline: 0.5,       // Subtle dividers
    thin: 1,             // Standard outlines
    medium: 2,           // Focus/active states
    thick: 3,            // Emphasis/selection
  },
  radius: {
    none: 0,
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    full: 9999,
  },
}
```

### Visual Hierarchy

Achieved through:
1. **Border Weight** - Thin (1px) → Medium (2px) → Thick (3px)
2. **Color Intensity** - Light gray → Medium gray → Dark gray → Accent
3. **Spacing** - Generous padding and margins
4. **Typography** - Weight and size variations

---

## Spacing System

4px base unit with consistent scale.

```typescript
spacing: {
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 16,     // 16px
  lg: 24,     // 24px
  xl: 32,     // 32px
  xxl: 48,    // 48px
  xxxl: 64,   // 64px
}
```

### Layout Patterns

```typescript
layout: {
  screenPadding: 16,        // Standard screen margins
  cardPadding: 16,          // Card internal padding
  sectionSpacing: 24,       // Between major sections
  elementSpacing: 12,       // Between related elements
  tightSpacing: 8,          // Compact layouts
  componentGap: 16,         // Between components
}
```

---

## Component Specifications

### Buttons

```typescript
// Primary Button
{
  backgroundColor: colors.primary[500],
  borderWidth: 0,
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 24,
  minHeight: 44,  // iOS touch target
}

// Secondary Button
{
  backgroundColor: 'transparent',
  borderWidth: 2,
  borderColor: colors.primary[500],
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 24,
}

// Text Button
{
  backgroundColor: 'transparent',
  borderWidth: 0,
  paddingVertical: 8,
  paddingHorizontal: 12,
}
```

### Cards

```typescript
// Event Card
{
  backgroundColor: colors.neutral[50],
  borderWidth: 1,
  borderColor: colors.borders.light,
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
}

// Profile Card
{
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: colors.borders.light,
  borderRadius: 8,
  padding: 16,
}
```

### Form Elements

```typescript
// Text Input
{
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: colors.borders.light,
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  minHeight: 44,

  // Focus state
  ':focus': {
    borderWidth: 2,
    borderColor: colors.primary[500],
  }
}
```

---

## Touch Targets & Accessibility

### Minimum Sizes

- **Touch targets**: 44x44 points (iOS), 48x48 dp (Android)
- **Icon buttons**: 44x44 minimum
- **Text links**: 44px tall tap area
- **Swipe zones**: Full card height (minimum 200px)

### Contrast Ratios

All text meets WCAG 2.1 Level AA standards:
- **Large text** (18pt+): 3:1 minimum
- **Normal text**: 4.5:1 minimum
- **UI components**: 3:1 minimum

### Focus States

All interactive elements have clear focus indicators:
- Border width increases from 1px to 2px
- Border color changes to primary[500]
- No reliance on color alone for state indication

---

## Responsive Patterns

### Breakpoints

```typescript
breakpoints: {
  mobile: 0,        // 0-767px
  tablet: 768,      // 768-1023px
  desktop: 1024,    // 1024px+
}
```

### Adaptive Layouts

- **Mobile-first** approach
- **Single-column** layouts on mobile
- **Flexible spacing** that scales with screen size
- **Thumb-friendly** zones for primary actions

---

## Animation & Motion

### Timing

```typescript
animation: {
  fast: 150,        // Quick feedback
  normal: 250,      // Standard transitions
  slow: 350,        // Emphasized motion

  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  }
}
```

### Swipe Gestures

- **Horizontal swipe**: 250ms spring animation
- **Card dismissal**: 350ms with deceleration
- **Snap to position**: 200ms with bounce
- **Haptic feedback**: Light impact on swipe threshold

---

## Implementation Files

Design tokens are implemented in:
- `/godo-app/src/design/flatTokens.ts` - Flat design system tokens
- `/godo-app/src/design/greenPalette.ts` - British Racing Green palette
- `/godo-app/src/design/designSystem.ts` - Complete design system export
- `/godo-app/src/design/tokens.ts` - Legacy tokens (being phased out)

### Usage Example

```typescript
import { flatTokens } from '@/design/flatTokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: flatTokens.colors.neutral[50],
    padding: flatTokens.spacing.md,
    borderRadius: flatTokens.borders.radius.medium,
    borderWidth: flatTokens.borders.widths.thin,
    borderColor: flatTokens.borders.colors.light,
  },
  title: {
    ...flatTokens.typography.heading1,
    color: flatTokens.colors.neutral[900],
  },
});
```

---

## Migration Notes

### From Purple to Green

If migrating components from the old purple palette:

1. Replace `colors.primary[500]` references (was purple, now green)
2. Update any hardcoded hex values to use tokens
3. Test contrast ratios for accessibility
4. Verify focus states use new green accent

### From Shadow to Flat

If migrating from shadow-based designs:

1. Remove all `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` properties
2. Add border styles using `flatTokens.borders`
3. Increase padding for visual breathing room
4. Use border weight for hierarchy instead of shadows

---

## Design System Principles

1. **Consistency** - Use tokens, not hardcoded values
2. **Accessibility First** - Meet WCAG 2.1 Level AA minimum
3. **Mobile Optimized** - Design for touch, scale for desktop
4. **Content Priority** - Design serves content
5. **Performance** - Minimize re-renders, optimize animations
6. **Maintainability** - Single source of truth for design decisions