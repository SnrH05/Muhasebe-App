// Raporlama Ekranı - X/Z Raporu, Audit Loglar
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { useAuditStore } from '../store/useAuditStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';

const ReportsScreen = () => {
  const { getXReport, getZReport, resetDaily, logs, transactions } = useAuditStore();
  const { getCriticalItems, alerts } = useInventoryStore();
  const { isAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState('xreport');

  const xReport = getXReport();
  const criticalItems = getCriticalItems();

  const handleZReport = () => {
    Alert.alert(
      'Z Raporu Al',
      'Gün sonu raporu alınacak ve günlük veriler sıfırlanacak. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla', style: 'destructive',
          onPress: () => { getZReport(); resetDaily(); Alert.alert('Z Raporu', 'Gün sonu raporu başarıyla alındı.'); },
        },
      ]
    );
  };

  const tabs = [
    { key: 'xreport', label: '📊 X Raporu' },
    { key: 'logs', label: '📋 İşlem Logları' },
    { key: 'stock', label: '📦 Stok Uyarıları' },
  ];

  return (
    <View style={styles.container}>
      {/* Sekme Menüsü */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* X RAPORU */}
        {activeTab === 'xreport' && (
          <View>
            <Text style={styles.sectionTitle}>Gün İçi Raporu (X)</Text>
            <Text style={styles.dateText}>{xReport.date}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{xReport.totalSales} ₺</Text>
                <Text style={styles.statLabel}>Toplam Satış</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{xReport.transactionCount}</Text>
                <Text style={styles.statLabel}>İşlem Sayısı</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.success }]}>{xReport.cashTotal} ₺</Text>
                <Text style={styles.statLabel}>Nakit</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{xReport.cardTotal} ₺</Text>
                <Text style={styles.statLabel}>Kart</Text>
              </View>
            </View>
            {isAdmin() && (
              <TouchableOpacity style={styles.zReportBtn} onPress={handleZReport}>
                <Text style={styles.zReportBtnText}>🔒 Z Raporu Al (Gün Sonu)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* İŞLEM LOGLARI */}
        {activeTab === 'logs' && (
          <View>
            <Text style={styles.sectionTitle}>İşlem Geçmişi</Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>Henüz işlem kaydı yok</Text>
            ) : (
              logs.slice(0, 50).map(log => (
                <View key={log.id} style={styles.logItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logAction}>{log.action}</Text>
                    <Text style={styles.logDetails}>{log.details}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.logUser}>{log.userName}</Text>
                    <Text style={styles.logTime}>{log.time}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* STOK UYARILARI */}
        {activeTab === 'stock' && (
          <View>
            <Text style={styles.sectionTitle}>Kritik Stok Uyarıları</Text>
            {criticalItems.length === 0 && alerts.length === 0 ? (
              <Text style={styles.emptyText}>Tüm stoklar yeterli seviyede ✅</Text>
            ) : (
              criticalItems.map(item => (
                <View key={item.id} style={styles.alertItem}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertName}>{item.name}</Text>
                    <Text style={styles.alertDetail}>
                      Mevcut: {item.currentQty} {item.unit} | Kritik: {item.criticalLevel} {item.unit}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: 24, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceLight },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 24 },
  sectionTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  dateText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 6 },
  zReportBtn: { backgroundColor: COLORS.danger, padding: 18, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: 16 },
  zReportBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#fff' },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, textAlign: 'center', marginTop: 40 },
  logItem: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: BORDER_RADIUS.md, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  logAction: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary },
  logDetails: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginTop: 4 },
  logUser: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  logTime: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  alertItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.danger + '15', padding: 16, borderRadius: BORDER_RADIUS.md, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.danger + '40' },
  alertIcon: { fontSize: 24 },
  alertName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.danger },
  alertDetail: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
});

export default ReportsScreen;
