// Masa Haritası Ekranı - Garson Terminali & Yönetici Masa CRUD
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, PanResponder, useWindowDimensions, Dimensions } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
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

const TablesScreen = ({ navigation }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions(); // Re-render on resize
  const { tables, sections, selectedSectionId, setSelectedSection, addTable, removeTable, moveTable, tableWidth, tableHeight, setTableDimensions } = useTableStore();
  const { currentUser, isAdmin, logout } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [movingTableId, setMovingTableId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const sectionTables = tables.filter(t => t.sectionId === selectedSectionId);
  const admin = isAdmin();

  const handleTablePress = (table) => {
    if (isEditMode) return;
    if (navigation?.navigate) {
      navigation.navigate('TableOrder', { tableId: table.id, tableName: table.name });
    }
  };

  const handleLongPress = (table) => {
    if (!admin) return;
    if (!isEditMode) {
      setSelectedTable(table);
      setShowManageModal(true);
    } else {
      setMovingTableId(table.id);
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
    Alert.alert('Masa Sil', `"${tableName}" masasını silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => removeTable(tableId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Masa Haritası {isEditMode && <Text style={{ color: COLORS.primary }}>(Düzenleme Modu)</Text>}</Text>
          <Text style={styles.headerSubtitle}>{currentUser?.name} • {admin ? 'Yönetici' : 'Garson'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(20) }}>
          {isEditMode ? (
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]} onPress={() => { setIsEditMode(false); setMovingTableId(null); }}>
              <Text style={[styles.logoutBtnText, { color: COLORS.success }]}>✓ Düzenlemeyi Bitir</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.legend}>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <View key={status} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          )}
          {admin && (
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30' }]} onPress={() => setShowSettingsModal(true)}>
              <Text style={[styles.logoutBtnText, { color: COLORS.primary }]}>⚙️ Boyut</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>🚪 Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionTabs} contentContainerStyle={styles.sectionTabsContent}>
        {sections.map(section => (
          <TouchableOpacity key={section.id} style={[styles.sectionTab, selectedSectionId === section.id && styles.sectionTabActive]} onPress={() => setSelectedSection(section.id)}>
            <Text style={[styles.sectionTabText, selectedSectionId === section.id && styles.sectionTabTextActive]}>{section.name}</Text>
          </TouchableOpacity>
        ))}
        {admin && !isEditMode && (
          <TouchableOpacity style={styles.addTableBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addTableBtnText}>+ Masa Ekle</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View 
        style={styles.floorPlanContainer}
        onStartShouldSetResponder={() => isEditMode}
        onResponderMove={(evt) => {
          if (isEditMode && movingTableId) {
            const { locationX, locationY } = evt.nativeEvent;
            const { width, height } = Dimensions.get('window');
            const scaleX = width / 1024;
            const scaleY = height / 768;
            // Masayı imlecin merkezine ortala (boyutun yarısını çıkar)
            moveTable(movingTableId, (locationX / scaleX) - (tableWidth / 2), (locationY / scaleY) - (tableHeight / 2));
          }
        }}
        onResponderRelease={() => {
          if (isEditMode && movingTableId) {
            setMovingTableId(null);
          }
        }}
      >
        {sectionTables.map(table => {
          const TableWrapper = isEditMode ? TouchableOpacity : TouchableOpacity; // Always touchable but behavior changes
          
          return (
            <TableWrapper
              key={table.id}
              style={[
                styles.tableCard, 
                { 
                  position: 'absolute', 
                  left: wp(table.position.x), 
                  top: hp(table.position.y), 
                  width: wp(tableWidth),
                  height: wp(tableHeight),
                  borderColor: movingTableId === table.id ? COLORS.primary : STATUS_COLORS[table.status], 
                  zIndex: movingTableId === table.id ? 999 : 1,
                  ...(isEditMode ? { cursor: movingTableId === table.id ? 'grabbing' : 'grab' } : {})
                }, 
                movingTableId === table.id && { backgroundColor: COLORS.primary + '30', transform: [{ scale: 1.05 }], borderStyle: 'dashed' }, 
                isEditMode && movingTableId !== table.id && { borderStyle: 'dotted' }
              ]}
              onPress={() => {
                if (isEditMode) {
                  if (movingTableId === table.id) setMovingTableId(null);
                  else setMovingTableId(table.id);
                } else {
                  handleTablePress(table);
                }
              }}
              onLongPress={() => !isEditMode && handleLongPress(table)}
              activeOpacity={0.8}
            >
              {isEditMode ? (
                <View style={[styles.tableStatusBadge, { backgroundColor: movingTableId === table.id ? COLORS.primary : COLORS.border }]}>
                  <Text style={styles.tableStatusText}>{movingTableId === table.id ? 'BIRAK' : 'SEÇ'}</Text>
                </View>
              ) : (
                <View style={[styles.tableStatusBadge, { backgroundColor: STATUS_COLORS[table.status] }]}>
                  <Text style={styles.tableStatusText}>{STATUS_LABELS[table.status]}</Text>
                </View>
              )}
              <Text style={[styles.tableName, { fontSize: fp(16) }]}>{table.name}</Text>
              {!isEditMode && table.totalAmount > 0 && <Text style={styles.tableAmount}>{table.totalAmount.toFixed(0)} ₺</Text>}
              {isEditMode && <Text style={{ fontSize: fp(20), marginTop: hp(5) }}>{movingTableId === table.id ? '📍' : '🖐️'}</Text>}
            </TableWrapper>
          );
        })}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Masa Ekle</Text>
            <Text style={styles.modalSubtitle}>Bölüm: {sections.find(s => s.id === selectedSectionId)?.name}</Text>
            <TextInput style={styles.modalInput} value={newTableName} onChangeText={setNewTableName} placeholder="Masa adı (ör: Masa 7)" placeholderTextColor={COLORS.textMuted} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}><Text style={styles.modalCancelText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddTable}><Text style={styles.modalConfirmText}>Ekle</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: wp(400) }]}>
            <Text style={styles.modalTitle}>Masa Boyut Ayarları</Text>
            <Text style={styles.modalSubtitle}>Masaların ekrandaki görünümünü özelleştirin.</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Genişlik: {tableWidth}px</Text>
              <View style={styles.sliderMock}>
                <TouchableOpacity onPress={() => setTableDimensions(Math.max(100, tableWidth - 10), tableHeight)} style={styles.stepBtn}><Text style={styles.stepBtnText}>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setTableDimensions(Math.min(400, tableWidth + 10), tableHeight)} style={styles.stepBtn}><Text style={styles.stepBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Yükseklik: {tableHeight}px</Text>
              <View style={styles.sliderMock}>
                <TouchableOpacity onPress={() => setTableDimensions(tableWidth, Math.max(50, tableHeight - 10))} style={styles.stepBtn}><Text style={styles.stepBtnText}>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setTableDimensions(tableWidth, Math.min(300, tableHeight + 10))} style={styles.stepBtn}><Text style={styles.stepBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.modalConfirmBtn, { marginTop: hp(20), width: '100%' }]} onPress={() => setShowSettingsModal(false)}>
              <Text style={styles.modalConfirmText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showManageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: wp(320) }]}>
            <Text style={styles.modalTitle}>Masa Yönetimi</Text>
            <Text style={[styles.modalSubtitle, { marginBottom: hp(24) }]}>"{selectedTable?.name}" masası için bir işlem seçin:</Text>
            <TouchableOpacity style={[styles.manageBtn, { backgroundColor: COLORS.primary }]} onPress={() => { setIsEditMode(true); setMovingTableId(selectedTable?.id); setShowManageModal(false); }}>
              <Text style={styles.manageBtnText}>🔄 Dizilimi Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.manageBtn, { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger, borderWidth: 1, marginTop: hp(12) }]} onPress={() => { setShowManageModal(false); handleRemoveTable(selectedTable?.id, selectedTable?.name); }}>
              <Text style={[styles.manageBtnText, { color: COLORS.danger }]}>🗑️ Masayı Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancelBtn, { marginTop: hp(20), alignSelf: 'center' }]} onPress={() => setShowManageModal(false)}>
              <Text style={styles.modalCancelText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp(24), paddingVertical: hp(16), backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: hp(4) },
  logoutBtn: { backgroundColor: COLORS.danger + '15', paddingHorizontal: wp(16), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.danger + '30' },
  logoutBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: FONT_SIZES.sm },
  legend: { flexDirection: 'row', gap: wp(16), marginRight: wp(20) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: wp(6) },
  legendDot: { width: wp(12), height: wp(12), borderRadius: wp(6) },
  legendText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  sectionTabs: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexGrow: 0 },
  sectionTabsContent: { flexDirection: 'row', paddingHorizontal: wp(24), paddingVertical: hp(12), gap: wp(10), alignItems: 'center' },
  sectionTab: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  sectionTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sectionTabText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  sectionTabTextActive: { color: '#fff' },
  addTableBtn: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.success + '20', borderWidth: 1, borderColor: COLORS.success, marginLeft: 'auto' },
  addTableBtnText: { fontSize: FONT_SIZES.md, color: COLORS.success, fontWeight: '700' },
  floorPlanContainer: { flex: 1, padding: wp(24), position: 'relative' },
  tableCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: BORDER_RADIUS.lg, 
    padding: wp(12), 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...SHADOWS.card 
  },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(20), padding: wp(12), backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md },
  settingLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  sliderMock: { flexDirection: 'row', gap: wp(12) },
  stepBtn: { width: wp(40), height: wp(40), backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: '#fff', fontSize: fp(20), fontWeight: 'bold' },
  tableStatusBadge: { position: 'absolute', top: hp(6), right: wp(8), paddingHorizontal: wp(6), paddingVertical: hp(2), borderRadius: BORDER_RADIUS.sm },
  tableStatusText: { fontSize: fp(10), fontWeight: '700', color: '#fff' },
  tableName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  tableAmount: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.warning, marginTop: hp(6) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: wp(30), width: wp(360), borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: hp(4) },
  modalSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: hp(20) },
  modalInput: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: wp(16), paddingVertical: hp(12), color: COLORS.textPrimary, fontSize: FONT_SIZES.md, borderWidth: 1, borderColor: COLORS.border },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: wp(12), marginTop: hp(20) },
  modalCancelBtn: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.md },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  manageBtn: { padding: wp(16), borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  manageBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default TablesScreen;
