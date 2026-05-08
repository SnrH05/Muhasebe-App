// POS Ana Ekranı - Masalardan ödeme alma ekranı
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { wp, hp, fp } from '../responsive';
import { useTableStore, TABLE_STATUS } from '../store/useTableStore';
import { useAuthStore } from '../store/useAuthStore';

const STATUS_COLORS = {
  [TABLE_STATUS.EMPTY]: COLORS.success,
  [TABLE_STATUS.OCCUPIED]: COLORS.danger,
  [TABLE_STATUS.BILL]: COLORS.warning,
};
const STATUS_LABELS = {
  [TABLE_STATUS.EMPTY]: 'Boş',
  [TABLE_STATUS.OCCUPIED]: 'Dolu',
  [TABLE_STATUS.BILL]: 'Hesap',
};

const PosScreen = ({ navigation }) => {
  const { tables, sections, requestBill } = useTableStore();
  const { currentUser } = useAuthStore();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState('all');

  const filteredTables = selectedSectionId === 'all' ? tables : tables.filter(t => t.sectionId === selectedSectionId);
  const sortedTables = [...filteredTables].sort((a, b) => {
    const order = { [TABLE_STATUS.BILL]: 0, [TABLE_STATUS.OCCUPIED]: 1, [TABLE_STATUS.EMPTY]: 2 };
    return order[a.status] - order[b.status];
  });
  const occupiedCount = tables.filter(t => t.status !== TABLE_STATUS.EMPTY).length;
  const billCount = tables.filter(t => t.status === TABLE_STATUS.BILL).length;

  const handleTablePress = (table) => { if (table.status === TABLE_STATUS.EMPTY) return; setSelectedTable(table); };
  const handlePayment = (table) => { setSelectedTable(null); if (navigation?.navigate) navigation.navigate('Payment', { tableId: table.id, tableName: table.name, totalAmount: table.totalAmount, orderItems: table.orders }); };
  const handleRequestBill = (table) => { requestBill(table.id); setSelectedTable(null); };

  return (
    <View style={styles.container}>
      <View style={styles.leftPanel}>
        <Text style={styles.panelLogo}>💰</Text>
        <Text style={styles.panelTitle}>POS Kasa</Text>
        <Text style={styles.userInfo}>{currentUser?.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}><Text style={styles.statValue}>{tables.length}</Text><Text style={styles.statLabel}>Toplam</Text></View>
          <View style={[styles.statBox, { borderColor: COLORS.danger }]}><Text style={[styles.statValue, { color: COLORS.danger }]}>{occupiedCount}</Text><Text style={styles.statLabel}>Dolu</Text></View>
          <View style={[styles.statBox, { borderColor: COLORS.warning }]}><Text style={[styles.statValue, { color: COLORS.warning }]}>{billCount}</Text><Text style={styles.statLabel}>Hesap</Text></View>
        </View>
        <Text style={styles.filterTitle}>Bölüm Filtresi</Text>
        <TouchableOpacity style={[styles.filterBtn, selectedSectionId === 'all' && styles.filterBtnActive]} onPress={() => setSelectedSectionId('all')}>
          <Text style={[styles.filterBtnText, selectedSectionId === 'all' && styles.filterBtnTextActive]}>Tümü</Text>
        </TouchableOpacity>
        {sections.map(section => (
          <TouchableOpacity key={section.id} style={[styles.filterBtn, selectedSectionId === section.id && styles.filterBtnActive]} onPress={() => setSelectedSectionId(section.id)}>
            <Text style={[styles.filterBtnText, selectedSectionId === section.id && styles.filterBtnTextActive]}>{section.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mainPanel}>
        <View style={styles.mainHeader}><Text style={styles.mainTitle}>Masalar</Text><Text style={styles.mainSubtitle}>Ödeme almak için masaya dokunun</Text></View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tablesGrid}>
            {sortedTables.map(table => {
              const isEmpty = table.status === TABLE_STATUS.EMPTY;
              const isBill = table.status === TABLE_STATUS.BILL;
              const sectionName = sections.find(s => s.id === table.sectionId)?.name || '';
              return (
                <TouchableOpacity key={table.id} style={[styles.tableCard, { borderColor: STATUS_COLORS[table.status] }, isEmpty && styles.tableCardEmpty, isBill && styles.tableCardBill]} onPress={() => handleTablePress(table)} activeOpacity={isEmpty ? 1 : 0.7}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[table.status] }]}><Text style={styles.statusBadgeText}>{STATUS_LABELS[table.status]}</Text></View>
                  <Text style={styles.sectionLabel}>{sectionName}</Text>
                  <Text style={[styles.tableName, isEmpty && { color: COLORS.textMuted }]}>{table.name}</Text>
                  {table.totalAmount > 0 && <Text style={styles.tableAmount}>{table.totalAmount} ₺</Text>}
                  {table.orders.length > 0 && <Text style={styles.orderCount}>{table.orders.reduce((sum, ord) => sum + ord.items.length, 0)} kalem</Text>}
                  {isBill && <View style={styles.billIndicator}><Text style={styles.billIndicatorText}>💳 ÖDEME BEKLİYOR</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <Modal visible={!!selectedTable} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTable && (<>
              <View style={styles.modalHeader}>
                <View><Text style={styles.modalTitle}>{selectedTable.name}</Text><Text style={styles.modalSubtitle}>{sections.find(s => s.id === selectedTable.sectionId)?.name} • {STATUS_LABELS[selectedTable.status]}</Text></View>
                <TouchableOpacity onPress={() => setSelectedTable(null)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView style={styles.ordersList}>
                {selectedTable.orders.length === 0 ? (<Text style={styles.emptyText}>Sipariş bulunmuyor</Text>) : (
                  selectedTable.orders.map((order, orderIdx) => (
                    <View key={order.id} style={styles.orderGroup}>
                      <View style={styles.orderGroupHeader}><Text style={styles.orderGroupTitle}>Sipariş #{orderIdx + 1}</Text><Text style={styles.orderGroupMeta}>{order.waiter} • {order.time}</Text></View>
                      {order.items.map((item, itemIdx) => (
                        <View key={`${order.id}_${itemIdx}`} style={styles.orderItem}><Text style={styles.orderItemName}>{item.name}</Text><Text style={styles.orderItemQty}>x{item.quantity}</Text><Text style={styles.orderItemPrice}>{item.price * item.quantity} ₺</Text></View>
                      ))}
                    </View>
                  ))
                )}
              </ScrollView>
              <View style={styles.modalFooter}>
                <View style={styles.totalRow}><Text style={styles.totalLabel}>TOPLAM</Text><Text style={styles.totalValue}>{selectedTable.totalAmount} ₺</Text></View>
                <View style={styles.actionRow}>
                  {selectedTable.status === TABLE_STATUS.OCCUPIED && <TouchableOpacity style={styles.billBtn} onPress={() => handleRequestBill(selectedTable)}><Text style={styles.billBtnText}>📋 Hesap İste</Text></TouchableOpacity>}
                  <TouchableOpacity style={styles.payBtn} onPress={() => handlePayment(selectedTable)}><Text style={styles.payBtnText}>💳 ÖDEME AL</Text></TouchableOpacity>
                </View>
              </View>
            </>)}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.background },
  leftPanel: { width: '20%', backgroundColor: COLORS.surface, padding: wp(20), borderRightWidth: 1, borderRightColor: COLORS.border, alignItems: 'center' },
  panelLogo: { fontSize: fp(40), marginBottom: hp(4) },
  panelTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1 },
  userInfo: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: hp(4), marginBottom: hp(24) },
  statsContainer: { width: '100%', gap: hp(8), marginBottom: hp(24) },
  statBox: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, padding: wp(12), alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: hp(2) },
  filterTitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '700', alignSelf: 'flex-start', marginBottom: hp(8), letterSpacing: 1 },
  filterBtn: { width: '100%', padding: wp(12), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceLight, marginBottom: hp(6), alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  filterBtnActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  filterBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  filterBtnTextActive: { color: COLORS.primary },
  mainPanel: { flex: 1, padding: wp(20) },
  mainHeader: { marginBottom: hp(20) },
  mainTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  mainSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: hp(4) },
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(14) },
  tableCard: { width: '18.5%', minHeight: hp(150), backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: wp(14), borderWidth: 2, justifyContent: 'center', alignItems: 'center', ...SHADOWS.card },
  tableCardEmpty: { opacity: 0.4, borderStyle: 'dashed' },
  tableCardBill: { backgroundColor: COLORS.warning + '10', borderWidth: 2 },
  statusBadge: { position: 'absolute', top: hp(8), right: wp(8), paddingHorizontal: wp(8), paddingVertical: hp(3), borderRadius: 6 },
  statusBadgeText: { fontSize: fp(10), fontWeight: '800', color: '#fff' },
  sectionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginBottom: hp(4) },
  tableName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  tableAmount: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.warning, marginTop: hp(8) },
  orderCount: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: hp(4) },
  billIndicator: { marginTop: hp(8), backgroundColor: COLORS.warning + '30', paddingHorizontal: wp(8), paddingVertical: hp(4), borderRadius: 6 },
  billIndicatorText: { fontSize: fp(10), fontWeight: '800', color: COLORS.warning },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, width: '55%', maxHeight: '85%', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(24), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  modalSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: hp(4) },
  closeBtn: { fontSize: fp(24), color: COLORS.textMuted, padding: wp(8) },
  ordersList: { padding: wp(24), maxHeight: hp(300) },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: FONT_SIZES.md },
  orderGroup: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, padding: wp(16), marginBottom: hp(12), borderWidth: 1, borderColor: COLORS.border },
  orderGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(12), borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: hp(8) },
  orderGroupTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
  orderGroupMeta: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(6) },
  orderItemName: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  orderItemQty: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, width: wp(40), textAlign: 'center' },
  orderItemPrice: { fontSize: FONT_SIZES.md, color: COLORS.success, fontWeight: '700', width: wp(80), textAlign: 'right' },
  modalFooter: { padding: wp(24), borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surfaceLight },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(16) },
  totalLabel: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 2 },
  totalValue: { fontSize: fp(36), fontWeight: '800', color: COLORS.textPrimary },
  actionRow: { flexDirection: 'row', gap: wp(12) },
  billBtn: { flex: 1, padding: wp(16), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.warning + '20', borderWidth: 1, borderColor: COLORS.warning },
  billBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.warning },
  payBtn: { flex: 2, padding: wp(16), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.primary },
  payBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#fff' },
});

export default PosScreen;
