// Ödeme Ekranı - Smart-Check Out, Hibrit Ödeme, POS Bloke Simülasyonu
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { wp, hp, fp } from '../responsive';
import { useTableStore } from '../store/useTableStore';
import { useAuditStore } from '../store/useAuditStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePosStore } from '../store/usePosStore';
import { printSlipViaBridge } from '../services/posService';

const PaymentScreen = ({ route, navigation }) => {
  const tableId = route?.params?.tableId;
  const tableName = route?.params?.tableName || 'Masa';
  const totalAmount = route?.params?.totalAmount || 0;
  const orderItems = route?.params?.orderItems || [];

  const { closeTable, tables, addPaymentToTable } = useTableStore();
  const table = tables.find(t => t.id === tableId);
  const tableTotal = table?.totalAmount || totalAmount;
  const paidAmount = table?.paidAmount || 0;
  const unpaidAmount = tableTotal - paidAmount;

  const { addTransaction, addLog } = useAuditStore();
  const { deductStock } = useInventoryStore();
  const { currentUser } = useAuthStore();
  const { discountPresets, posIp, posPort } = usePosStore();

  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPosWaiting, setShowPosWaiting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Varsayılan olarak ödenmesi beklenen tutar tüm kalan hesaptır
  const [currentPaymentTarget, setCurrentPaymentTarget] = useState(unpaidAmount);
  
  // Müşteri Ekranı ve Hesap Bölme state'leri
  const [showCustomerDisplay, setShowCustomerDisplay] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'items'
  const [splitCount, setSplitCount] = useState('2');
  const [selectedSplitItems, setSelectedSplitItems] = useState([]); // uniqueKey array

  // İndirim state'leri
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountValue, setDiscountValue] = useState('0');
  const [discountType, setDiscountType] = useState('amount'); // 'percent' | 'amount'

  React.useEffect(() => {
    setCurrentPaymentTarget(unpaidAmount);
  }, [unpaidAmount]);

  const calculatedDiscount = discountType === 'percent' 
    ? (unpaidAmount * (parseFloat(discountValue) / 100 || 0)) 
    : (parseFloat(discountValue) || 0);

  const netTarget = Math.max(0, currentPaymentTarget - calculatedDiscount);
  const remaining = netTarget - cashAmount - cardAmount - voucherAmount;
  const change = paymentMethod === 'cash' && cashAmount > netTarget ? cashAmount - netTarget : 0;

  const quickCashAmounts = [10, 20, 50, 100, 200, 500];

  const handleCashInput = (amount) => {
    if (paymentMethod === 'cash') setCashAmount(prev => prev + amount);
    else if (paymentMethod === 'meal_voucher') setVoucherAmount(prev => prev + amount);
  };

  const handleCardPayment = () => {
    setShowPosWaiting(true);
    setTimeout(() => {
      setCardAmount(remaining > 0 ? remaining : currentPaymentTarget);
      setShowPosWaiting(false);
    }, 2000);
  };

  const handleCompletePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const paidNow = cashAmount + cardAmount + voucherAmount;
    const totalDeduction = paidNow + calculatedDiscount;
    const method = cardAmount > 0 && cashAmount > 0 ? 'hybrid' : paymentMethod;
    
    // Ingenico POS Slip Yazdırma İsteği
    const orderDataForPos = {
      tableName,
      waiter: currentUser?.name,
      totalAmount: paidNow,
      items: orderItems.flatMap(o => o.items)
    };

    // Fiş yazdırılıyor bilgisi için mevcut modalı kullanıyoruz
    setShowPosWaiting(true); 
    const slipResult = await printSlipViaBridge(orderDataForPos, method, posIp, posPort);
    setShowPosWaiting(false);

    if (!slipResult.success) {
      // Gerçek senaryoda burada işlemi durdurmak veya kullanıcıya sormak gerekebilir.
      // Şimdilik sadece uyarı verip işleme devam ediyoruz.
      console.warn(`Fiş yazdırılamadı: ${slipResult.message}`);
      // alert(`Fiş yazdırılamadı: ${slipResult.message}`); // Native ortamlarda eklenebilir
    }

    addTransaction(tableId, tableName, orderItems, paidNow, method, currentUser?.id, currentUser?.name, calculatedDiscount);
    addLog('PAYMENT_RECEIVED', `${tableName} - ${paidNow.toFixed(2)} ₺ (${method})${calculatedDiscount > 0 ? ' [İndirim: ' + calculatedDiscount.toFixed(2) + ' ₺]' : ''}`, currentUser?.id, currentUser?.name);

    if (unpaidAmount - totalDeduction <= 0.01) {
      orderItems.forEach(item => {
        if (item.items) {
          item.items.forEach(subItem => deductStock(subItem.id, subItem.quantity));
        }
      });
      closeTable(tableId);
      setPaymentComplete(true);
      setTimeout(() => {
        if (navigation?.goBack) navigation.goBack();
      }, 2000);
    } else {
      // Kısmi ödemede hem ödenen tutarı hem de indirimi masadan düşmelisiniz
      // useTableStore'daki addPaymentToTable sadece paidAmount artırıyor. 
      // İndirim durumunda totalAmount'u da azaltmak veya paidAmount'u indirim kadar daha artırmak gerekebilir.
      // Burada basitleştirme adına paidAmount'u (ödeme + indirim) kadar artırıyoruz.
      addPaymentToTable(tableId, totalDeduction);
      setCashAmount(0);
      setCardAmount(0);
      setVoucherAmount(0);
      setDiscountValue('0'); // İndirim uygulandıktan sonra sıfırla
      setSelectedSplitItems([]);
      setCurrentPaymentTarget(unpaidAmount - totalDeduction);
      setIsProcessing(false);
    }
  };

  // Tüm ürünleri tekil parçalar olarak düzleştir (Bölme için)
  const flatItems = orderItems.flatMap(order => 
    order.items.flatMap(item => 
      Array.from({ length: item.quantity }).map((_, idx) => ({
        ...item,
        uniqueKey: `${order.id}-${item.id}-${idx}`,
      }))
    )
  );

  const toggleSplitItem = (key) => {
    if (selectedSplitItems.includes(key)) {
      setSelectedSplitItems(prev => prev.filter(k => k !== key));
    } else {
      setSelectedSplitItems(prev => [...prev, key]);
    }
  };

  const applySplit = () => {
    if (splitMode === 'equal') {
      const count = parseInt(splitCount) || 1;
      setCurrentPaymentTarget(unpaidAmount / count);
    } else {
      const total = flatItems
        .filter(i => selectedSplitItems.includes(i.uniqueKey))
        .reduce((sum, i) => sum + i.price, 0);
      setCurrentPaymentTarget(total);
    }
    setShowSplitModal(false);
  };

  if (paymentComplete) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>✅</Text>
        <Text style={styles.successText}>Ödeme Tamamlandı!</Text>
        <Text style={styles.successSub}>{tableName} kapatıldı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sol: Hesap Özeti */}
      <View style={styles.summaryPanel}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.panelTitle}>{tableName} - Ödeme</Text>
        
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>ÖDENECEK TUTAR</Text>
          <Text style={[styles.totalValue, calculatedDiscount > 0 && { color: COLORS.success }]}>{netTarget.toFixed(2)} ₺</Text>
          {calculatedDiscount > 0 && (
            <Text style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 4, textDecorationLine: 'line-through' }}>
              {currentPaymentTarget.toFixed(2)} ₺
            </Text>
          )}
        </View>

        {unpaidAmount !== currentPaymentTarget && (
          <View style={[styles.totalBox, { backgroundColor: COLORS.surfaceHighlight, padding: 12, marginBottom: 12 }]}>
            <Text style={[styles.totalLabel, { fontSize: 10 }]}>MASA KALAN: {unpaidAmount.toFixed(2)} ₺</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.resetBtn, { marginBottom: 16, borderColor: COLORS.secondary, backgroundColor: COLORS.secondary + '10' }]}
          onPress={() => setShowCustomerDisplay(true)}
        >
          <Text style={{ color: COLORS.secondary, fontWeight: '700' }}>📱 Müşteri Ekranı</Text>
        </TouchableOpacity>

        {change > 0 && (
          <View style={[styles.totalBox, { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]}>
            <Text style={[styles.totalLabel, { color: COLORS.success }]}>PARA ÜSTÜ</Text>
            <Text style={[styles.totalValue, { color: COLORS.success, fontSize: 32 }]}>{change.toFixed(2)} ₺</Text>
          </View>
        )}
        
        {remaining > 0 && (
          <View style={[styles.totalBox, { backgroundColor: COLORS.warning + '20', borderColor: COLORS.warning }]}>
            <Text style={[styles.totalLabel, { color: COLORS.warning }]}>KALAN</Text>
            <Text style={[styles.totalValue, { color: COLORS.warning, fontSize: 32 }]}>{remaining.toFixed(2)} ₺</Text>
          </View>
        )}

        <View style={styles.breakdownSection}>
          {calculatedDiscount > 0 && <Text style={[styles.breakdownItem, { color: COLORS.danger, fontWeight: '700' }]}>✂️ İndirim: -{calculatedDiscount.toFixed(2)} ₺</Text>}
          {cashAmount > 0 && <Text style={styles.breakdownItem}>💵 Nakit: {cashAmount.toFixed(2)} ₺</Text>}
          {cardAmount > 0 && <Text style={styles.breakdownItem}>💳 Kart: {cardAmount.toFixed(2)} ₺</Text>}
          {voucherAmount > 0 && <Text style={styles.breakdownItem}>🎫 Kupon: {voucherAmount.toFixed(2)} ₺</Text>}
        </View>
      </View>

      {/* Sağ: Ödeme Yöntemleri */}
      <View style={styles.paymentPanel}>
        <View style={styles.methodTabs}>
          {[
            { key: 'cash', label: '💵 Nakit', color: COLORS.success },
            { key: 'card', label: '💳 Kart', color: COLORS.primary },
            { key: 'meal_voucher', label: '🎫 Kupon', color: COLORS.warning },
          ].map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodTab, paymentMethod === m.key && { backgroundColor: m.color + '20', borderColor: m.color }]}
              onPress={() => setPaymentMethod(m.key)}
            >
              <Text style={[styles.methodTabText, paymentMethod === m.key && { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(paymentMethod === 'cash' || paymentMethod === 'meal_voucher') && (
          <View style={styles.quickAmounts}>
            {quickCashAmounts.map(amt => (
              <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => handleCashInput(amt)}>
                <Text style={styles.quickBtnText}>{amt} ₺</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.secondary + '20', borderColor: COLORS.secondary }]}
              onPress={() => {
                if (paymentMethod === 'cash') setCashAmount(currentPaymentTarget - cardAmount - voucherAmount);
                else setVoucherAmount(currentPaymentTarget - cashAmount - cardAmount);
              }}
            >
              <Text style={[styles.quickBtnText, { color: COLORS.secondary }]}>TAM</Text>
            </TouchableOpacity>
          </View>
        )}

        {paymentMethod === 'card' && (
          <TouchableOpacity style={styles.cardPayBtn} onPress={handleCardPayment}>
            <Text style={styles.cardPayBtnText}>💳 POS Çekimi Başlat</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity 
            style={[styles.cardPayBtn, { backgroundColor: COLORS.warning, flex: 1, marginBottom: 0 }]} 
            onPress={() => setShowSplitModal(true)}
          >
            <Text style={styles.cardPayBtnText}>✂️ Böl</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cardPayBtn, { backgroundColor: COLORS.secondary, flex: 1, marginBottom: 0 }]} 
            onPress={() => setShowDiscountModal(true)}
          >
            <Text style={styles.cardPayBtnText}>🏷️ İndirim</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setCashAmount(0); setCardAmount(0); setVoucherAmount(0); setCurrentPaymentTarget(unpaidAmount); }}>
            <Text style={styles.resetBtnText}>Sıfırla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.completeBtn, remaining > 0 && { opacity: 0.4 }]}
            onPress={handleCompletePayment}
            disabled={remaining > 0}
          >
            <Text style={styles.completeBtnText}>✓ {unpaidAmount - (cashAmount + cardAmount + voucherAmount) <= 0.01 ? 'HESABI KAPAT' : 'ÖDEMEYİ AL'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Müşteri Ekranı Modalı */}
      <Modal visible={showCustomerDisplay} transparent animationType="slide">
        <View style={styles.customerOverlay}>
          <View style={styles.customerContent}>
            <Text style={styles.customerTitle}>ÖDEME ÖZETİ</Text>
            <Text style={styles.customerTable}>{tableName}</Text>
            <ScrollView style={styles.customerItems}>
              {orderItems.flatMap(o => o.items).map((item, idx) => (
                <View key={idx} style={styles.customerItemRow}>
                  <Text style={styles.customerItemName}>{item.quantity}x {item.name}</Text>
                  <Text style={styles.customerItemPrice}>{(item.price * item.quantity).toFixed(2)} ₺</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.customerTotalBox}>
              <Text style={styles.customerTotalLabel}>TOPLAM TUTAR</Text>
              <Text style={styles.customerTotalValue}>{tableTotal.toFixed(2)} ₺</Text>
            </View>
            <TouchableOpacity style={styles.customerCloseBtn} onPress={() => setShowCustomerDisplay(false)}>
              <Text style={styles.customerCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hesap Bölme Modalı */}
      <Modal visible={showSplitModal} transparent animationType="fade">
        <View style={styles.posOverlay}>
          <View style={[styles.posModal, { width: 500, maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Hesabı Böl</Text>
            <View style={styles.methodTabs}>
              <TouchableOpacity style={[styles.methodTab, splitMode === 'equal' && { borderColor: COLORS.primary }]} onPress={() => setSplitMode('equal')}>
                <Text style={[styles.methodTabText, splitMode === 'equal' && { color: COLORS.primary }]}>Eşit Böl</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodTab, splitMode === 'items' && { borderColor: COLORS.primary }]} onPress={() => setSplitMode('items')}>
                <Text style={[styles.methodTabText, splitMode === 'items' && { color: COLORS.primary }]}>Ürün Seç</Text>
              </TouchableOpacity>
            </View>

            {splitMode === 'equal' ? (
              <View style={{ width: '100%', padding: 20 }}>
                <Text style={styles.posSubtitle}>Kaç kişiye bölünecek?</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center', fontSize: 24, marginTop: 10 }]}
                  value={splitCount}
                  onChangeText={setSplitCount}
                  keyboardType="numeric"
                />
                <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.primary, fontWeight: '700' }}>
                  Kişi Başı: {(unpaidAmount / (parseInt(splitCount) || 1)).toFixed(2)} ₺
                </Text>
              </View>
            ) : (
              <ScrollView style={{ width: '100%', maxHeight: 300 }}>
                {flatItems.map((item) => (
                  <TouchableOpacity 
                    key={item.uniqueKey} 
                    style={[styles.splitItemRow, selectedSplitItems.includes(item.uniqueKey) && { backgroundColor: COLORS.primary + '20' }]} 
                    onPress={() => toggleSplitItem(item.uniqueKey)}
                  >
                    <Text style={[styles.splitItemText, selectedSplitItems.includes(item.uniqueKey) && { color: COLORS.primary }]}>{item.name}</Text>
                    <Text style={[styles.splitItemPrice, selectedSplitItems.includes(item.uniqueKey) && { color: COLORS.primary }]}>{item.price.toFixed(2)} ₺</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSplitModal(false)}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={applySplit}>
                <Text style={styles.modalConfirmText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* İndirim Modalı */}
      <Modal visible={showDiscountModal} transparent animationType="fade">
        <View style={styles.posOverlay}>
          <View style={[styles.posModal, { width: 400 }]}>
            <Text style={styles.modalTitle}>İndirim Uygula</Text>
            
            <View style={[styles.methodTabs, { marginBottom: 20 }]}>
              <TouchableOpacity 
                style={[styles.methodTab, discountType === 'amount' && { borderColor: COLORS.secondary }]} 
                onPress={() => setDiscountType('amount')}
              >
                <Text style={[styles.methodTabText, discountType === 'amount' && { color: COLORS.secondary }]}>₺ Tutar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodTab, discountType === 'percent' && { borderColor: COLORS.secondary }]} 
                onPress={() => setDiscountType('percent')}
              >
                <Text style={[styles.methodTabText, discountType === 'percent' && { color: COLORS.secondary }]}>% Yüzde</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { width: '100%', textAlign: 'center', fontSize: 24 }]}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
              placeholder="0"
            />

            <View style={{ marginTop: 20, width: '100%' }}>
              <Text style={[styles.posSubtitle, { marginBottom: 10 }]}>Hızlı Seçim (Preset)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {discountPresets.map(dp => (
                  <TouchableOpacity 
                    key={dp.id} 
                    style={[styles.catChip, { backgroundColor: COLORS.secondary + '15', borderColor: COLORS.secondary + '40', paddingVertical: 8 }]} 
                    onPress={() => {
                      setDiscountType(dp.type);
                      setDiscountValue(dp.value.toString());
                    }}
                  >
                    <Text style={[styles.catChipText, { color: COLORS.secondary, fontSize: 12 }]}>{dp.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setDiscountValue('0'); setShowDiscountModal(false); }}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: COLORS.secondary }]} onPress={() => setShowDiscountModal(false)}>
                <Text style={styles.modalConfirmText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POS Bekleme Modalı */}
      <Modal visible={showPosWaiting} transparent animationType="fade">
        <View style={styles.posOverlay}>
          <View style={styles.posModal}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.posTitle}>POS Cihazından Onay Bekleniyor...</Text>
            <Text style={styles.posSubtitle}>Lütfen kartı POS cihazına okutun</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.background },
  summaryPanel: { width: '40%', backgroundColor: COLORS.surface, padding: wp(24), borderRightWidth: 1, borderRightColor: COLORS.border },
  backBtn: { marginBottom: hp(16) },
  backBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '600' },
  panelTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: hp(24) },
  totalBox: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.lg, padding: wp(20), alignItems: 'center', marginBottom: hp(16), borderWidth: 1, borderColor: COLORS.border },
  totalLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 2 },
  totalValue: { fontSize: fp(48), fontWeight: '800', color: COLORS.textPrimary, marginTop: hp(8) },
  breakdownSection: { marginTop: hp(20) },
  breakdownItem: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, marginBottom: hp(8) },
  paymentPanel: { flex: 1, padding: wp(24) },
  methodTabs: { flexDirection: 'row', gap: wp(12), marginBottom: hp(24) },
  methodTab: { flex: 1, padding: wp(16), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  methodTabText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textSecondary },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(12), marginBottom: hp(24) },
  quickBtn: { width: '30%', padding: wp(18), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  quickBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  cardPayBtn: { backgroundColor: COLORS.primary, padding: wp(20), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginBottom: hp(24), borderWidth: 2, borderColor: COLORS.primaryLight },
  cardPayBtnText: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#fff' },
  actionRow: { flexDirection: 'row', gap: wp(12), marginTop: 'auto' },
  resetBtn: { flex: 1, padding: wp(18), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  resetBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.textSecondary },
  completeBtn: { flex: 2, padding: wp(18), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.successLight },
  completeBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '900', color: '#fff' },
  successText: { fontSize: fp(36), fontWeight: '800', color: COLORS.success },
  successSub: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, marginTop: hp(8) },
  posOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  posModal: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: wp(40), alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, width: wp(380) },
  posTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginTop: hp(20), textAlign: 'center' },
  posSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: hp(8) },
  customerOverlay: { flex: 1, backgroundColor: COLORS.background, padding: wp(40), justifyContent: 'center', alignItems: 'center' },
  customerContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: wp(40), width: '100%', maxWidth: wp(600), height: '90%', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.elevated },
  customerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: hp(10), letterSpacing: 4 },
  customerTable: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: hp(30) },
  customerItems: { flex: 1, marginBottom: hp(20) },
  customerItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hp(12), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  customerItemName: { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, fontWeight: '600' },
  customerItemPrice: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '700' },
  customerTotalBox: { backgroundColor: COLORS.surfaceLight, padding: wp(30), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginBottom: hp(20) },
  customerTotalLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 2 },
  customerTotalValue: { fontSize: fp(64), fontWeight: '800', color: COLORS.textPrimary, marginTop: hp(10) },
  customerCloseBtn: { backgroundColor: COLORS.surfaceLight, padding: wp(20), borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  customerCloseText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '700' },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: hp(20) },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, padding: wp(15), color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, borderWidth: 1, borderColor: COLORS.border },
  splitItemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: wp(16), borderRadius: BORDER_RADIUS.md, marginBottom: hp(8), borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceLight },
  splitItemText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  splitItemPrice: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: wp(12), marginTop: hp(20), width: '100%' },
  modalCancelBtn: { flex: 1, padding: wp(15), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center' },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  modalConfirmBtn: { flex: 2, padding: wp(15), borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800' },
  catChip: { paddingHorizontal: wp(12), paddingVertical: hp(6), borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceLight },
  catChipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
});

export default PaymentScreen;
