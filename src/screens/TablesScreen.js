// Masa Haritası Ekranı - Garson Terminali & Yönetici Masa CRUD
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
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

const TablesScreen = ({ navigation }) => {
  const { tables, sections, selectedSectionId, setSelectedSection, addTable, removeTable } = useTableStore();
  const { currentUser, isAdmin, logout } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const sectionTables = tables.filter(t => t.sectionId === selectedSectionId);
  const admin = isAdmin();

  const handleTablePress = (table) => {
    if (navigation?.navigate) {
      navigation.navigate('TableOrder', { tableId: table.id, tableName: table.name });
    }
  };

  const handleAddTable = () => {
    if (newTableName.trim()) {
      addTable(selectedSectionId, newTableName.trim());
      setNewTableName('');
      setShowAddModal(false);
    }
  };

  const handleRemoveTable = (tableId, tableName) => {
    Alert.alert(
      'Masa Sil',
      `"${tableName}" masasını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removeTable(tableId) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Masa Haritası</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.name} • {admin ? 'Yönetici' : 'Garson'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={styles.legend}>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <View key={status} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>🚪 Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bölüm Sekmeleri */}
      <View style={styles.sectionTabs}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={[styles.sectionTab, selectedSectionId === section.id && styles.sectionTabActive]}
            onPress={() => setSelectedSection(section.id)}
          >
            <Text style={[styles.sectionTabText, selectedSectionId === section.id && styles.sectionTabTextActive]}>
              {section.name}
            </Text>
          </TouchableOpacity>
        ))}
        {admin && (
          <TouchableOpacity style={styles.addTableBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addTableBtnText}>+ Masa Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Masa Grid */}
      <ScrollView contentContainerStyle={styles.tablesGrid}>
        {sectionTables.map(table => (
          <TouchableOpacity
            key={table.id}
            style={[styles.tableCard, { borderColor: STATUS_COLORS[table.status] }]}
            onPress={() => handleTablePress(table)}
            onLongPress={() => admin && handleRemoveTable(table.id, table.name)}
            activeOpacity={0.8}
          >
            <View style={[styles.tableStatusBadge, { backgroundColor: STATUS_COLORS[table.status] }]}>
              <Text style={styles.tableStatusText}>{STATUS_LABELS[table.status]}</Text>
            </View>
            <Text style={styles.tableName}>{table.name}</Text>
            {table.totalAmount > 0 && (
              <Text style={styles.tableAmount}>{table.totalAmount} ₺</Text>
            )}
            {table.orders.length > 0 && (
              <Text style={styles.tableOrders}>{table.orders.length} sipariş</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Masa Ekleme Modalı (Sadece Admin) */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Masa Ekle</Text>
            <Text style={styles.modalSubtitle}>
              Bölüm: {sections.find(s => s.id === selectedSectionId)?.name}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newTableName}
              onChangeText={setNewTableName}
              placeholder="Masa adı (ör: Masa 7)"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddTable}>
                <Text style={styles.modalConfirmText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 4 },
  logoutBtn: { backgroundColor: COLORS.danger + '15', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.danger + '30' },
  logoutBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: FONT_SIZES.sm },
  legend: { flexDirection: 'row', gap: 16, marginRight: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  sectionTabs: {
    flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 10,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sectionTab: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sectionTabText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  sectionTabTextActive: { color: '#fff' },
  addTableBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.success + '20', borderWidth: 1, borderColor: COLORS.success,
    marginLeft: 'auto',
  },
  addTableBtnText: { fontSize: FONT_SIZES.md, color: COLORS.success, fontWeight: '700' },
  tablesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 24, gap: 16,
  },
  tableCard: {
    width: 160, height: 140, backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg, padding: 16, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.card,
  },
  tableStatusBadge: {
    position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  tableStatusText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  tableName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  tableAmount: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.warning, marginTop: 6 },
  tableOrders: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    padding: 30, width: 360, borderWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 20 },
  modalInput: {
    backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 12, color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md, borderWidth: 1, borderColor: COLORS.border,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.md },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});

export default TablesScreen;
