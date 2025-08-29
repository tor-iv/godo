import React from 'react';
import { ProfileStatsRowLayout, StatType } from './ProfileStatsRowLayout';
import { responsiveDesignSystem } from '../../design/responsiveTokens';

interface ProfileStatsProps {
  stats: {
    eventsAttended: number;
    eventsSaved: number;
    friendsConnected: number;
  };
  // Optional props for enhanced functionality
  layout?: 'single-row' | 'two-row' | 'compact';
  showSubtitles?: boolean;
  interactive?: boolean;
  onStatPress?: (statType: StatType, value: number) => void;
  testID?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  layout,
  showSubtitles = false,
  interactive = false,
  onStatPress,
  testID = 'profile-stats',
}) => {
  // Determine optimal layout if not specified
  const optimalLayout =
    layout ||
    (responsiveDesignSystem.device.size === 'small' ? 'compact' : 'single-row');

  return (
    <ProfileStatsRowLayout
      stats={stats}
      layout={optimalLayout}
      showSubtitles={showSubtitles}
      showIcons={true}
      onStatPress={onStatPress}
      interactive={interactive}
      colorVariant="default"
      testID={testID}
    />
  );
};

// Export the StatType for consumers who need to handle stat press events
export type { StatType };

// ProfileStats now uses ProfileStatsRowLayout for enhanced functionality:
// - Multiple layout variants (single-row, two-row, compact)
// - Improved accessibility with proper ARIA labels
// - Interactive capabilities with onStatPress support
// - Advanced responsive behavior with device-optimized layouts
// - Consistent design system integration
// - Performance optimizations with memoization
// - Comprehensive test coverage support
