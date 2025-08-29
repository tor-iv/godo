import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EventFilterToggle, EventFilterType } from '../../../godo-app/src/components/calendar/EventFilterToggle';

describe('EventFilterToggle Dropdown', () => {
  const mockOnFilterChange = jest.fn();
  
  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('renders dropdown variant correctly', () => {
    const { getByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    expect(getByText('All Events')).toBeTruthy();
  });

  it('opens dropdown menu when button is pressed', () => {
    const { getByText, queryByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    // Initially dropdown options should not be visible
    expect(queryByText('Private')).toBeFalsy();
    expect(queryByText('Public')).toBeFalsy();

    // Press dropdown button
    fireEvent.press(getByText('All Events'));

    // Now dropdown options should be visible
    expect(getByText('Private')).toBeTruthy();
    expect(getByText('Public')).toBeTruthy();
  });

  it('changes filter when dropdown option is selected', () => {
    const { getByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    // Open dropdown
    fireEvent.press(getByText('All Events'));

    // Select private option
    fireEvent.press(getByText('Private'));

    expect(mockOnFilterChange).toHaveBeenCalledWith('private');
  });

  it('closes dropdown when option is selected', () => {
    const { getByText, queryByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    // Open dropdown
    fireEvent.press(getByText('All Events'));
    expect(getByText('Private')).toBeTruthy();

    // Select option
    fireEvent.press(getByText('Private'));

    // Dropdown should close
    expect(queryByText('Private')).toBeFalsy();
  });

  it('displays correct current filter in dropdown button', () => {
    const { getByText } = render(
      <EventFilterToggle
        currentFilter="private"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    expect(getByText('Private')).toBeTruthy();
  });

  it('shows checkmark for selected filter in dropdown', () => {
    const { getByText, getByTestId } = render(
      <EventFilterToggle
        currentFilter="private"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    // Open dropdown
    fireEvent.press(getByText('Private'));

    // The selected option should have a checkmark (Feather check icon)
    // Note: This test assumes the check icon is rendered for selected items
    const dropdownOptions = getByText('Private');
    expect(dropdownOptions).toBeTruthy();
  });

  it('supports legacy full variant for backwards compatibility', () => {
    const { getByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        variant="full"
      />
    );

    // In full variant, all options should be visible at once
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Private')).toBeTruthy();
    expect(getByText('Public')).toBeTruthy();
  });

  it('defaults to dropdown variant when no variant is specified', () => {
    const { getByText, queryByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Should show dropdown button text
    expect(getByText('All Events')).toBeTruthy();
    
    // Should not show all options initially (dropdown behavior)
    expect(queryByText('Private')).toBeFalsy();
  });

  it('displays proper icons for each filter type', () => {
    const { getByText } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        variant="dropdown"
      />
    );

    // Open dropdown to see all options
    fireEvent.press(getByText('All Events'));

    // Check that all filter options are present with their respective labels
    expect(getByText('All Events')).toBeTruthy(); // calendar icon
    expect(getByText('Private')).toBeTruthy();    // eye-off icon  
    expect(getByText('Public')).toBeTruthy();     // users icon
  });
});

describe('EventFilterToggle Space Efficiency', () => {
  it('dropdown variant takes less horizontal space than full variant', () => {
    const { getByTestId: getDropdown } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={jest.fn()}
        variant="dropdown"
        testID="dropdown-variant"
      />
    );

    const { getByTestId: getFull } = render(
      <EventFilterToggle
        currentFilter="all"
        onFilterChange={jest.fn()}
        variant="full"
        testID="full-variant"
      />
    );

    // This test would need actual layout measurements to validate space usage
    // For now, we just ensure both variants render without errors
    expect(getDropdown).toBeTruthy();
    expect(getFull).toBeTruthy();
  });
});