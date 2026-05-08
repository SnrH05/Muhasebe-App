// Muhasebe POS - Global Theme / Design System
// Tüm renk, boyut ve tipografi tanımları bu dosyadan yönetilir.
import { wp, hp, fp } from './responsive';

export const COLORS = {
  // Ana Arka Planlar
  background: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1c1c28',
  surfaceHighlight: '#252535',
  
  // Vurgular
  primary: '#6c5ce7',       // Mor - ana vurgu
  primaryLight: '#a29bfe',
  secondary: '#00cec9',     // Turkuaz - ikincil vurgu
  secondaryLight: '#81ecec',
  
  // Durum Renkleri
  success: '#00b894',       // Yeşil - Başarılı / Boş Masa
  successLight: '#55efc4',
  warning: '#fdcb6e',       // Turuncu - Uyarı / Hesap İstendi
  warningLight: '#ffeaa7',
  danger: '#e17055',        // Kırmızı - Hata / Dolu Masa
  dangerLight: '#fab1a0',
  
  // Metin
  textPrimary: '#ffffff',
  textSecondary: '#9ba1b0',
  textMuted: '#5f6577',
  
  // Kenarlıklar
  border: '#3a3a4d',
  borderLight: '#4a4a5e',
  
  // Kategori Renkleri
  categoryPink: '#ff7eb3',
  categoryBlue: '#7eb3ff',
  categoryOrange: '#ffb37e',
  categoryGreen: '#7effb3',
  categoryPurple: '#b37eff',
  categoryRed: '#ff7e7e',
};

export const SPACING = {
  xs: wp(4),
  sm: wp(8),
  md: wp(12),
  lg: wp(16),
  xl: wp(20),
  xxl: wp(28),
  xxxl: wp(36),
};

export const FONT_SIZES = {
  xs: fp(11),
  sm: fp(13),
  md: fp(15),
  lg: fp(18),
  xl: fp(22),
  xxl: fp(28),
  xxxl: fp(36),
};

export const BORDER_RADIUS = {
  sm: wp(8),
  md: wp(12),
  lg: wp(16),
  xl: wp(20),
  full: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(4) },
    shadowOpacity: 0.3,
    shadowRadius: wp(8),
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(8) },
    shadowOpacity: 0.4,
    shadowRadius: wp(16),
    elevation: 10,
  },
};

// Yazıcı Tanımları (Varsayılan)
export const DEFAULT_PRINTERS = [
  { id: 'kitchen', name: 'Mutfak Yazıcısı', ip: '192.168.1.100', port: '9100' },
  { id: 'barista', name: 'Barista Yazıcısı', ip: '192.168.1.101', port: '9100' },
  { id: 'dessert', name: 'Tezgah Yazıcısı', ip: '192.168.1.102', port: '9100' },
];

// Geriye uyumluluk için obje formatı
export const PRINTERS = {
  KITCHEN: DEFAULT_PRINTERS[0],
  BARISTA: DEFAULT_PRINTERS[1],
  DESSERT: DEFAULT_PRINTERS[2],
};

// Roller
export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  WAITER: 'waiter',
};
