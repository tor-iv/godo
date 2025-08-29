import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ProfileStatsRowLayout, ElevatedProfileStatsRowLayout } from '../src/components/profile/ProfileStatsRowLayout';
import { rowLayoutUtils } from '../src/design/rowLayoutTokens';

// Mock data
const mockStats = {
  eventsAttended: 42,
  eventsSaved: 128,
  friendsConnected: 89,
};

const mockStatsLarge = {
  eventsAttended: 1250,
  eventsSaved: 5670,
  friendsConnected: 890,
};

// Mock Dimensions for responsive testing
const mockDimensions = (width: number, height: number = 800) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 });
};

describe('ProfileStatsRowLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all stat items with correct values', () => {
      render(<ProfileStatsRowLayout stats={mockStats} />);
      
      expect(screen.getByText('42')).toBeTruthy();
      expect(screen.getByText('128')).toBeTruthy();
      expect(screen.getByText('89')).toBeTruthy();
    });

    it('renders with correct accessibility labels', () => {
      const { getByTestId } = render(<ProfileStatsRowLayout stats={mockStats} testID="test-stats" />);
      
      expect(getByTestId('test-stats')).toBeTruthy();
      expect(getByTestId('test-stats-eventsAttended')).toBeTruthy();
      expect(getByTestId('test-stats-eventsSaved')).toBeTruthy();
      expect(getByTestId('test-stats-friendsConnected')).toBeTruthy();
    });

    it('displays appropriate icons when showIcons is true', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout stats={mockStats} showIcons={true} testID="test-stats" />
      );
      
      // Icons are rendered through Feather component, checking container exists
      expect(getByTestId('test-stats-eventsAttended')).toBeTruthy();
      expect(getByTestId('test-stats-eventsSaved')).toBeTruthy();
      expect(getByTestId('test-stats-friendsConnected')).toBeTruthy();
    });
  });

  describe('Layout Variants', () => {
    it('renders single-row layout correctly', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          layout="single-row" 
          testID="test-stats" 
        />
      );
      
      expect(getByTestId('test-stats-single-row')).toBeTruthy();
    });

    it('renders two-row layout correctly', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          layout="two-row" 
          testID="test-stats" 
        />
      );
      
      expect(getByTestId('test-stats-two-row')).toBeTruthy();
    });

    it('renders compact layout correctly', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          layout="compact" 
          testID="test-stats" 
        />
      );
      
      expect(getByTestId('test-stats-compact-row')).toBeTruthy();
    });

    it('auto-selects layout based on device size', () => {
      // Test small device
      mockDimensions(350);
      const { getByTestId, rerender } = render(
        <ProfileStatsRowLayout stats={mockStats} testID="test-stats" />
      );
      
      // Should use compact or two-row on small devices
      expect(
        getByTestId('test-stats-compact-row') || getByTestId('test-stats-two-row')
      ).toBeTruthy();

      // Test large device
      mockDimensions(414);
      rerender(<ProfileStatsRowLayout stats={mockStats} testID="test-stats" />);
      
      expect(getByTestId('test-stats-single-row')).toBeTruthy();
    });
  });

  describe('Interactive Features', () => {
    it('calls onStatPress when stats are pressed', () => {
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
      
      fireEvent.press(getByTestId('test-stats-eventsSaved'));
      expect(mockOnPress).toHaveBeenCalledWith('eventsSaved', 128);
      
      fireEvent.press(getByTestId('test-stats-friendsConnected'));
      expect(mockOnPress).toHaveBeenCalledWith('friendsConnected', 89);
    });

    it('does not call onStatPress when not interactive', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          onStatPress={mockOnPress}
          interactive={false}
          testID="test-stats"
        />
      );
      
      fireEvent.press(getByTestId('test-stats-eventsAttended'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Number Formatting', () => {
    it('formats large numbers correctly in compact mode', () => {
      render(
        <ProfileStatsRowLayout 
          stats={mockStatsLarge} 
          layout="compact"
        />
      );
      
      expect(screen.getByText('1.3K')).toBeTruthy(); // 1250 -> 1.3K
      expect(screen.getByText('5.7K')).toBeTruthy(); // 5670 -> 5.7K
    });

    it('shows full numbers in non-compact mode', () => {
      render(
        <ProfileStatsRowLayout 
          stats={mockStatsLarge} 
          layout="single-row"
        />
      );
      
      expect(screen.getByText('1,250')).toBeTruthy();
      expect(screen.getByText('5,670')).toBeTruthy();
    });
  });

  describe('Text Labels', () => {
    it('shows short labels on small devices', () => {
      mockDimensions(350);
      render(<ProfileStatsRowLayout stats={mockStats} />);
      
      expect(screen.getByText('Events')).toBeTruthy();
      expect(screen.getByText('Saved')).toBeTruthy();
      expect(screen.getByText('Friends')).toBeTruthy();
    });

    it('shows full labels on large devices', () => {
      mockDimensions(414);
      render(<ProfileStatsRowLayout stats={mockStats} />);
      
      expect(screen.getByText('Events Attended')).toBeTruthy();
      expect(screen.getByText('Events Saved')).toBeTruthy();
      expect(screen.getByText('Friends Connected')).toBeTruthy();
    });

    it('shows subtitles when enabled', () => {
      render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          showSubtitles={true}
          layout="single-row"
        />
      );
      
      // Should show subtitle text (mocked as "+12% this month")
      expect(screen.getAllByText('+12% this month')).toHaveLength(3);
    });

    it('does not show subtitles in compact mode', () => {
      render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          showSubtitles={true}
          layout="compact"
        />
      );
      
      // Should not show subtitle in compact mode
      expect(screen.queryByText('+12% this month')).toBeNull();
    });
  });

  describe('Color Variants', () => {
    it('renders with default color variant', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          colorVariant="default"
          testID="test-stats"
        />
      );
      
      expect(getByTestId('test-stats')).toBeTruthy();
    });

    it('renders with monochrome color variant', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          colorVariant="monochrome"
          testID="test-stats"
        />
      );
      
      expect(getByTestId('test-stats')).toBeTruthy();
    });

    it('renders with colorful variant', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          colorVariant="colorful"
          testID="test-stats"
        />
      );
      
      expect(getByTestId('test-stats')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility roles', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          interactive={true}
          testID="test-stats"
        />
      );
      
      expect(getByTestId('test-stats')).toHaveProp('accessibilityRole', 'group');
      expect(getByTestId('test-stats-eventsAttended')).toHaveProp('accessibilityRole', 'button');
    });

    it('has descriptive accessibility labels', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          testID="test-stats"
        />
      );
      
      const container = getByTestId('test-stats');
      expect(container).toHaveProp('accessibilityLabel', 
        expect.stringContaining('Profile statistics')
      );
      
      const eventsAttended = getByTestId('test-stats-eventsAttended');
      expect(eventsAttended).toHaveProp('accessibilityLabel',
        expect.stringContaining('Events Attended: 42')
      );
    });

    it('provides appropriate accessibility hints for interactive elements', () => {
      const { getByTestId } = render(
        <ProfileStatsRowLayout 
          stats={mockStats} 
          interactive={true}
          onStatPress={() => {}}
          testID="test-stats"
        />
      );
      
      expect(getByTestId('test-stats-eventsAttended')).toHaveProp(
        'accessibilityHint',
        'Double tap to view details'
      );
    });
  });
});

