import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
} from '../../design/tokens';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectFieldProps {
  label: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  maxSelections?: number;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  selectedValues,
  onSelectionChange,
  options,
  placeholder = 'Select options',
  error,
  required = false,
  disabled = false,
  maxSelections,
}) => {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedOptions = options.filter(option =>
    selectedValues.includes(option.value)
  );

  const openModal = () => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleSelect = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      // Remove the value
      onSelectionChange(selectedValues.filter(value => value !== optionValue));
    } else {
      // Add the value if under max limit
      if (!maxSelections || selectedValues.length < maxSelections) {
        onSelectionChange([...selectedValues, optionValue]);
      }
    }
  };

  const getBorderColor = () => {
    if (error) return colors.error[500];
    if (disabled) return colors.neutral[200];
    return colors.neutral[200];
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0].label;
    }
    if (selectedOptions.length <= 2) {
      return selectedOptions.map(opt => opt.label).join(', ');
    }
    return `${selectedOptions.length} selected`;
  };

  const renderSelectedChips = () => {
    if (selectedOptions.length === 0) return null;

    return (
      <View style={styles.chipsContainer}>
        {selectedOptions.map(option => (
          <View key={option.value} style={styles.chip}>
            <Text style={styles.chipText}>{option.label}</Text>
            <TouchableOpacity
              onPress={() => handleSelect(option.value)}
              style={styles.chipRemove}
            >
              <Feather name="x" size={12} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderOption = ({ item }: { item: Option }) => {
    const isSelected = selectedValues.includes(item.value);
    const canSelect =
      !maxSelections || selectedValues.length < maxSelections || isSelected;

    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.selectedOption,
          !canSelect && styles.disabledOption,
        ]}
        onPress={() => handleSelect(item.value)}
        disabled={!canSelect}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && styles.selectedOptionText,
            !canSelect && styles.disabledOptionText,
          ]}
        >
          {item.label}
        </Text>
        {isSelected ? (
          <Feather name="check-square" size={20} color={colors.primary[500]} />
        ) : (
          <View style={styles.checkbox}>
            {!canSelect && (
              <Feather name="minus" size={16} color={colors.neutral[300]} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
          {maxSelections && (
            <Text style={styles.maxText}> (max {maxSelections})</Text>
          )}
        </Text>
      </View>

      {/* Select Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          { borderColor: getBorderColor() },
          error && styles.errorBorder,
          disabled && styles.disabled,
        ]}
        onPress={openModal}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            selectedOptions.length === 0 && styles.placeholder,
            disabled && styles.disabledText,
          ]}
        >
          {getDisplayText()}
        </Text>

        <View style={styles.rightSection}>
          {selectedOptions.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{selectedOptions.length}</Text>
            </View>
          )}
          <Feather
            name="chevron-down"
            size={20}
            color={disabled ? colors.neutral[300] : colors.neutral[400]}
          />
        </View>
      </TouchableOpacity>

      {/* Selected Chips */}
      {renderSelectedChips()}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Feather
            name="alert-circle"
            size={14}
            color={colors.error[500]}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: insets.bottom + spacing[6] },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{label}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedValues.length} of {maxSelections || options.length}{' '}
                  selected
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Feather name="x" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={item => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  labelContainer: {
    marginBottom: spacing[2],
  },
  label: {
    ...typography.label,
    color: colors.neutral[700],
  },
  required: {
    color: colors.error[500],
  },
  maxText: {
    color: colors.neutral[500],
    fontWeight: '400',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },
  errorBorder: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  disabled: {
    backgroundColor: colors.neutral[50],
    opacity: 0.6,
  },
  selectText: {
    ...typography.body1,
    color: colors.neutral[800],
    flex: 1,
  },
  placeholder: {
    color: colors.neutral[400],
  },
  disabledText: {
    color: colors.neutral[400],
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  countBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    ...typography.caption,
    color: colors.neutral[0],
    fontWeight: '600',
    fontSize: 11,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  chipText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '600',
    marginRight: spacing[1],
  },
  chipRemove: {
    padding: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  errorIcon: {
    marginRight: spacing[1],
  },
  errorText: {
    ...typography.caption,
    color: colors.error[500],
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...shadows.premium,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    ...typography.h2,
    color: colors.neutral[800],
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  closeButton: {
    padding: spacing[1],
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  selectedOption: {
    backgroundColor: colors.primary[50],
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionText: {
    ...typography.body1,
    color: colors.neutral[700],
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  disabledOptionText: {
    color: colors.neutral[400],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
