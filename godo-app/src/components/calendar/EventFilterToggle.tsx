import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../design';
import { Caption, Body } from '../../components/base';
import { deviceInfo } from '../../design/responsiveTokens';
import {
  getResponsiveText,
  getContainerWidth,
  textVariants,
} from '../../utils/responsiveText';

export type EventFilterType = 'all' | 'private' | 'public';

interface EventFilterToggleProps {
  currentFilter: EventFilterType;
  onFilterChange: (filter: EventFilterType) => void;
  variant?: 'full' | 'dropdown'; // Support both variants
}

export const EventFilterToggle: React.FC<EventFilterToggleProps> = props => {
  const { currentFilter, onFilterChange, variant = 'dropdown' } = props;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<View>(null);

  const filters: EventFilterType[] = ['all', 'private', 'public'];
  const filterIcons = {
    all: 'calendar',
    private: 'eye-off',
    public: 'users',
  };

  const filterLabels = {
    all: 'All Events',
    private: 'Private',
    public: 'Public',
  };

  const filterLabelsCompact = {
    all: 'All',
    private: 'Private',
    public: 'Public',
  };

  const handleFilterChange = (filter: EventFilterType) => {
    console.log(
      'EventFilterToggle: Filter change requested:',
      filter,
      'current:',
      currentFilter
    );
    if (filter !== currentFilter) {
      onFilterChange(filter);
      console.log('EventFilterToggle: Filter changed to:', filter);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    console.log('EventFilterToggle: Toggle dropdown, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  // Render dropdown variant (new clean design)
  if (variant === 'dropdown') {
    return (
      <>
        {/* Backdrop when dropdown is open */}
        {isOpen && (
          <Pressable
            style={styles.fullScreenBackdrop}
            onPress={() => setIsOpen(false)}
          />
        )}

        <View style={styles.dropdownContainer} ref={containerRef}>
          <TouchableOpacity
          style={[
            styles.dropdownButtonIconOnly,
            deviceInfo.size === 'small' && styles.dropdownButtonIconOnlySmall,
          ]}
          onPress={toggleDropdown}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Current filter: ${filterLabels[currentFilter]}. Tap to open filter options.`}
          accessibilityHint="Shows filter options menu"
          accessibilityState={{ expanded: isOpen }}
        >
          <Feather
            name={filterIcons[currentFilter] as any}
            size={deviceInfo.size === 'small' ? 16 : 18}
            color={colors.neutral[600]}
          />
          <Feather
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={deviceInfo.size === 'small' ? 14 : 16}
            color={colors.neutral[500]}
            style={styles.chevronIcon}
          />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {isOpen && (
          <View
            style={[
              styles.dropdownMenu,
              deviceInfo.size === 'small' && styles.dropdownMenuSmall,
            ]}
          >
            {filters.map(filter => {
                const optionText = getResponsiveText(
                  filterLabels[filter],
                  deviceInfo.size === 'small' ? 120 : 140,
                  14,
                  'medium'
                );

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.dropdownOption,
                      currentFilter === filter &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      console.log(
                        'EventFilterToggle: Option clicked:',
                        filter
                      );
                      handleFilterChange(filter);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="menuitem"
                    accessibilityLabel={`Filter by ${filterLabels[filter]}`}
                    accessibilityState={{ selected: currentFilter === filter }}
                  >
                    <Feather
                      name={filterIcons[filter] as any}
                      size={deviceInfo.size === 'small' ? 14 : 16}
                      color={
                        currentFilter === filter
                          ? colors.primary[500]
                          : colors.neutral[600]
                      }
                    />
                    <Body
                      style={[
                        styles.dropdownOptionText,
                        currentFilter === filter &&
                          styles.dropdownOptionTextSelected,
                        deviceInfo.size === 'small' &&
                          styles.dropdownOptionTextSmall,
                      ]}
                      numberOfLines={1}
                    >
                      {optionText}
                    </Body>
                    {currentFilter === filter && (
                      <Feather
                        name="check"
                        size={deviceInfo.size === 'small' ? 14 : 16}
                        color={colors.primary[500]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
        </View>
      </>
    );
  }

  // Legacy full variant (kept for backwards compatibility)
  return (
    <View style={styles.container}>
      {filters.map(filter => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.option,
            currentFilter === filter && styles.optionSelected,
          ]}
          onPress={() => handleFilterChange(filter)}
          activeOpacity={0.7}
        >
          <Feather
            name={filterIcons[filter] as any}
            size={14}
            color={
              currentFilter === filter ? colors.neutral[0] : colors.neutral[500]
            }
          />
          <Caption
            style={[
              styles.optionText,
              {
                color:
                  currentFilter === filter
                    ? colors.neutral[0]
                    : colors.neutral[500],
              },
            ]}
            numberOfLines={1}
          >
            {filterLabelsCompact[filter]}
          </Caption>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: 120,
    maxWidth: 140,
  },
  dropdownButtonSmall: {
    minWidth: 100,
    maxWidth: 120,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  dropdownButtonText: {
    flex: 1,
    marginHorizontal: spacing[2],
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
    textAlign: 'left',
  },
  dropdownButtonTextSmall: {
    fontSize: 12,
    marginHorizontal: spacing[1],
  },
  // Icon-only button styles (new compact design)
  dropdownButtonIconOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: 60,
    maxWidth: 70,
    justifyContent: 'space-between',
  },
  dropdownButtonIconOnlySmall: {
    minWidth: 50,
    maxWidth: 60,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },
  chevronIcon: {
    marginLeft: spacing[1],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    minWidth: 160,
    backgroundColor: colors.neutral[0],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    zIndex: 1001,
    marginTop: 4,
  },
  dropdownMenuSmall: {
    minWidth: 140,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary[50],
  },
  dropdownOptionText: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: 14,
    fontWeight: '400',
    color: colors.neutral[700],
  },
  dropdownOptionTextSmall: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
  dropdownOptionTextSelected: {
    fontWeight: '500',
    color: colors.primary[700],
  },

  // Legacy full variant styles (kept for backwards compatibility)
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 2,
    position: 'relative',
    width: 180,
    maxWidth: '100%',
    minWidth: 150,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    borderRadius: 6,
    minWidth: 0,
  },
  optionSelected: {
    backgroundColor: colors.primary[500],
  },
  optionText: {
    marginLeft: spacing[1],
    fontWeight: '600',
    fontSize: 11,
    flexShrink: 1,
  },
});
