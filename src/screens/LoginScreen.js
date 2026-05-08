// Login Ekranı - PIN ile Giriş
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { wp, hp, fp } from '../responsive';
import { useAuthStore } from '../store/useAuthStore';

const LoginScreen = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const isSmall = width < 600;

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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.outerContainer} bounces={false}>
      <View style={[styles.container, isPortrait && { flexDirection: 'column' }]}>
        <View style={[styles.brandingSection, isPortrait && { width: '100%', paddingVertical: hp(40) }, isSmall && { paddingHorizontal: wp(20) }]}>
          <Text style={styles.logo}>☕</Text>
          <Text style={[styles.appName, isSmall && { fontSize: fp(28) }]}>Muhasebe POS</Text>
          <Text style={styles.appSubtitle}>Satış Destek Yönetimi</Text>
          {!isSmall && (
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ Offline Çalışma Desteği</Text>
              <Text style={styles.featureItem}>✓ 3-Yollu Yazıcı Yönlendirme</Text>
              <Text style={styles.featureItem}>✓ Akıllı Stok Takibi</Text>
              <Text style={styles.featureItem}>✓ Garson Terminali</Text>
            </View>
          )}
        </View>

        <View style={[styles.loginSection, isSmall && { padding: wp(16) }]}>
          <View style={[styles.loginCard, isSmall && { width: '95%', padding: wp(24) }]}>
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
                      <Text style={[styles.numText, num === '⌫' && { fontSize: fp(28) }]}>{num}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, flexDirection: 'row', minHeight: '100%' },
  brandingSection: { width: '40%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(40), backgroundColor: COLORS.surface },
  logo: { fontSize: fp(80), marginBottom: hp(20) },
  appName: { fontSize: fp(42), fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 2 },
  appSubtitle: { fontSize: fp(16), color: COLORS.textSecondary, marginTop: hp(8), letterSpacing: 1 },
  featureList: { marginTop: hp(50) },
  featureItem: { fontSize: fp(15), color: COLORS.textSecondary, marginBottom: hp(12) },
  loginSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(40) },
  loginCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: wp(40), width: '90%', maxWidth: wp(450), alignItems: 'center', ...SHADOWS.elevated, borderWidth: 1, borderColor: COLORS.border },
  loginTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: hp(8) },
  loginSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: hp(30) },
  dotsContainer: { flexDirection: 'row', marginBottom: hp(30), gap: wp(16) },
  dot: { width: wp(20), height: wp(20), borderRadius: wp(10), borderWidth: 2, borderColor: COLORS.borderLight, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZES.sm, marginBottom: hp(15) },
  numPad: { width: '100%', gap: hp(12) },
  numRow: { flexDirection: 'row', justifyContent: 'center', gap: wp(12) },
  numBtn: { width: wp(90), height: hp(70), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  numBtnEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  numText: { fontSize: fp(28), fontWeight: '600', color: COLORS.textPrimary },
  demoInfo: { marginTop: hp(30), alignItems: 'center', opacity: 0.5 },
  demoTitle: { fontSize: fp(12), color: COLORS.textMuted, marginBottom: hp(4) },
  demoText: { fontSize: fp(11), color: COLORS.textMuted },
});

export default LoginScreen;
