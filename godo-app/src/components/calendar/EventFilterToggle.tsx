import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../design';
import { Caption, Body } from '../../components/base';

export type EventFilterType = 'all' | 'private' | 'public';

interface EventFilterToggleProps {
  currentFilter: EventFilterType;
  onFilterChange: (filter: EventFilterType) => void;
  variant?: 'full' | 'dropdown'; // Support both variants
}

export const EventFilterToggle: React.FC<EventFilterToggleProps> = props => {
  const { currentFilter, onFilterChange, variant = 'dropdown' } = props;
  const [isOpen, setIsOpen] = useState(false);
  
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

  const handleFilterChange = (filter: EventFilterType) => {
    if (filter !== currentFilter) {
      onFilterChange(filter);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Render dropdown variant (new clean design)
  if (variant === 'dropdown') {
    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <Feather
            name={filterIcons[currentFilter] as any}
            size={16}
            color={colors.neutral[600]}
          />
          <Body style={styles.dropdownButtonText}>
            {filterLabels[currentFilter]}
          </Body>
          <Feather
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.neutral[500]}
          />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {isOpen && (
          <View style={styles.dropdownMenu}>
            {filters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.dropdownOption,
                  currentFilter === filter && styles.dropdownOptionSelected,
                ]}
                onPress={() => handleFilterChange(filter)}
                activeOpacity={0.7}
              >
                <Feather
                  name={filterIcons[filter] as any}
                  size={16}
                  color={
                    currentFilter === filter 
                      ? colors.primary[500] 
                      : colors.neutral[600]
                  }
                />
                <Body
                  style={[
                    styles.dropdownOptionText,
                    currentFilter === filter && styles.dropdownOptionTextSelected,
                  ]}
                >
                  {filterLabels[filter]}
                </Body>
                {currentFilter === filter && (
                  <Feather
                    name="check"
                    size={16}
                    color={colors.primary[500]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Overlay to close dropdown when clicking outside */}
        <Modal
          visible={isOpen}
          transparent={true}
          animationType="none"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setIsOpen(false)}
            activeOpacity={1}
          />
        </Modal>
      </View>
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
          >
            {filterLabels[filter]}
          </Caption>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Dropdown styles (new clean design)
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: 120,
  },
  dropdownButtonText: {
    flex: 1,
    marginHorizontal: spacing[2],
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
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
    shadowColor: colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
    marginTop: 4,
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
  dropdownOptionTextSelected: {
    fontWeight: '500',
    color: colors.primary[700],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Legacy full variant styles (kept for backwards compatibility)
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 2,
    position: 'relative',
    width: 210,
    maxWidth: '100%',
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: colors.primary[500],
  },
  optionText: {
    marginLeft: spacing[1],
    fontWeight: '600',
    fontSize: 10,
  },
});
