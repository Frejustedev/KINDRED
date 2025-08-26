export const colors = {
  // Primary colors
  primary: '#EC4899',      // Pink-500
  primaryDark: '#DB2777',  // Pink-600
  primaryLight: '#F9A8D4', // Pink-300
  
  // Secondary colors
  secondary: '#A855F7',    // Purple-500
  secondaryDark: '#9333EA', // Purple-600
  secondaryLight: '#C084FC', // Purple-400
  
  // Accent colors
  accent: '#F472B6',       // Pink-400
  
  // Base colors
  background: '#FAFAFA',   // Gray-50
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6', // Gray-100
  
  // Text colors
  text: '#1F2937',         // Gray-800
  textSecondary: '#6B7280', // Gray-500
  textLight: '#9CA3AF',     // Gray-400
  textOnPrimary: '#FFFFFF',
  
  // Semantic colors
  error: '#EF4444',        // Red-500
  errorLight: '#FCA5A5',   // Red-300
  success: '#10B981',      // Emerald-500
  successLight: '#6EE7B7', // Emerald-300
  warning: '#F59E0B',      // Amber-500
  warningLight: '#FCD34D', // Amber-300
  info: '#3B82F6',         // Blue-500
  infoLight: '#93C5FD',    // Blue-300
  
  // Gradients
  gradient: ['#EC4899', '#A855F7'] as const,
  gradientDark: ['#DB2777', '#9333EA'] as const,
  
  // Shadows
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Special
  overlay: 'rgba(0, 0, 0, 0.5)',
  divider: '#E5E7EB',      // Gray-200
  disabled: '#D1D5DB',     // Gray-300
  border: '#E5E7EB',       // Gray-200
  gray: '#6B7280',         // Gray-500
};

// Theme variations
export const lightTheme = {
  ...colors,
};

export const darkTheme = {
  ...colors,
  background: '#111827',    // Gray-900
  surface: '#1F2937',       // Gray-800
  surfaceVariant: '#374151', // Gray-700
  text: '#F9FAFB',          // Gray-50
  textSecondary: '#D1D5DB', // Gray-300
  textLight: '#9CA3AF',     // Gray-400
  divider: '#374151',       // Gray-700
};
