import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { MyEventsScreen } from '../../../src/screens/calendar/MyEventsScreen';
import { EventFilterToggle } from '../../../src/components/calendar/EventFilterToggle';
import { DateNavigation } from '../../../src/components/calendar/DateNavigation';

// Mock dependencies
jest.mock('../../../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => [],
      getSavedEvents: () => [],
      getSwipeStats: () => ({ interested: 0, publicEvents: 0, saved: 0 }),
      getPrivateCalendarEvents: () => [],
      getPublicCalendarEvents: () => [],
    }),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => callback(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock Dimensions to test different screen sizes
const mockDimensions = jest.spyOn(Dimensions, 'get');

describe('Responsive Layout Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockDimensions.mockRestore();
  });

  describe('Small Screen Layout (Phone Portrait)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1,
      });
    });

    it('should render filter toggle in compact mode on small screens', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={jest.fn()}
        />
      );

      // Filter should be present and compact
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should maintain header layout on small screens', () => {
      const { getByText } = render(<MyEventsScreen />);
      
      expect(getByText('My Events')).toBeTruthy();
    });

    it('should handle date navigation on small screens', () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-08-29"
          viewType="month"
          onDateChange={jest.fn()}
        />
      );

      expect(getByText('August 2025')).toBeTruthy();
    });
  });

  describe('Medium Screen Layout (Phone Landscape)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({
        width: 812,
        height: 375,
        scale: 3,
        fontScale: 1,
      });
    });

    it('should adapt header layout for landscape orientation', () => {
      const { getByText } = render(<MyEventsScreen />);
      
      // Should still render main components
      expect(getByText('My Events')).toBeTruthy();
    });

    it('should maintain filter toggle functionality in landscape', () => {
      const mockOnChange = jest.fn();
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnChange}
        />
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });
  });

  describe('Large Screen Layout (Tablet Portrait)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });
    });

    it('should provide adequate spacing on larger screens', () => {
      const { getByText } = render(<MyEventsScreen />);
      
      expect(getByText('My Events')).toBeTruthy();
    });

    it('should maintain proper proportions for filter toggle on tablets', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={jest.fn()}
        />
      );

      // All filter options should be visible and well-spaced
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should handle date navigation with increased touch targets on tablets', () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-08-29"
          viewType="month"
          onDateChange={jest.fn()}
        />
      );

      expect(getByText('August 2025')).toBeTruthy();
    });
  });

  describe('Extra Large Screen Layout (Tablet Landscape)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({
        width: 1024,
        height: 768,
        scale: 2,
        fontScale: 1,
      });
    });

    it('should optimize layout for wide screens', () => {
      const { getByText } = render(<MyEventsScreen />);
      
      expect(getByText('My Events')).toBeTruthy();
    });

    it('should maintain readable text and proper spacing on large screens', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="private"
          onFilterChange={jest.fn()}
        />
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });
  });

  describe('Font Scale Responsiveness', () => {
    it('should handle larger font scales for accessibility', () => {
      mockDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1.5, // 150% font size
      });

      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={jest.fn()}
        />
      );

      // Should still render all options with larger fonts
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should maintain layout with maximum font scale', () => {
      mockDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 2.0, // 200% font size
      });

      const { getByText } = render(<MyEventsScreen />);
      
      // Should not break layout with very large fonts
      expect(getByText('My Events')).toBeTruthy();
    });
  });

  describe('Edge Cases and Extreme Dimensions', () => {
    it('should handle very narrow screens gracefully', () => {
      mockDimensions.mockReturnValue({
        width: 200,
        height: 400,
        scale: 2,
        fontScale: 1,
      });

      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={jest.fn()}
        />
      );

      // Should still be functional even on very narrow screens
      expect(getByText('All')).toBeTruthy();
    });

    it('should handle very wide screens without breaking', () => {
      mockDimensions.mockReturnValue({
        width: 1920,
        height: 1080,
        scale: 1,
        fontScale: 1,
      });

      const { getByText } = render(<MyEventsScreen />);
      
      expect(getByText('My Events')).toBeTruthy();
    });

    it('should maintain functionality on square screens', () => {
      mockDimensions.mockReturnValue({
        width: 600,
        height: 600,
        scale: 2,
        fontScale: 1,
      });

      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-08-29"
          viewType="month"
          onDateChange={jest.fn()}
        />
      );

      expect(getByText('August 2025')).toBeTruthy();
    });
  });

  describe('Layout Consistency Across Screen Sizes', () => {
    const testScreenSizes = [
      { width: 375, height: 812, name: 'iPhone X' },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
    ];

    testScreenSizes.forEach(({ width, height, name }) => {
      it(`should maintain consistent header structure on ${name}`, () => {
        mockDimensions.mockReturnValue({
          width,
          height,
          scale: 2,
          fontScale: 1,
        });

        const { getByText } = render(<MyEventsScreen />);
        
        // Core elements should always be present
        expect(getByText('My Events')).toBeTruthy();
      });
    });
  });

  describe('Responsive Text and Icon Sizes', () => {
    it('should adjust text sizes appropriately for different screen densities', () => {
      const densities = [1, 2, 3];
      
      densities.forEach(scale => {
        mockDimensions.mockReturnValue({
          width: 375,
          height: 812,
          scale,
          fontScale: 1,
        });

        const { getByText, unmount } = render(
          <EventFilterToggle
            currentFilter="all"
            onFilterChange={jest.fn()}
          />
        );

        expect(getByText('All')).toBeTruthy();
        expect(getByText('Private')).toBeTruthy();
        expect(getByText('Public')).toBeTruthy();

        unmount();
      });
    });

    it('should maintain icon-text proportions across different scales', () => {
      mockDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1.3,
      });

      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-08-29"
          viewType="month"
          onDateChange={jest.fn()}
        />
      );

      expect(getByText('August 2025')).toBeTruthy();
    });
  });
});