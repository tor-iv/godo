import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../../design/tokens';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  showPasswordToggle?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  required = false,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  showPasswordToggle = false,
  secureTextEntry,
  multiline = false,
  numberOfLines = 1,
  value,
  onChangeText,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getBorderColor = () => {
    if (error) return colors.error[500];
    if (isFocused) return colors.primary[500];
    return colors.neutral[200];
  };

  const getInputHeight = () => {
    if (multiline) {
      return numberOfLines * 20 + spacing[6] * 2;
    }
    return 56;
  };

  const renderRightIcon = () => {
    if (showPasswordToggle) {
      return (
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.iconContainer}
        >
          <Feather
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={20}
            color={colors.neutral[400]}
          />
        </TouchableOpacity>
      );
    }

    if (rightIcon) {
      return (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.iconContainer}
        >
          <Feather name={rightIcon} size={20} color={colors.neutral[400]} />
        </TouchableOpacity>
      );
    }

    return null;
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

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor(), height: getInputHeight() },
          isFocused && styles.focused,
          error && styles.error,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Feather name={leftIcon} size={20} color={colors.neutral[400]} />
          </View>
        )}

        {/* Text Input */}
        <RNTextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={
            showPasswordToggle ? !isPasswordVisible : secureTextEntry
          }
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          style={[styles.input, multiline && styles.multilineInput, style]}
          placeholderTextColor={colors.neutral[400]}
          selectionColor={colors.primary[500]}
        />

        {/* Right Icon */}
        {renderRightIcon()}
      </View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Feather
                name="alert-circle"
                size={14}
                color={colors.error[500]}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            helperText && <Text style={styles.helperText}>{helperText}</Text>
          )}
        </View>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },
  focused: {
    backgroundColor: colors.primary[50],
  },
  error: {
    backgroundColor: colors.error[50],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    marginRight: spacing[2],
    marginTop: spacing[1],
  },
  input: {
    flex: 1,
    ...typography.body1,
    color: colors.neutral[800],
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  multilineInput: {
    paddingTop: spacing[1],
    paddingBottom: spacing[1],
    textAlignVertical: 'top',
  },
  helperContainer: {
    marginTop: spacing[2],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: spacing[1],
  },
  errorText: {
    ...typography.caption,
    color: colors.error[500],
    flex: 1,
  },
  helperText: {
    ...typography.caption,
    color: colors.neutral[500],
  },
});