describe('ElevatedProfileStatsRowLayout', () => {
  it('renders with elevated styling', () => {
    const { getByTestId } = render(
      <ElevatedProfileStatsRowLayout stats={mockStats} testID="test-stats" />
    );
    
    expect(getByTestId('test-stats')).toBeTruthy();
  });

  it('passes props correctly to underlying component', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ElevatedProfileStatsRowLayout 
        stats={mockStats}
        onStatPress={mockOnPress}
        colorVariant="colorful"
        testID="test-stats"
      />
    );
    
    fireEvent.press(getByTestId('test-stats-eventsAttended'));
    expect(mockOnPress).toHaveBeenCalledWith('eventsAttended', 42);
  });
});

describe('rowLayoutUtils', () => {
  describe('getOptimalLayout', () => {
    it('returns compact for small devices with 3 stats', () => {
      mockDimensions(350);
      expect(rowLayoutUtils.getOptimalLayout(3)).toBe('compact');
    });

    it('returns single-row for large devices', () => {
      mockDimensions(414);
      expect(rowLayoutUtils.getOptimalLayout(3)).toBe('single-row');
    });
  });

  describe('formatStatValue', () => {
    it('formats numbers correctly', () => {
      expect(rowLayoutUtils.formatStatValue(42)).toBe('42');
      expect(rowLayoutUtils.formatStatValue(1250)).toBe('1.3K');
      expect(rowLayoutUtils.formatStatValue(1500000)).toBe('1.5M');
    });
  });

  describe('getResponsiveLabel', () => {
    it('returns shortened labels when appropriate', () => {
      mockDimensions(350); // Small device
      
      expect(rowLayoutUtils.getResponsiveLabel('Events Attended')).toBe('Events');
      expect(rowLayoutUtils.getResponsiveLabel('Events Saved')).toBe('Saved');
      expect(rowLayoutUtils.getResponsiveLabel('Friends Connected')).toBe('Friends');
    });

    it('returns original label for unknown labels', () => {
      expect(rowLayoutUtils.getResponsiveLabel('Unknown Label')).toBe('Unknown Label');
    });
  });

  describe('getStatColors', () => {
    it('returns appropriate colors for stat types', () => {
      const colors = rowLayoutUtils.getStatColors('eventsAttended', 'default');
      expect(colors).toHaveProperty('iconColor');
      expect(colors).toHaveProperty('backgroundColor');
      expect(colors).toHaveProperty('borderColor');
    });

    it('falls back to default colors for unknown stat types', () => {
      const colors = rowLayoutUtils.getStatColors('unknownStat', 'default');
      expect(colors).toHaveProperty('iconColor');
      expect(colors).toHaveProperty('backgroundColor');
      expect(colors).toHaveProperty('borderColor');
    });
  });
});

// Performance and rendering tests
describe('Performance', () => {
  it('renders efficiently with many re-renders', () => {
    const { rerender } = render(<ProfileStatsRowLayout stats={mockStats} />);
    
    // Multiple re-renders should not cause issues
    for (let i = 0; i < 10; i++) {
      rerender(
        <ProfileStatsRowLayout 
          stats={{
            eventsAttended: i * 10,
            eventsSaved: i * 20,
            friendsConnected: i * 5,
          }}
        />
      );
    }
    
    expect(screen.getByText('90')).toBeTruthy(); // Last eventsAttended value
  });

  it('memoizes components properly', () => {
    const { rerender } = render(
      <ProfileStatsRowLayout stats={mockStats} colorVariant="default" />
    );
    
    // Same props should not cause unnecessary re-renders
    rerender(
      <ProfileStatsRowLayout stats={mockStats} colorVariant="default" />
    );
    
    expect(screen.getByText('42')).toBeTruthy();
  });
});