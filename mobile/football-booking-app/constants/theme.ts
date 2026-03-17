/**
 * Theme & Design System - LucHTSportBooking
 * Matches 100% with backend design (dark theme)
 */

import { Platform } from 'react-native';

// ========== COLORS ==========
export const colors = {
  // Primary & Secondary
  primary: '#1B6F3A',          // Forest green
  secondary: '#E8613C',        // Orange/coral (CTA, prices)

  // Background
  darkBg: '#F2F8F4',           // Light mint page background
  cardBg: '#FFFFFF',           // White cards
  lightBg: '#E8F5E9',          // Light green section background

  // Text
  textPrimary: '#1A2B1E',      // Near-black (dark text on light bg)
  textSecondary: '#607B64',    // Medium green-gray

  // Border & UI
  border: '#C3E4CB',           // Soft green border

  // Status
  success: '#16A34A',
  error: '#DC2626',
  errorLight: 'rgba(220, 38, 38, 0.10)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.10)',

  // Transparent/Overlay
  overlay: 'rgba(21, 87, 36, 0.97)',   // Dark green overlay
  cardOverlay: 'rgba(27, 111, 58, 0.05)',

  // Extended design tokens
  headerBg: '#155724',         // Very dark green for headers/navbars
  accentOrange: '#E8613C',     // Orange accent for prices & primary CTAs
  accentOrangeLight: '#FFF1EE',// Light orange background
  greenTag: '#E8F5E9',         // Tag background
  greenTagText: '#1B6F3A',     // Tag text color
  inputBg: '#F9FCF9',          // Input background
} as const;

// ========== FONTS ==========
export const fonts = {
  family: {
    regular: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 42,
    '7xl': 48,
    '8xl': 56,
  },
  weights: {
    normal: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

// ========== SPACING ==========
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 60,
  '6xl': 80,
} as const;

// ========== BORDER RADIUS ==========
export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

// ========== SHADOWS ==========
export const shadows = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  xl: {
    elevation: 12,
    shadowColor: 'rgba(0, 188, 212, 0.2)',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
} as const;

// ========== LEGACY COLORS (for compatibility) ==========
export const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.cardBg,
    tint: colors.primary,
    icon: colors.textSecondary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.primary,
  },
  dark: {
    text: colors.textPrimary,
    background: colors.darkBg,
    tint: colors.primary,
    icon: colors.textSecondary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
