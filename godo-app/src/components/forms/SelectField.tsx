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

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const openModal = () => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    closeModal();
  };

  const getBorderColor = () => {
    if (error) return colors.error[500];
    if (disabled) return colors.neutral[200];
    return colors.neutral[200];
  };

  const renderOption = ({ item }: { item: Option }) => {
    const isSelected = item.value === value;

    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => handleSelect(item.value)}
      >
        <Text
          style={[styles.optionText, isSelected && styles.selectedOptionText]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <Feather name="check" size={20} color={colors.primary[500]} />
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
            !selectedOption && styles.placeholder,
            disabled && styles.disabledText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <Feather
          name="chevron-down"
          size={20}
          color={disabled ? colors.neutral[300] : colors.neutral[400]}
        />
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>{label}</Text>
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
    marginBottom: spacing[1],
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
    alignItems: 'center',
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
  optionText: {
    ...typography.body1,
    color: colors.neutral[700],
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});
