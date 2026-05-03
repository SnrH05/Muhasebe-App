// Login Ekranı - PIN ile Giriş
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);

  const handlePress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        const result = login(newPin);
        if (!result.success) {
          setError(result.error);
          setTimeout(() => setPin(''), 400);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
      );
    }
    return dots;
  };

  const numPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <View style={styles.container}>
      {/* Sol - Branding */}
      <View style={styles.brandingSection}>
        <Text style={styles.logo}>☕</Text>
        <Text style={styles.appName}>Muhasebe POS</Text>
        <Text style={styles.appSubtitle}>Satış Destek Yönetimi</Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✓ Offline Çalışma Desteği</Text>
          <Text style={styles.featureItem}>✓ 3-Yollu Yazıcı Yönlendirme</Text>
          <Text style={styles.featureItem}>✓ Akıllı Stok Takibi</Text>
          <Text style={styles.featureItem}>✓ Garson Terminali</Text>
        </View>
      </View>

      {/* Sağ - PIN Girişi */}
      <View style={styles.loginSection}>
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Personel Girişi</Text>
          <Text style={styles.loginSubtitle}>4 haneli PIN kodunuzu girin</Text>

          <View style={styles.dotsContainer}>{renderDots()}</View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.numPad}>
            {numPad.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.numRow}>
                {row.map((num, colIdx) => (
                  <TouchableOpacity
                    key={colIdx}
                    style={[styles.numBtn, num === '' && styles.numBtnEmpty]}
                    onPress={() => {
                      if (num === '⌫') handleDelete();
                      else if (num !== '') handlePress(num);
                    }}
                    activeOpacity={num === '' ? 1 : 0.7}
                    disabled={num === ''}
                  >
                    <Text style={[styles.numText, num === '⌫' && { fontSize: 24 }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Demo PIN Kodları:</Text>
            <Text style={styles.demoText}>Admin: 1234 | Kasiyer: 5678</Text>
            <Text style={styles.demoText}>Garson: 1111 | Garson: 2222</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  brandingSection: {
    width: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: COLORS.surface,
  },
  logo: { fontSize: 80, marginBottom: 20 },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  featureList: { marginTop: 50 },
  featureItem: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  loginSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: 40,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    ...SHADOWS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    marginBottom: 15,
  },
  numPad: { width: '100%', gap: 10 },
  numRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  numBtn: {
    width: 72,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  numBtnEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  numText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  demoInfo: {
    marginTop: 30,
    alignItems: 'center',
    opacity: 0.5,
  },
  demoTitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  demoText: { fontSize: 11, color: COLORS.textMuted },
});

export default LoginScreen;
