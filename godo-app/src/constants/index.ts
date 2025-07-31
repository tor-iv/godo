export const COLORS = {
  PRIMARY_PURPLE: '#8B5CF6',
  SECONDARY_PURPLE: '#A78BFA', 
  LIGHT_PURPLE: '#C4B5FD',
  DARK_PURPLE: '#4C1D95',
  WHITE: '#FFFFFF',
  OFF_WHITE: '#FAFAFF',
  BACKGROUND: '#F8FAFC',
  CARD_BACKGROUND: '#FFFFFF',
  TEXT_DARK: '#0F172A',
  TEXT_MEDIUM: '#334155',
  TEXT_LIGHT: '#64748B',
  TEXT_MUTED: '#94A3B8',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  BORDER_LIGHT: '#E2E8F0',
  SHADOW_LIGHT: 'rgba(15, 23, 42, 0.04)',
  SHADOW_MEDIUM: 'rgba(15, 23, 42, 0.08)',
  SHADOW_DARK: 'rgba(15, 23, 42, 0.15)',
  GRADIENT_START: '#8B5CF6',
  GRADIENT_END: '#EC4899',
  OVERLAY: 'rgba(0, 0, 0, 0.4)',
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