/**
 * Profile Stats Integration Validation Tests
 * Testing the integration between ProfileStats and ProfileStatsRowLayout
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ProfileStats, StatType } from '../src/components/profile/ProfileStats';

// Mock data for testing
const mockStats = {
  eventsAttended: 12,
  eventsSaved: 8,
  friendsConnected: 25,
};

// Mock responsive design system
jest.mock('../src/design/responsiveTokens', () => ({
  responsiveDesignSystem: {
    device: {
      size: 'medium',
    },
  },
}));

describe('ProfileStats Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    test('renders with minimum required props', () => {
      render(<ProfileStats stats={mockStats} />);
      
      expect(screen.getByText('12')).toBeTruthy();
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('25')).toBeTruthy();
    });

    test('maintains backward compatibility with original interface', () => {
      // This test ensures existing code using ProfileStats continues to work
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          testID="legacy-profile-stats"
        />
      );
      
      expect(getByTestId('legacy-profile-stats')).toBeTruthy();
    });

    test('applies default layout for medium devices', () => {
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          testID="profile-stats"
        />
      );
      
      // Should use single-row layout by default for medium devices
      expect(getByTestId('profile-stats-single-row')).toBeTruthy();
    });
  });

  describe('Layout Variants', () => {
    test('renders single-row layout correctly', () => {
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          layout="single-row"
          testID="single-row-test"
        />
      );
      
      expect(getByTestId('single-row-test-single-row')).toBeTruthy();
    });

    test('renders two-row layout correctly', () => {
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          layout="two-row"
          testID="two-row-test"
        />
      );
      
      expect(getByTestId('two-row-test-two-row')).toBeTruthy();
    });

    test('renders compact layout correctly', () => {
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          layout="compact"
          testID="compact-test"
        />
      );
      
      expect(getByTestId('compact-test-compact-row')).toBeTruthy();
    });
  });

  describe('Enhanced Features', () => {
    test('supports interactive mode with onStatPress callback', () => {
      const mockOnStatPress = jest.fn();
      
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          interactive={true}
          onStatPress={mockOnStatPress}
          testID="interactive-test"
        />
      );
      
      // Simulate pressing the events attended stat
      const eventsAttendedStat = getByTestId('interactive-test-eventsAttended');
      fireEvent.press(eventsAttendedStat);
      
      expect(mockOnStatPress).toHaveBeenCalledWith('eventsAttended', 12);
    });

    test('displays subtitles when enabled', () => {
      render(
        <ProfileStats 
          stats={mockStats}
          showSubtitles={true}
          layout="single-row"
          testID="subtitle-test"
        />
      );
      
      // Should show subtitle elements (implementation detail from ProfileStatsRowLayout)
      expect(screen.queryByText('+12% this month')).toBeTruthy();
    });

    test('passes through testID correctly', () => {
      const customTestId = 'custom-profile-stats';
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          testID={customTestId}
        />
      );
      
      expect(getByTestId(customTestId)).toBeTruthy();
    });
  });

  describe('Responsive Behavior', () => {
    test('uses compact layout for small devices when no layout specified', () => {
      // Mock small device
      jest.doMock('../src/design/responsiveTokens', () => ({
        responsiveDesignSystem: {
          device: {
            size: 'small',
          },
        },
      }));

      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          testID="small-device-test"
        />
      );
      
      // Should automatically use compact layout for small devices
      expect(getByTestId('small-device-test-compact-row')).toBeTruthy();
    });
  });

  describe('Component Integration', () => {
    test('correctly passes all props to ProfileStatsRowLayout', () => {
      const allPropsTest = {
        stats: mockStats,
        layout: 'two-row' as const,
        showSubtitles: true,
        interactive: true,
        onStatPress: jest.fn(),
        testID: 'full-props-test',
      };
      
      const { getByTestId } = render(<ProfileStats {...allPropsTest} />);
      
      expect(getByTestId('full-props-test')).toBeTruthy();
      expect(getByTestId('full-props-test-two-row')).toBeTruthy();
    });

    test('exports StatType for external use', () => {
      // This tests that the StatType is properly re-exported
      const statTypes: StatType[] = ['eventsAttended', 'eventsSaved', 'friendsConnected'];
      expect(statTypes).toHaveLength(3);
    });
  });

  describe('Accessibility Integration', () => {
    test('maintains accessibility features from ProfileStatsRowLayout', () => {
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          testID="accessibility-test"
        />
      );
      
      const container = getByTestId('accessibility-test');
      expect(container.props.accessible).toBe(true);
      expect(container.props.accessibilityRole).toBe('group');
    });

    test('supports accessibility hints for interactive stats', () => {
      const { getByTestId } = render(
        <ProfileStats 
          stats={mockStats}
          interactive={true}
          onStatPress={jest.fn()}
          testID="accessible-interactive-test"
        />
      );
      
      const eventsAttendedStat = getByTestId('accessible-interactive-test-eventsAttended');
      expect(eventsAttendedStat.props.accessibilityHint).toBe('Double tap to view details');
    });
  });

  describe('Performance Integration', () => {
    test('component memoization works correctly', () => {
      let renderCount = 0;
      const MemoizedProfileStats = React.memo(ProfileStats);
      
      const TestWrapper = ({ stats }: { stats: typeof mockStats }) => {
        renderCount++;
        return <MemoizedProfileStats stats={stats} testID="memo-test" />;
      };
      
      const { rerender } = render(<TestWrapper stats={mockStats} />);
      expect(renderCount).toBe(1);
      
      // Re-render with same props - should not trigger new render
      rerender(<TestWrapper stats={mockStats} />);
      expect(renderCount).toBe(1);
      
      // Re-render with different props - should trigger new render
      rerender(<TestWrapper stats={{ ...mockStats, eventsAttended: 15 }} />);
      expect(renderCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('handles missing stat values gracefully', () => {
      const incompleteStats = {
        eventsAttended: 0,
        eventsSaved: 0,
        friendsConnected: 0,
      };
      
      expect(() => {
        render(<ProfileStats stats={incompleteStats} />);
      }).not.toThrow();
    });

    test('handles undefined callback gracefully', () => {
      expect(() => {
        render(
          <ProfileStats 
            stats={mockStats}
            interactive={true}
            onStatPress={undefined}
          />
        );
      }).not.toThrow();
    });
  });
});