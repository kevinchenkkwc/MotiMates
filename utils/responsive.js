import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 15 Pro Max)
const BASE_WIDTH = 430;
const BASE_HEIGHT = 932;

// Get font scale for accessibility
const fontScale = PixelRatio.getFontScale();

// Device type detection
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  // iPad detection: larger screen or aspect ratio
  return (
    (pixelDensity < 2 && (SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 1024)) ||
    (SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 1024)
  );
};

export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375;
};

export const isMediumDevice = () => {
  return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
};

export const isLargeDevice = () => {
  return SCREEN_WIDTH >= 414;
};

// Check if user has increased text size in accessibility settings
export const hasLargeTextEnabled = () => {
  return fontScale > 1.0;
};

// Scale functions
export const scaleWidth = (size) => {
  if (isTablet()) {
    // For tablets, cap the scaling to avoid overly large elements
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    return Math.min(size * scale, size * 1.5);
  }
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const scaleHeight = (size) => {
  if (isTablet()) {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    return Math.min(size * scale, size * 1.5);
  }
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const scaleFontSize = (size) => {
  // Calculate scale factor based on screen width relative to base
  const widthScale = SCREEN_WIDTH / BASE_WIDTH;
  
  if (isTablet()) {
    // Slightly larger fonts on tablets but not proportional
    return size * 1.2;
  } else if (isSmallDevice()) {
    // Scale down for small devices (iPhone SE, etc.)
    return Math.max(size * 0.85, size * widthScale);
  } else if (isMediumDevice()) {
    // Slight scale for medium devices
    return size * Math.max(0.92, widthScale);
  }
  // For large devices (iPhone 15 Pro Max is base), keep size as-is
  return size;
};

// Scale font size while respecting accessibility settings
export const scaleAccessibleFontSize = (size) => {
  const baseSize = scaleFontSize(size);
  // Cap the font scale to prevent text from becoming too large
  const cappedFontScale = Math.min(fontScale, 1.35);
  return baseSize * cappedFontScale;
};

export const scaleModerate = (size, factor = 0.5) => {
  const newSize = size + (scaleWidth(size) - size) * factor;
  if (isTablet()) {
    return Math.min(newSize, size * 1.3);
  }
  return newSize;
};

// Responsive values based on screen size
export const responsive = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isTablet: isTablet(),
  isSmallDevice: isSmallDevice(),
  isMediumDevice: isMediumDevice(),
  isLargeDevice: isLargeDevice(),
  fontScale: fontScale,
  
  // Padding and margins - scale based on screen width
  padding: {
    xs: scaleWidth(4),
    sm: scaleWidth(8),
    md: scaleWidth(16),
    lg: scaleWidth(24),
    xl: scaleWidth(32),
  },
  
  // Font sizes - these are base sizes for iPhone 15 Pro Max
  fontSize: {
    xs: scaleFontSize(11),
    sm: scaleFontSize(13),
    md: scaleFontSize(14),
    lg: scaleFontSize(16),
    xl: scaleFontSize(20),
    xxl: scaleFontSize(24),
    xxxl: scaleFontSize(32),
    huge: scaleFontSize(48),
  },
  
  // Common sizes
  iconSize: {
    sm: scaleModerate(16),
    md: scaleModerate(24),
    lg: scaleModerate(32),
    xl: scaleModerate(40),
  },
  
  buttonHeight: {
    sm: scaleHeight(36),
    md: scaleHeight(48),
    lg: scaleHeight(56),
  },
  
  // Layout helpers
  maxWidth: isTablet() ? 700 : SCREEN_WIDTH,
  contentPadding: isTablet() ? scaleWidth(40) : scaleWidth(20),
  
  // Safe area helpers
  headerPaddingTop: Platform.OS === 'ios' ? scaleHeight(60) : scaleHeight(40),
  
  // Keyboard behavior
  keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 20,
};

// Helper to create responsive stylesheets
export const createResponsiveStyles = (styleFunc) => {
  return styleFunc(responsive);
};
