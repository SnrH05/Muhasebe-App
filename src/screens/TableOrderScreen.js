import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { wp, hp, fp } from '../responsive';
import { usePosStore } from '../store/usePosStore';
import { useTableStore } from '../store/useTableStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAuditStore } from '../store/useAuditStore';

const TableOrderScreen = ({ route, navigation }) => {
  const tableId = route?.params?.tableId;
  const tableName = route?.params?.tableName || 'Masa';
  const { categories, menuItems, selectedCategoryId, setSelectedCategory, cart, addToCart, decreaseQuantity, removeFromCart, clearCart, getCartTotal, toggleFavoriteMenuItem } = usePosStore();
  const { tables, addOrderToTable, cancelOrderFromTable } = useTableStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditStore();
  const [activeTab, setActiveTab] = useState('cart');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelOrderIndex, setCancelOrderIndex] = useState(null);
  const [cancelPin, setCancelPin] = useState('');
  const [cancelError, setCancelError] = useState('');

  const displayCategories = [{ id: 'favs', name: 'Favoriler', icon: '⭐', color: '#f1c40f' }, ...categories];
  const filteredItems = menuItems.filter(i => {
    if (searchQuery) return i.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategoryId === 'favs') return i.isFavorite;
    return i.categoryId === selectedCategoryId;
  });
  filteredItems.sort((a, b) => { if (a.isFavorite && !b.isFavorite) return -1; if (!a.isFavorite && b.isFavorite) return 1; return a.name.localeCompare(b.name); });
  const table = tables.find(t => t.id === tableId);
  const existingOrders = table?.orders || [];

  const handleSendOrder = () => { if (cart.length === 0) return; addOrderToTable(tableId, cart, currentUser?.name || 'Garson'); addLog('ORDER_CREATED', `${tableName} - ${cart.length} kalem sipariş eklendi`, currentUser?.id, currentUser?.name); clearCart(); setActiveTab('orders'); };
  const handleCancelOrder = (orderId, orderIndex) => { setCancelOrderId(orderId); setCancelOrderIndex(orderIndex); setCancelPin(''); setCancelError(''); setCancelModalVisible(true); };
  const confirmCancelOrder = () => {
    const { users } = useAuthStore.getState();
    const user = users.find(u => u.pinCode === cancelPin);
    if (user && user.role === 'admin') { cancelOrderFromTable(tableId, cancelOrderId); addLog('ORDER_CANCELLED', `${tableName} - Sipariş #${cancelOrderIndex + 1} iptal edildi`, currentUser?.id, currentUser?.name); setCancelModalVisible(false); }
    else { setCancelError('Hatalı veya yetkisiz PIN kodu!'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.catPanel}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}><Text style={styles.backBtnText}>← Geri</Text></TouchableOpacity>
        <Text style={styles.panelTitle}>{tableName}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {displayCategories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.catBtn, selectedCategoryId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '15' }]} onPress={() => setSelectedCategory(cat.id)}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catText, selectedCategoryId === cat.id && { color: cat.color }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.prodPanel}>
        <View style={styles.prodHeader}>
          <Text style={styles.panelTitle}>Ürünler</Text>
          <TextInput style={styles.searchInput} placeholder="Ürün ara..." placeholderTextColor={COLORS.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.prodGrid}>
            {filteredItems.map(item => (
              <TouchableOpacity key={item.id} style={styles.prodCard} onPress={() => { addToCart(item); setActiveTab('cart'); }} activeOpacity={0.8}>
                {currentUser?.role === 'admin' && (
                  <TouchableOpacity style={{ position: 'absolute', top: hp(8), right: wp(8), zIndex: 10, padding: wp(4) }} onPress={() => toggleFavoriteMenuItem(item.id)}>
                    <Text style={{ fontSize: fp(18) }}>{item.isFavorite ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.prodName}>{item.name}</Text>
                <Text style={styles.prodPrice}>{item.price} ₺</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.cartPanel}>
        <View style={styles.tabHeader}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'cart' && styles.tabBtnActive]} onPress={() => setActiveTab('cart')}><Text style={[styles.tabBtnText, activeTab === 'cart' && styles.tabBtnTextActive]}>Yeni Sipariş ({cart.length})</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]} onPress={() => setActiveTab('orders')}><Text style={[styles.tabBtnText, activeTab === 'orders' && styles.tabBtnTextActive]}>Adisyon ({existingOrders.length})</Text></TouchableOpacity>
        </View>
        {activeTab === 'cart' ? (<>
          <ScrollView style={{ flex: 1 }}>
            {cart.length === 0 ? <Text style={styles.emptyText}>Ürün seçin</Text> : cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={{ flex: 1 }}><Text style={styles.cartName}>{item.name}</Text><Text style={styles.cartPrice}>{item.price} ₺ × {item.quantity}</Text></View>
                <View style={styles.cartActions}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQuantity(item.id)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: COLORS.danger }]} onPress={() => removeFromCart(item.id)}><Text style={styles.qtyBtnText}>✕</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.cartFooter}>
            <Text style={styles.totalText}>Toplam: {getCartTotal()} ₺</Text>
            <TouchableOpacity style={[styles.sendBtn, cart.length === 0 && { opacity: 0.4 }]} onPress={handleSendOrder} disabled={cart.length === 0}><Text style={styles.sendBtnText}>SİPARİŞ GÖNDER</Text></TouchableOpacity>
          </View>
        </>) : (
          <ScrollView style={{ flex: 1 }}>
            {existingOrders.length === 0 ? <Text style={styles.emptyText}>Mevcut sipariş bulunmuyor</Text> : existingOrders.map((order, index) => (
              <View key={order.id} style={styles.orderBlock}>
                <View style={styles.orderBlockHeader}>
                  <Text style={styles.orderBlockTitle}>Sipariş #{index + 1}</Text>
                  <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => handleCancelOrder(order.id, index)}><Text style={styles.cancelOrderBtnText}>İptal Et</Text></TouchableOpacity>
                </View>
                <Text style={styles.orderBlockMeta}>{order.waiter} • {order.time}</Text>
                {order.items.map((item, iIdx) => (
                  <View key={`${order.id}_${iIdx}`} style={styles.orderItemRow}><Text style={styles.orderItemName}>{item.quantity}x {item.name}</Text><Text style={styles.orderItemPrice}>{item.price * item.quantity} ₺</Text></View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Siparişi İptal Et</Text>
            <Text style={styles.modalSubtitle}>Sipariş #{cancelOrderIndex !== null ? cancelOrderIndex + 1 : ''} iptal edilecek. Bu işlem için Yönetici PIN kodu gereklidir.</Text>
            <TextInput style={styles.pinInput} placeholder="PIN Kodu Girin" placeholderTextColor={COLORS.textMuted} secureTextEntry keyboardType="numeric" value={cancelPin} onChangeText={(text) => { setCancelPin(text); setCancelError(''); }} autoFocus />
            {cancelError ? <Text style={styles.errorText}>{cancelError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}><Text style={styles.modalCancelText}>Vazgeç</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmCancelOrder}><Text style={styles.modalConfirmText}>Onayla & İptal Et</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.background },
  catPanel: { width: '20%', backgroundColor: COLORS.surface, padding: wp(16), borderRightWidth: 1, borderRightColor: COLORS.border },
  backBtn: { marginBottom: hp(16) },
  backBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '600' },
  panelTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: hp(16) },
  catBtn: { flexDirection: 'row', alignItems: 'center', padding: wp(14), borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceLight, marginBottom: hp(8), borderWidth: 1, borderColor: 'transparent', gap: wp(10) },
  catIcon: { fontSize: fp(20) },
  catText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  prodPanel: { flex: 1, backgroundColor: COLORS.background, padding: wp(16) },
  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(16) },
  searchInput: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: wp(16), paddingVertical: hp(10), color: COLORS.textPrimary, flex: 1, marginLeft: wp(16), borderWidth: 1, borderColor: COLORS.border },
  prodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(12) },
  prodCard: { width: '31%', backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.lg, padding: wp(18), alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  prodName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  prodPrice: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.success, marginTop: hp(8) },
  cartPanel: { width: '28%', backgroundColor: COLORS.surface, padding: wp(16), borderLeftWidth: 1, borderLeftColor: COLORS.border },
  tabHeader: { flexDirection: 'row', marginBottom: hp(16), backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, padding: wp(4) },
  tabBtn: { flex: 1, paddingVertical: hp(10), alignItems: 'center', borderRadius: BORDER_RADIUS.md },
  tabBtnActive: { backgroundColor: COLORS.surface, ...SHADOWS.card },
  tabBtnText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  tabBtnTextActive: { color: COLORS.primary },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: hp(40) },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, padding: wp(12), borderRadius: BORDER_RADIUS.md, marginBottom: hp(8) },
  cartName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  cartPrice: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: hp(2) },
  cartActions: { flexDirection: 'row', alignItems: 'center', gap: wp(6) },
  qtyBtn: { width: wp(32), height: wp(32), borderRadius: wp(16), backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: COLORS.textPrimary, fontSize: fp(16), fontWeight: '700' },
  qtyText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '700', minWidth: wp(24), textAlign: 'center' },
  cartFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: hp(16), marginTop: hp(10) },
  totalText: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: hp(12) },
  sendBtn: { backgroundColor: COLORS.primary, padding: wp(16), borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: '800' },
  orderBlock: { backgroundColor: COLORS.surfaceLight, padding: wp(12), borderRadius: BORDER_RADIUS.md, marginBottom: hp(12), borderWidth: 1, borderColor: COLORS.border },
  orderBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderBlockTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
  cancelOrderBtn: { backgroundColor: COLORS.danger + '20', paddingHorizontal: wp(12), paddingVertical: hp(6), borderRadius: BORDER_RADIUS.sm },
  cancelOrderBtnText: { color: COLORS.danger, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  orderBlockMeta: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: hp(8), marginTop: hp(2) },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(4) },
  orderItemName: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  orderItemPrice: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: wp(30), width: wp(360), borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.danger, marginBottom: hp(12) },
  modalSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: hp(20), lineHeight: fp(22) },
  pinInput: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: wp(16), paddingVertical: hp(14), fontSize: fp(24), textAlign: 'center', color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: hp(10), letterSpacing: 10 },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZES.sm, textAlign: 'center', marginBottom: hp(16), fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: wp(12), marginTop: hp(10) },
  modalCancelBtn: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceLight },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.danger },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});

export default TableOrderScreen;
