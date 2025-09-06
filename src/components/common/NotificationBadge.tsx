import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  style?: any;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'medium',
  animated = true,
  style,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated && count > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (count === 0) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [count, animated]);

  if (count === 0) {
    return null;
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 16, height: 16, borderRadius: 8 },
          text: { fontSize: 10 },
        };
      case 'large':
        return {
          container: { width: 24, height: 24, borderRadius: 12 },
          text: { fontSize: 14 },
        };
      default: // medium
        return {
          container: { width: 20, height: 20, borderRadius: 10 },
          text: { fontSize: 12 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Text style={[styles.text, sizeStyles.text]}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1000,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
