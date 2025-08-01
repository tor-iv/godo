export const COLORS = {
  PRIMARY: '#FFFFFF',
  SECONDARY: '#BFDBFE',
  ACCENT: '#93C5FD',
  LIGHT_GRAY: '#F7FAFC',
  WHITE: '#FFFFFF',
  OFF_WHITE: '#FAFAFF',
  BACKGROUND: '#FFFFFF',
  CARD_BACKGROUND: '#FFFFFF',
  TEXT_DARK: '#1A202C',
  TEXT_MEDIUM: '#93C5FD',
  TEXT_LIGHT: '#BFDBFE',
  TEXT_MUTED: '#718096',
  SUCCESS: '#48BB78',
  ERROR: '#F56565',
  WARNING: '#ED8936',
  BORDER_LIGHT: '#E2E8F0',
  SHADOW_LIGHT: 'rgba(147, 197, 253, 0.04)',
  SHADOW_MEDIUM: 'rgba(147, 197, 253, 0.08)',
  SHADOW_DARK: 'rgba(147, 197, 253, 0.15)',
  OVERLAY: 'rgba(147, 197, 253, 0.4)',
} as const;

export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System',
  BOLD: 'System',
  LIGHT: 'System',
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
} as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

export const LAYOUT = {
  CARD_HEIGHT: 600,
  CARD_WIDTH: 350,
  BORDER_RADIUS: 16,
  BORDER_RADIUS_SMALL: 8,
  BORDER_RADIUS_LARGE: 24,
  SHADOW_RADIUS: 8,
  HEADER_HEIGHT: 88,
  TAB_HEIGHT: 48,
} as const;

export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  CARD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const ANIMATION = {
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,
  SPRING_CONFIG: {
    damping: 15,
    stiffness: 150,
  },
} as const;

export const CONFIG = {
  MAX_SWIPES_PER_DAY: 100,
  CARD_STACK_SIZE: 3,
  IMAGE_CACHE_SIZE: 50,
  API_TIMEOUT: 10000,
} as const;