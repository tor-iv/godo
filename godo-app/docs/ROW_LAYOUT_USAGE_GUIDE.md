# Row Layout Usage Guide

## Quick Start

### Basic Implementation

```tsx
import { ProfileStatsRowLayout } from '../components/profile/ProfileStatsRowLayout';

const MyProfileScreen = () => {
  const stats = {
    eventsAttended: 42,
    eventsSaved: 128,
    friendsConnected: 89
  };

  return (
    <View>
      <ProfileStatsRowLayout stats={stats} />
    </View>
  );
};
```

### Interactive Implementation

```tsx
import { ProfileStatsRowLayout, StatType } from '../components/profile/ProfileStatsRowLayout';

const InteractiveProfileScreen = () => {
  const handleStatPress = (statType: StatType, value: number) => {
    switch (statType) {
      case 'eventsAttended':
        navigation.navigate('MyEventsHistory');
        break;
      case 'eventsSaved':
        navigation.navigate('SavedEvents');
        break;
      case 'friendsConnected':
        navigation.navigate('FriendsNetwork');
        break;
    }
  };

  return (
    <ProfileStatsRowLayout 
      stats={stats}
      onStatPress={handleStatPress}
      showSubtitles={true}
      colorVariant="colorful"
    />
  );
};
```

## Layout Variants

### Single Row (Default)
Best for standard mobile screens (414px+ width)

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  layout="single-row"
  showSubtitles={true}
/>
```

### Two Row 
Optimal for small screens or when you need larger text

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  layout="two-row"
  showSubtitles={true}
/>
```

### Compact
Perfect for dashboard widgets or card previews

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  layout="compact"
  showIcons={true}
/>
```

### Elevated (With Background Card)
For standalone sections that need visual emphasis

```tsx
import { ElevatedProfileStatsRowLayout } from '../components/profile/ProfileStatsRowLayout';

<ElevatedProfileStatsRowLayout 
  stats={stats}
  layout="single-row"
  colorVariant="default"
  showSubtitles={true}
/>
```

## Color Variants

### Default (Recommended)
Uses British Racing Green theme with semantic colors

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  colorVariant="default" // British Racing Green + semantic colors
/>
```

### Monochrome
Clean, professional appearance with neutral grays

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  colorVariant="monochrome" // All neutral grays
/>
```

### Colorful
Vibrant NYC-themed colors for special contexts

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  colorVariant="colorful" // NYC taxi yellow, subway blue, etc.
/>
```

## Responsive Behavior

The component automatically adapts to different screen sizes:

- **Small devices (< 375px)**: Uses compact layout or two-row
- **Medium devices (375-413px)**: Single row with standard text
- **Large devices (414-767px)**: Single row with enhanced spacing
- **XLarge devices (768px+)**: Premium spacing with subtitles

### Force Specific Behavior

```tsx
// Override automatic layout selection
<ProfileStatsRowLayout 
  stats={stats}
  layout="single-row" // Force single row even on small devices
/>

// Disable icons on small screens only
<ProfileStatsRowLayout 
  stats={stats}
  showIcons={deviceInfo.size !== 'small'}
/>
```

## Advanced Features

### Custom Press Handlers

```tsx
const handleStatPress = (statType: StatType, value: number) => {
  // Analytics tracking
  analytics.track('profile_stat_pressed', {
    stat_type: statType,
    stat_value: value,
    screen: 'profile'
  });

  // Navigation with parameters
  navigation.navigate('StatDetail', {
    type: statType,
    value: value,
    title: getStatTitle(statType)
  });
};
```

### Conditional Subtitles

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  showSubtitles={deviceInfo.size !== 'small'} // Only show on larger screens
  layout={deviceInfo.isTablet ? 'single-row' : 'auto'}
/>
```

### Integration with State Management

```tsx
import { useSelector } from 'react-redux';

const ProfileStatsContainer = () => {
  const userStats = useSelector(state => state.user.stats);
  const isLoading = useSelector(state => state.user.statsLoading);

  if (isLoading) {
    return <ProfileStatsRowLayoutSkeleton />;
  }

  return (
    <ProfileStatsRowLayout 
      stats={userStats}
      onStatPress={handleStatPress}
      colorVariant="default"
    />
  );
};
```

## Accessibility Best Practices

### Screen Reader Support

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  testID="profile-stats" // For testing and debugging
  interactive={true} // Enables proper button roles
/>
```

