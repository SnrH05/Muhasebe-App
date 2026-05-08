// Masa Haritası Ekranı - Garson Terminali & Yönetici Masa CRUD
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, PanResponder } from 'react-native';
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
  const { tables, sections, selectedSectionId, setSelectedSection, addTable, removeTable, moveTable } = useTableStore();
  const { currentUser, isAdmin, logout } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  
  // Yönetim Modalı State'leri
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Düzenleme Modu State'leri
  const [isEditMode, setIsEditMode] = useState(false);
  const [movingTableId, setMovingTableId] = useState(null);

  const sectionTables = tables.filter(t => t.sectionId === selectedSectionId);
  const admin = isAdmin();

  // Her masa için ayrı bir PanResponder oluşturmak yerine, 
  // aktif sürüklenen masayı takip eden bir yapı kuruyoruz.
  const createPanResponder = (tableId) => PanResponder.create({
    onStartShouldSetPanResponder: () => isEditMode,
    onMoveShouldSetPanResponder: () => isEditMode,
    onPanResponderGrant: () => {
      setMovingTableId(tableId);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!isEditMode) return;
      // Anlık görsel geri bildirim için store'u güncelliyoruz (Throttle edilebilir ama demo için doğrudan yapıyoruz)
      const table = tables.find(t => t.id === tableId);
      if (table) {
        const newX = Math.max(0, table.position.x + gestureState.dx / 10); // Hassasiyeti ayarladık
        const newY = Math.max(0, table.position.y + gestureState.dy / 10);
        // Not: gestureState.dx kümülatif olduğu için her harekette direkt eklemek titremeye yol açabilir.
        // Daha sağlıklı olanı başlangıç pozisyonunu grant'te kaydedip move'da onun üzerine eklemektir.
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!isEditMode) return;
      const table = tables.find(t => t.id === tableId);
      if (table) {
        moveTable(tableId, table.position.x + gestureState.dx, table.position.y + gestureState.dy);
      }
      setMovingTableId(null);
    },
  });

  // Daha basit ve performanslı bir yaklaşım: Sürükleme bittiğinde koordinatları güncelle
  const handleDragEnd = (tableId, gestureState) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      moveTable(tableId, table.position.x + gestureState.dx, table.position.y + gestureState.dy);
    }
  };

  const handleTablePress = (table) => {
    if (isEditMode) return; // Düzenleme modunda tıklama kapalı (sadece sürükleme)

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
          <Text style={styles.headerTitle}>Masa Haritası {isEditMode && <Text style={{ color: COLORS.primary }}>(Düzenleme Modu)</Text>}</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.name} • {admin ? 'Yönetici' : 'Garson'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          {isEditMode ? (
            <TouchableOpacity 
              style={[styles.logoutBtn, { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]} 
              onPress={() => { setIsEditMode(false); setMovingTableId(null); }}
            >
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
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>🚪 Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bölüm Sekmeleri */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.sectionTabs}
        contentContainerStyle={styles.sectionTabsContent}
      >
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
        {admin && !isEditMode && (
          <TouchableOpacity style={styles.addTableBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addTableBtnText}>+ Masa Ekle</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Masa Grid (Artık Mutlak Konumlu Kroki) */}
      <View style={styles.floorPlanContainer}>
        {sectionTables.map(table => {
          const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => isEditMode,
            onMoveShouldSetPanResponder: () => isEditMode,
            onPanResponderGrant: () => setMovingTableId(table.id),
            onPanResponderMove: (evt, gs) => {
              // Görsel geri bildirim için geçici olarak yerel state veya store güncellenebilir
              // Performans için sadece release'de kaydetmek daha sağlıklı
            },
            onPanResponderRelease: (evt, gs) => {
              moveTable(table.id, table.position.x + gs.dx, table.position.y + gs.dy);
              setMovingTableId(null);
            },
          });

          return (
            <TouchableOpacity
              key={table.id}
              {...(isEditMode ? panResponder.panHandlers : {})}
              style={[
                styles.tableCard, 
                { 
                  position: 'absolute',
                  left: table.position.x,
                  top: table.position.y,
                  borderColor: movingTableId === table.id ? COLORS.primary : STATUS_COLORS[table.status],
                  zIndex: movingTableId === table.id ? 999 : 1
                },
                movingTableId === table.id && { backgroundColor: COLORS.primary + '20', transform: [{ scale: 1.1 }] },
                isEditMode && { borderStyle: 'dashed' }
              ]}
              onPress={() => handleTablePress(table)}
              onLongPress={() => handleLongPress(table)}
              activeOpacity={0.8}
            >
              {isEditMode ? (
                <View style={[styles.tableStatusBadge, { backgroundColor: movingTableId === table.id ? COLORS.primary : COLORS.border }]}>
                  <Text style={styles.tableStatusText}>{movingTableId === table.id ? 'TAŞINIYOR' : 'DÜZENLE'}</Text>
                </View>
              ) : (
                <View style={[styles.tableStatusBadge, { backgroundColor: STATUS_COLORS[table.status] }]}>
                  <Text style={styles.tableStatusText}>{STATUS_LABELS[table.status]}</Text>
                </View>
              )}
              
              <Text style={styles.tableName}>{table.name}</Text>
              
              {!isEditMode && table.totalAmount > 0 && (
                <Text style={styles.tableAmount}>{table.totalAmount.toFixed(0)} ₺</Text>
              )}
              
              {isEditMode && (
                <Text style={{ fontSize: 24, marginTop: 10 }}>{movingTableId === table.id ? '📍' : '🖐️'}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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

      {/* Masa Yönetim Modalı (Long Press Sonrası) */}
      <Modal visible={showManageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 320 }]}>
            <Text style={styles.modalTitle}>Masa Yönetimi</Text>
            <Text style={[styles.modalSubtitle, { marginBottom: 24 }]}>
              "{selectedTable?.name}" masası için bir işlem seçin:
            </Text>
            
            <TouchableOpacity 
              style={[styles.manageBtn, { backgroundColor: COLORS.primary }]} 
              onPress={() => {
                setIsEditMode(true);
                setMovingTableId(selectedTable?.id);
                setShowManageModal(false);
              }}
            >
              <Text style={styles.manageBtnText}>🔄 Dizilimi Düzenle</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.manageBtn, { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger, borderWidth: 1, marginTop: 12 }]} 
              onPress={() => {
                setShowManageModal(false);
                handleRemoveTable(selectedTable?.id, selectedTable?.name);
              }}
            >
              <Text style={[styles.manageBtnText, { color: COLORS.danger }]}>🗑️ Masayı Sil</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalCancelBtn, { marginTop: 20, alignSelf: 'center' }]} 
              onPress={() => setShowManageModal(false)}
            >
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
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    flexGrow: 0,
  },
  sectionTabsContent: {
    flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 10, alignItems: 'center',
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
  floorPlanContainer: {
    flex: 1, padding: 24, position: 'relative',
  },
  tableCard: {
    width: 140, height: 120, backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg, padding: 12, borderWidth: 2,
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
  manageBtn: { padding: 16, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  manageBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default TablesScreen;
