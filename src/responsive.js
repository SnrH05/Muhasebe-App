// Responsive Utility - Ekran boyutuna göre dinamik ölçekleme
import { Dimensions, PixelRatio } from 'react-native';

// Referans tasarım boyutu (iPad / Tablet landscape)
const BASE_WIDTH = 1024;
const BASE_HEIGHT = 768;

// Yatay ölçekleme (genişlik bazlı)
export const wp = (size) => {
  const dims = Dimensions.get('window');
  const width = dims.width || 1024;
  const scale = width / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) || size;
};

// Dikey ölçekleme (yükseklik bazlı)
export const hp = (size) => {
  const dims = Dimensions.get('window');
  const height = dims.height || 768;
  const scale = height / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) || size;
};

// Font ölçekleme
export const fp = (size, maxFactor = 1.4) => {
  const dims = Dimensions.get('window');
  const width = dims.width || 1024;
  const height = dims.height || 768;
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const clampedScale = Math.min(scale, maxFactor);
  const newSize = size * Math.max(clampedScale, 0.7);
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) || size;
};

// Dinamik ekran bilgisi
export const getScreenInfo = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    isSmallScreen: width < 600,
    isMediumScreen: width >= 600 && width < 900,
    isLargeScreen: width >= 900,
    isPortrait: height > width,
    scaleX: width / BASE_WIDTH,
    scaleY: height / BASE_HEIGHT,
  };
};
