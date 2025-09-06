import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      minHeight: 48,
      ...(fullWidth && { width: '100%' }),
    };

    const sizeStyles = {
      small: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        ...shadowStyles,
      },
      secondary: {
        backgroundColor: colors.secondary,
        ...shadowStyles,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.error,
        ...shadowStyles,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && {
        opacity: 0.5,
        backgroundColor: colors.disabled,
      }),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantTextStyles = {
      primary: { color: colors.textOnPrimary },
      secondary: { color: colors.textOnPrimary },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
      danger: { color: colors.textOnPrimary },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...(disabled && { color: colors.textLight }),
      ...textStyle,
    };
  };

  const getIconColor = () => {
    if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
      return colors.textOnPrimary;
    }
    return colors.primary;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 20;
      default: return 18;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={getIconColor()}
            style={{ marginRight: 8 }}
          />
          <Text style={getTextStyle()}>{title}</Text>
        </>
      );
    }

    return (
      <>
        {icon && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getIconColor()}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={getTextStyle()}>{title}</Text>
      </>
    );
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