### Custom Accessibility Labels

The component automatically generates appropriate accessibility labels:

- Container: "Profile statistics: 42 events attended, 128 events saved, 89 friends connected"
- Individual stats: "Events Attended: 42. Double tap to view details"

### High Contrast Support

The component respects system accessibility settings and provides:

- Sufficient color contrast ratios
- Proper focus indicators
- Touch target sizes (44pt minimum)

## Performance Optimization

### Memoization
The component uses React.memo and useMemo for optimal performance:

```tsx
// Component automatically memoizes based on props
<ProfileStatsRowLayout 
  stats={stats} // Only re-renders when stats change
  layout="single-row" // Layout changes trigger re-render
  colorVariant="default" // Color variant changes trigger re-render
/>
```

### Large Number Handling

```tsx
const stats = {
  eventsAttended: 1250000, // Automatically formatted as "1.3M"
  eventsSaved: 89500,      // Automatically formatted as "89.5K"  
  friendsConnected: 450    // Displayed as "450"
};
```

## Testing

### Unit Testing

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileStatsRowLayout } from './ProfileStatsRowLayout';

test('calls onStatPress with correct parameters', () => {
  const mockOnPress = jest.fn();
  const { getByTestId } = render(
    <ProfileStatsRowLayout 
      stats={mockStats}
      onStatPress={mockOnPress}
      testID="test-stats"
    />
  );
  
  fireEvent.press(getByTestId('test-stats-eventsAttended'));
  expect(mockOnPress).toHaveBeenCalledWith('eventsAttended', 42);
});
```

### Integration Testing

```tsx
test('adapts layout based on screen size', () => {
  // Mock small screen
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 350, height: 600 });
  
  const { getByTestId } = render(
    <ProfileStatsRowLayout stats={mockStats} testID="test-stats" />
  );
  
  expect(getByTestId('test-stats-compact-row')).toBeTruthy();
});
```

## Migration from Existing Components

### From ProfileStats

```tsx
// Before
<ProfileStats stats={stats} />

// After
<ProfileStatsRowLayout 
  stats={stats} 
  layout="single-row" // Maintains similar appearance
  colorVariant="default"
/>
```

### From ResponsiveProfileStats

```tsx
// Before
<ResponsiveProfileStats 
  stats={stats}
  variant="default"
  onStatPress={handlePress}
/>

// After
<ProfileStatsRowLayout 
  stats={stats}
  layout="single-row" // or "two-row" for better text readability
  onStatPress={handlePress}
  showSubtitles={false} // Add if desired
/>
```

## Troubleshooting

### Text Truncation Issues
If text is still being truncated:

```tsx
// Force two-row layout for more space
<ProfileStatsRowLayout 
  stats={stats}
  layout="two-row" 
/>

// Or use compact layout with shorter labels
<ProfileStatsRowLayout 
  stats={stats}
  layout="compact"
/>
```

### Touch Target Issues
Ensure interactive elements meet accessibility requirements:

```tsx
<ProfileStatsRowLayout 
  stats={stats}
  interactive={true} // Ensures proper touch targets
  onStatPress={handlePress}
/>
```

### Performance Issues
For better performance with frequent updates:

```tsx
// Memoize the stats object
const memoizedStats = useMemo(() => ({
  eventsAttended,
  eventsSaved,
  friendsConnected
}), [eventsAttended, eventsSaved, friendsConnected]);

<ProfileStatsRowLayout stats={memoizedStats} />
```

## Component Props Reference

```tsx
interface ProfileStatsRowLayoutProps {
  stats: {
    eventsAttended: number;
    eventsSaved: number;
    friendsConnected: number;
  };
  layout?: 'single-row' | 'two-row' | 'compact'; // Auto-selected if not provided
  colorVariant?: 'default' | 'monochrome' | 'colorful'; // Default: 'default'
  showSubtitles?: boolean; // Default: false
  showIcons?: boolean; // Default: true
  onStatPress?: (statType: StatType, value: number) => void;
  interactive?: boolean; // Default: !!onStatPress
  testID?: string; // Default: 'profile-stats-row'
}
```

---

This guide provides comprehensive examples for implementing the row-based layout architecture while maintaining consistency with the GoTo app's design system and user experience standards.