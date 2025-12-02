import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

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
  if (isTablet()) {
    // Slightly larger fonts on tablets but not proportional
    return size * 1.2;
  } else if (isSmallDevice()) {
    return size * 0.95;
  }
  return size;
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
  
  // Padding and margins
  padding: {
    xs: scaleWidth(4),
    sm: scaleWidth(8),
    md: scaleWidth(16),
    lg: scaleWidth(24),
    xl: scaleWidth(32),
  },
  
  // Font sizes
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
};

// Helper to create responsive stylesheets
export const createResponsiveStyles = (styleFunc) => {
  return styleFunc(responsive);
};
