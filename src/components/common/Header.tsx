import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface HeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
    disabled?: boolean;
  };
  onBack?: () => void;
  badge?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  icon,
  subtitle,
  rightAction,
  onBack,
  badge,
}) => {
  return (
    <LinearGradient
      colors={['#8B5CF6', '#EC4899', '#F472B6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.6, 1]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerInfo}>
          <View style={styles.titleContainer}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={22} color={colors.textOnPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.iconContainer}>
              <Ionicons name={icon} size={22} color={colors.textOnPrimary} />
              {badge && badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          
          {subtitle && (
            <View style={styles.subtitleContainer}>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
          )}
        </View>
        
        {rightAction && (
          <TouchableOpacity 
            style={[styles.actionButton, rightAction.disabled && styles.disabledButton]} 
            onPress={rightAction.onPress}
            disabled={rightAction.disabled}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={rightAction.icon} 
                size={22} 
                color={rightAction.disabled ? colors.textLight : colors.textOnPrimary} 
              />
              {rightAction.badge && rightAction.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{rightAction.badge > 99 ? '99+' : rightAction.badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 35,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 1,
  },
  backButton: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  subtitleContainer: {
    marginLeft: 30, // Aligné avec le texte du titre
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
