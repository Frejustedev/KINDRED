import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  onFocus?: () => void;
  onBlur?: () => void;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  error,
  disabled = false,
  style,
  inputStyle,
  onFocus,
  onBlur,
  rightIcon,
  leftIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getContainerStyle = (): ViewStyle => {
    return {
      ...styles.container,
      ...(isFocused && styles.containerFocused),
      ...(error && styles.containerError),
      ...(disabled && styles.containerDisabled),
      ...style,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...styles.input,
      ...(leftIcon && { paddingLeft: 40 }),
      ...(rightIcon && { paddingRight: 40 }),
      ...(multiline && { textAlignVertical: 'top' }),
      ...(disabled && styles.inputDisabled),
      ...inputStyle,
    };
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  containerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  containerError: {
    borderColor: colors.error,
  },
  containerDisabled: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  inputDisabled: {
    color: colors.textLight,
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
