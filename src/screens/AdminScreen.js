// Yönetim Paneli - Menü/Fiyat Yönetimi, Toplu İşlem, Yazıcı Tanımları (Sadece Admin)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { usePosStore } from '../store/usePosStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuditStore } from '../store/useAuditStore';
import { useAuthStore } from '../store/useAuthStore';
import { useStaffStore } from '../store/useStaffStore';

// Yazıcı form input bileşeni
const PrinterInput = ({ label, value, onChangeText, placeholder, keyboardType }) => (
  <View style={styles.printerInputGroup}>
    <Text style={styles.printerInputLabel}>{label}</Text>
    <TextInput
      style={styles.printerInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

const AdminScreen = () => {
  const { 
    categories, menuItems, printers, discountPresets,
    bulkPriceUpdate, addPrinter, updatePrinter, removePrinter, 
    addCategory, updateCategory, removeCategory, addMenuItem, updateMenuItem, 
    addDiscountPreset, removeDiscountPreset
  } = usePosStore();
  const { ingredients, addStock, setRecipe, recipes, addIngredient } = useInventoryStore();
  const { logs, transactions, takeZReport, zReports } = useAuditStore();
  const { currentUser, logout } = useAuthStore();
  const { 
    staff, shifts, attendance, tasks, requests, roles,
    assignTask, updateRequestStatus, addStaff, updateStaff, removeStaff, addRole 
  } = useStaffStore();
  const [activeTab, setActiveTab] = useState('menu');
  const [selectedCatForBulk, setSelectedCatForBulk] = useState(null);
  const [bulkPercent, setBulkPercent] = useState('');
  const [stockAddQty, setStockAddQty] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  // Arama state'leri
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Yeni stok ekleme state'leri
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [newIngredientForm, setNewIngredientForm] = useState({ name: '', unit: '', criticalLevel: '' });

  // Yazıcı düzenleme state'leri
  const [editingPrinterId, setEditingPrinterId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', ip: '', port: '' });
  const [isAddingPrinter, setIsAddingPrinter] = useState(false);
  const [newPrinterForm, setNewPrinterForm] = useState({ name: '', ip: '', port: '9100' });

  // Yeni ürün ekleme state'leri
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProductForm, setNewProductForm] = useState({ name: '', price: '', categoryId: '', printerRoute: '' });
  const [useRecipe, setUseRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState([]);
  
  // Yeni kategori ekleme state'leri
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', icon: '📋', color: '#6366f1', printerRoute: '' });
  
  // Personel state'leri
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'waiter', salary: '30000' });
  const [taskForm, setTaskForm] = useState({ staffId: '', title: '', description: '' });
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [newShiftForm, setNewShiftForm] = useState({ staffId: '', startTime: '09:00', endTime: '18:00', date: '' });
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  
  // Custom Modal state'leri
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [newDiscountForm, setNewDiscountForm] = useState({ name: '', type: 'percent', value: '' });

  const startEditingProduct = (item) => {
    setIsAddingProduct(true);
    setEditingProductId(item.id);
    setNewProductForm({ 
      name: item.name, 
      price: item.price.toString(), 
      categoryId: item.categoryId, 
      printerRoute: item.printerRoute || '' 
    });
    
    // Yüklü reçete varsa getir
    const existingRecipe = recipes[item.id];
    if (existingRecipe && existingRecipe.length > 0) {
      setUseRecipe(true);
      setNewRecipe(existingRecipe.map(r => ({ ...r, qty: r.qty.toString() })));
    } else {
      setUseRecipe(false);
      setNewRecipe([]);
    }
  };

  const handleAddProduct = () => {
    if (!newProductForm.name || !newProductForm.price || !newProductForm.categoryId) {
      Alert.alert('Hata', 'Ürün adı, fiyatı ve kategorisi zorunludur.');
      return;
    }
    const price = parseFloat(newProductForm.price);
    if (isNaN(price)) {
      Alert.alert('Hata', 'Geçerli bir fiyat girin.');
      return;
    }

    if (editingProductId) {
      // Güncelleme
      updateMenuItem(editingProductId, {
        name: newProductForm.name,
        price,
        categoryId: newProductForm.categoryId,
        printerRoute: newProductForm.printerRoute || categories.find(c => c.id === newProductForm.categoryId)?.printerRoute
      });

      if (useRecipe && newRecipe.length > 0) {
        const validRecipe = newRecipe.filter(r => r.ingredientId && parseFloat(r.qty) > 0).map(r => ({
          ingredientId: r.ingredientId,
          qty: parseFloat(r.qty)
        }));
        setRecipe(editingProductId, validRecipe);
      } else {
        setRecipe(editingProductId, null); // Reçeteyi kaldır
      }
      addLog('PRODUCT_UPDATED', `${newProductForm.name} ürünü güncellendi`, currentUser?.id, currentUser?.name);
      setEditingProductId(null);
    } else {
      // Yeni Ekleme
      const newId = `m_${Date.now()}`;
      const newItem = {
        id: newId,
        name: newProductForm.name,
        price,
        categoryId: newProductForm.categoryId,
        printerRoute: newProductForm.printerRoute || categories.find(c => c.id === newProductForm.categoryId)?.printerRoute
      };

      addMenuItem(newItem);

      if (useRecipe && newRecipe.length > 0) {
        const validRecipe = newRecipe.filter(r => r.ingredientId && parseFloat(r.qty) > 0).map(r => ({
          ingredientId: r.ingredientId,
          qty: parseFloat(r.qty)
        }));
        if (validRecipe.length > 0) {
          setRecipe(newId, validRecipe);
        }
      }
      addLog('PRODUCT_CREATED', `${newProductForm.name} ürünü eklendi`, currentUser?.id, currentUser?.name);
    }

    setNewProductForm({ name: '', price: '', categoryId: '', printerRoute: '' });
    setNewRecipe([]);
    setUseRecipe(false);
    setIsAddingProduct(false);
  };


  const handleAddRecipeItem = (ingredientId) => {
    if (!newRecipe.find(r => r.ingredientId === ingredientId)) {
      setNewRecipe([...newRecipe, { ingredientId, qty: '' }]);
    }
  };

  const updateRecipeQty = (ingredientId, qty) => {
    setNewRecipe(newRecipe.map(r => r.ingredientId === ingredientId ? { ...r, qty } : r));
  };
  
  const removeRecipeItem = (ingredientId) => {
    setNewRecipe(newRecipe.filter(r => r.ingredientId !== ingredientId));
  };

  const handleBulkUpdate = () => {
    if (!selectedCatForBulk || !bulkPercent) return;
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct)) return;
    setShowBulkModal(true);
  };

  const confirmBulkUpdate = () => {
    const pct = parseFloat(bulkPercent);
    const multiplier = 1 + pct / 100;
    bulkPriceUpdate(selectedCatForBulk, multiplier);
    addLog('BULK_PRICE_UPDATE', `%${pct} güncelleme yapıldı`, currentUser?.id, currentUser?.name);
    setBulkPercent('');
    setShowBulkModal(false);
  };

  const handleAddStock = () => {
    if (!selectedIngredient || !stockAddQty) return;
    const qty = parseFloat(stockAddQty);
    if (isNaN(qty) || qty <= 0) return;
    addStock(selectedIngredient, qty);
    const ingName = ingredients.find(i => i.id === selectedIngredient)?.name || '';
    addLog('STOCK_ADDED', `${ingName}: +${qty} ${ingredients.find(i => i.id === selectedIngredient)?.unit}`, currentUser?.id, currentUser?.name);
    setStockAddQty('');
    Alert.alert('Stok Güncellendi', `${qty} birim stok eklendi.`);
  };

  const handleAddNewIngredient = () => {
    if (!newIngredientForm.name || !newIngredientForm.unit || !newIngredientForm.criticalLevel) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    const criticalLevel = parseFloat(newIngredientForm.criticalLevel);
    if (isNaN(criticalLevel)) {
      Alert.alert('Hata', 'Kritik seviye sayı olmalıdır.');
      return;
    }
    addIngredient({ name: newIngredientForm.name, unit: newIngredientForm.unit, criticalLevel });
    addLog('INGREDIENT_CREATED', `${newIngredientForm.name} malzemesi tanımlandı`, currentUser?.id, currentUser?.name);
    setNewIngredientForm({ name: '', unit: '', criticalLevel: '' });
    setIsAddingIngredient(false);
    Alert.alert('Başarılı', 'Yeni stok kalemi eklendi.');
  };

  const handleAddCategory = () => {
    if (!newCategoryForm.name || !newCategoryForm.printerRoute) {
      Alert.alert('Hata', 'Kategori adı ve yazıcı yönlendirmesi zorunludur.');
      return;
    }
    addCategory(newCategoryForm);
    addLog('CATEGORY_CREATED', `${newCategoryForm.name} kategorisi eklendi`, currentUser?.id, currentUser?.name);
    setNewCategoryForm({ name: '', icon: '📋', color: '#6366f1', printerRoute: '' });
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (cat) => {
    Alert.alert(
      'Kategori Sil',
      `"${cat.name}" kategorisini ve İÇİNDEKİ TÜM ÜRÜNLERİ silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive', 
          onPress: () => {
            removeCategory(cat.id);
            addLog('CATEGORY_DELETED', `${cat.name} kategorisi ve ürünleri silindi`, currentUser?.id, currentUser?.name);
          }
        },
      ]
    );
  };

  // Yazıcı düzenleme başlat
  const startEditing = (printer) => {
    setEditingPrinterId(printer.id);
    setEditForm({ name: printer.name, ip: printer.ip, port: printer.port });
  };

  // Yazıcı düzenleme kaydet
  const saveEdit = () => {
    if (!editForm.name || !editForm.ip || !editForm.port) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    updatePrinter(editingPrinterId, editForm);
    setEditingPrinterId(null);
  };

  // Yeni yazıcı ekle
  const handleAddPrinter = () => {
    if (!newPrinterForm.name || !newPrinterForm.ip || !newPrinterForm.port) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    addPrinter(newPrinterForm);
    setNewPrinterForm({ name: '', ip: '', port: '9100' });
    setIsAddingPrinter(false);
  };

  const handleTakeZReport = () => {
    Alert.alert(
      'Gün Sonu Al',
      'Tüm güncel işlemler kapatılacak ve Z-Raporu oluşturulacak. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet, Gün Sonu Al', 
          onPress: () => {
            const report = takeZReport(currentUser?.id, currentUser?.name);
            if (report) {
              Alert.alert('Başarılı', `Z-Raporu oluşturuldu. Toplam Satış: ${report.totalSales} ₺`);
            } else {
              Alert.alert('Hata', 'Kapatılacak işlem bulunamadı.');
            }
          }
        }
      ]
    );
  };

  // Yazıcı sil
  const handleDeletePrinter = (printer) => {
    Alert.alert(
      'Yazıcı Sil',
      `"${printer.name}" yazıcısını silmek istediğinize emin misiniz?\nBağlı kategorilerin yazıcı yönlendirmesi kaldırılacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removePrinter(printer.id) },
      ]
    );
  };

  const handleAddStaff = () => {
    if (!newStaffForm.name) return;
    const salary = parseFloat(newStaffForm.salary);
    
    if (editingStaffId) {
      updateStaff(editingStaffId, { ...newStaffForm, salary });
      addLog('STAFF_UPDATED', `${newStaffForm.name} personeli güncellendi`, currentUser?.id, currentUser?.name);
      setEditingStaffId(null);
    } else {
      addStaff({ ...newStaffForm, salary });
      addLog('STAFF_ADDED', `${newStaffForm.name} personeli eklendi`, currentUser?.id, currentUser?.name);
    }
    
    setIsAddingStaff(false);
    setNewStaffForm({ name: '', role: roles[0] || 'waiter', salary: '30000' });
  };

  const handleAddRole = () => {
    if (!newRoleName) return;
    addRole(newRoleName);
    addLog('ROLE_ADDED', `${newRoleName} rolü eklendi`, currentUser?.id, currentUser?.name);
    setNewRoleName('');
    setIsAddingRole(false);
  };

  const startEditingStaff = (person) => {
    setEditingStaffId(person.id);
    setIsAddingStaff(true);
    setNewStaffForm({ name: person.name, role: person.role, salary: person.salary.toString() });
  };

  const handleDeleteStaff = (person) => {
    Alert.alert('Personel Sil', `"${person.name}" kişisini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => {
        removeStaff(person.id);
        addLog('STAFF_DELETED', `${person.name} personeli silindi`, currentUser?.id, currentUser?.name);
      }}
    ]);
  };

  const handleAddDiscount = () => {
    if (!newDiscountForm.name || !newDiscountForm.value) return;
    addDiscountPreset({ ...newDiscountForm, value: parseFloat(newDiscountForm.value) });
    addLog('DISCOUNT_ADDED', `${newDiscountForm.name} indirim preseti eklendi`, currentUser?.id, currentUser?.name);
    setNewDiscountForm({ name: '', type: 'percent', value: '' });
    setIsAddingDiscount(false);
  };

  const handleAssignTask = () => {
    if (!taskForm.staffId || !taskForm.title) return;
    assignTask(taskForm);
    addLog('TASK_ASSIGNED', `${staff.find(s => s.id === taskForm.staffId)?.name} kişisine görev atandı: ${taskForm.title}`, currentUser?.id, currentUser?.name);
    setTaskForm({ staffId: '', title: '', description: '' });
    Alert.alert('Başarılı', 'Görev atandı.');
  };

  const handleUpdateRequest = (id, status) => {
    updateRequestStatus(id, status);
    addLog('REQUEST_UPDATED', `Talep ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`, currentUser?.id, currentUser?.name);
  };

  const { addShift, removeShift } = useStaffStore();
  const handleAddShift = () => {
    if (!newShiftForm.staffId || !newShiftForm.date) return;
    addShift(newShiftForm);
    addLog('SHIFT_ADDED', `${staff.find(s => s.id === newShiftForm.staffId)?.name} için vardiya eklendi: ${newShiftForm.date}`, currentUser?.id, currentUser?.name);
    setIsAddingShift(false);
  };

  const tabs = [
    { key: 'menu', label: '🍽️ Menü & Fiyat' },
    { key: 'stock', label: '📦 Stok Yönetimi' },
    { key: 'printers', label: '🖨️ Yazıcılar' },
    { key: 'reports', label: '📊 Raporlar' },
    { key: 'logs', label: '📜 Kayıtlar' },
    { key: 'staff', label: '👥 Personel' },
  ];

  return (
    <View style={styles.container}>
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
        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: COLORS.danger + '15', marginLeft: 'auto' }]} 
          onPress={logout}
        >
          <Text style={[styles.tabText, { color: COLORS.danger }]}>🚪 Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* MENÜ & FİYAT */}
        {activeTab === 'menu' && (
          <View>
            <View style={styles.printerHeader}>
              <View>
                <Text style={styles.sectionTitle}>Kategori & Menü Yönetimi</Text>
                <Text style={styles.sectionSub}>Kategorileri ve ürünleri düzenleyin.</Text>
              </View>
              <TouchableOpacity style={styles.addPrinterBtn} onPress={() => setIsAddingCategory(!isAddingCategory)}>
                <Text style={styles.addPrinterBtnText}>{isAddingCategory ? '✕ İptal' : '＋ Yeni Kategori'}</Text>
              </TouchableOpacity>
            </View>

            {/* Yeni Kategori Ekleme Formu */}
            {isAddingCategory && (
              <View style={[styles.addPrinterCard, { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '30' }]}>
                <Text style={[styles.addPrinterTitle, { color: COLORS.primary }]}>🆕 Yeni Kategori Ekle</Text>
                <PrinterInput label="Kategori Adı" value={newCategoryForm.name} onChangeText={(v) => setNewCategoryForm(f => ({...f, name: v}))} placeholder="ör: Ara Sıcaklar" />
                <PrinterInput label="İkon (Emoji)" value={newCategoryForm.icon} onChangeText={(v) => setNewCategoryForm(f => ({...f, icon: v}))} placeholder="ör: 🥙" />
                <Text style={[styles.printerInputLabel, { marginTop: 12 }]}>Yazıcı Yönlendirmesi (POS)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {printers.map(p => (
                      <TouchableOpacity 
                        key={p.id} 
                        style={[styles.catChip, newCategoryForm.printerRoute === p.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]} 
                        onPress={() => setNewCategoryForm(f => ({...f, printerRoute: p.id}))}
                      >
                        <Text style={[styles.catChipText, newCategoryForm.printerRoute === p.id && { color: '#fff' }]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={handleAddCategory}>
                  <Text style={styles.saveBtnText}>✓ Kategoriyi Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Toplu Fiyat Güncelleme</Text>
              <TouchableOpacity style={styles.addPrinterBtn} onPress={() => { setIsAddingProduct(true); setEditingProductId(null); }}>
                <Text style={styles.addPrinterBtnText}>＋ Yeni Ürün</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bulkRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, selectedCatForBulk === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
                      onPress={() => setSelectedCatForBulk(cat.id)}
                    >
                      <Text style={[styles.catChipText, selectedCatForBulk === cat.id && { color: cat.color }]}>{cat.icon} {cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.bulkInputRow}>
                <TextInput
                  style={styles.input}
                  value={bulkPercent}
                  onChangeText={setBulkPercent}
                  placeholder="% oran (ör: 10 veya -15)"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleBulkUpdate}>
                  <Text style={styles.applyBtnText}>Uygula</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 0 }]}>Menü Kalemleri</Text>
              <TextInput
                style={[styles.searchInput, { marginTop: 30 }]}
                placeholder="Menüde ara..."
                placeholderTextColor={COLORS.textMuted}
                value={menuSearchQuery}
                onChangeText={setMenuSearchQuery}
              />
            </View>
            
            <TouchableOpacity style={[styles.addPrinterBtn, { alignSelf: 'flex-start', marginBottom: 16 }]} onPress={() => { setIsAddingProduct(!isAddingProduct); setEditingProductId(null); setNewProductForm({ name: '', price: '', categoryId: '', printerRoute: '' }); setUseRecipe(false); setNewRecipe([]); }}>
              <Text style={styles.addPrinterBtnText}>{isAddingProduct ? '✕ İptal' : '＋ Yeni Ürün Ekle'}</Text>
            </TouchableOpacity>

            {isAddingProduct && (
              <View style={styles.addPrinterCard}>
                <Text style={styles.addPrinterTitle}>{editingProductId ? '✏️ Ürün Düzenle' : '🆕 Yeni Ürün'}</Text>
                <PrinterInput label="Ürün Adı" value={newProductForm.name} onChangeText={(v) => setNewProductForm(f => ({...f, name: v}))} placeholder="ör: Tost" />
                <PrinterInput label="Fiyat (₺)" value={newProductForm.price} onChangeText={(v) => setNewProductForm(f => ({...f, price: v}))} placeholder="ör: 50" keyboardType="numeric" />
                
                <Text style={styles.printerInputLabel}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {categories.map(cat => (
                      <TouchableOpacity key={cat.id} style={[styles.catChip, newProductForm.categoryId === cat.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]} onPress={() => setNewProductForm(f => ({...f, categoryId: cat.id}))}>
                        <Text style={[styles.catChipText, newProductForm.categoryId === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10 }} onPress={() => setUseRecipe(!useRecipe)}>
                  <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: COLORS.primary, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: useRecipe ? COLORS.primary : 'transparent' }}>
                    {useRecipe && <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <Text style={styles.printerInputLabel}>Reçete Ekle (Opsiyonel - Stok Takibi İçin)</Text>
                </TouchableOpacity>

                {useRecipe && (
                  <View style={{ backgroundColor: COLORS.surfaceLight, padding: 12, borderRadius: BORDER_RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border }}>
                    <Text style={[styles.printerInputLabel, { marginBottom: 8 }]}>Malzemeler (Eklemek için dokunun)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {ingredients.map(ing => (
                          <TouchableOpacity key={ing.id} style={[styles.catChip, { paddingVertical: 6, paddingHorizontal: 10 }]} onPress={() => handleAddRecipeItem(ing.id)}>
                            <Text style={styles.catChipText}>{ing.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    
                    {newRecipe.map(r => {
                      const ing = ingredients.find(i => i.id === r.ingredientId);
                      return (
                        <View key={r.ingredientId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                          <Text style={{ flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary }}>{ing?.name}</Text>
                          <TextInput 
                            style={[styles.input, { flex: 0.5, paddingVertical: 8 }]} 
                            placeholder={`Miktar (${ing?.unit})`} 
                            value={r.qty} 
                            onChangeText={(v) => updateRecipeQty(r.ingredientId, v)} 
                            keyboardType="numeric" 
                          />
                          <TouchableOpacity onPress={() => removeRecipeItem(r.ingredientId)} style={{ padding: 8 }}>
                            <Text style={{ color: COLORS.danger, fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </View>
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                  <Text style={styles.saveBtnText}>✓ Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            {categories.map(cat => {
              const catItems = menuItems.filter(i => i.categoryId === cat.id && (!menuSearchQuery || i.name.toLowerCase().includes(menuSearchQuery.toLowerCase())));
              if (catItems.length === 0 && menuSearchQuery) return null; // Arama var ve sonuç yoksa kategoriyi gizle
              
              catItems.sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.name.localeCompare(b.name);
              });

              return (
                <View key={cat.id} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.catHeader, { color: cat.color }]}>{cat.icon} {cat.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteCategory(cat)} style={{ padding: 4 }}>
                      <Text style={{ color: COLORS.danger, fontSize: 12 }}>🗑️ Kategoriyi Sil</Text>
                    </TouchableOpacity>
                  </View>
                  {catItems.map(item => (
                    <View key={item.id} style={styles.menuRow}>
                      <Text style={styles.menuName}>{item.name}</Text>
                      <Text style={styles.menuPrice}>{item.price} ₺</Text>
                      <Text style={styles.menuPrinter}>{printers.find(p => p.id === item.printerRoute)?.name || '-'}</Text>
                      <TouchableOpacity style={styles.editBtn} onPress={() => startEditingProduct(item)}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* İndirim Yönetimi */}
            <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 20 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>💰 İndirim Presetleri</Text>
                <TouchableOpacity style={styles.addPrinterBtn} onPress={() => setIsAddingDiscount(!isAddingDiscount)}>
                  <Text style={styles.addPrinterBtnText}>{isAddingDiscount ? '✕ İptal' : '＋ Yeni Preset'}</Text>
                </TouchableOpacity>
              </View>

              {isAddingDiscount && (
                <View style={[styles.addPrinterCard, { backgroundColor: COLORS.success + '10' }]}>
                  <PrinterInput label="Preset Adı" value={newDiscountForm.name} onChangeText={(v) => setNewDiscountForm(f => ({...f, name: v}))} placeholder="ör: Personel" />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    {['percent', 'amount'].map(t => (
                      <TouchableOpacity key={t} style={[styles.catChip, newDiscountForm.type === t && { backgroundColor: COLORS.success, borderColor: COLORS.success }]} onPress={() => setNewDiscountForm(f => ({...f, type: t}))}>
                        <Text style={[styles.catChipText, newDiscountForm.type === t && { color: '#fff' }]}>{t === 'percent' ? 'Yüzde (%)' : 'Tutar (₺)'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <PrinterInput label={newDiscountForm.type === 'percent' ? 'Yüzde Oranı (%)' : 'İndirim Tutarı (₺)'} value={newDiscountForm.value} onChangeText={(v) => setNewDiscountForm(f => ({...f, value: v}))} placeholder="ör: 20" keyboardType="numeric" />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddDiscount}>
                    <Text style={styles.saveBtnText}>✓ Preseti Kaydet</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                {discountPresets.map(dp => (
                  <View key={dp.id} style={[styles.printerCard, { flex: 0, minWidth: 160, marginBottom: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{dp.name}</Text>
                      <TouchableOpacity onPress={() => removeDiscountPreset(dp.id)}>
                        <Text style={{ color: COLORS.danger }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: COLORS.success, fontWeight: '800', marginTop: 4 }}>
                      {dp.type === 'percent' ? `%${dp.value}` : `${dp.value} ₺`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STOK YÖNETİMİ */}
        {activeTab === 'stock' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Stok Durumu & Ekleme</Text>
              <TouchableOpacity style={styles.addPrinterBtn} onPress={() => setIsAddingIngredient(!isAddingIngredient)}>
                <Text style={styles.addPrinterBtnText}>{isAddingIngredient ? '✕ İptal' : '＋ Yeni Kalem'}</Text>
              </TouchableOpacity>
            </View>

            {isAddingIngredient && (
              <View style={styles.addPrinterCard}>
                <Text style={styles.addPrinterTitle}>🆕 Yeni Stok Kalemi</Text>
                <PrinterInput label="Stok Adı" value={newIngredientForm.name} onChangeText={(v) => setNewIngredientForm(f => ({...f, name: v}))} placeholder="ör: Domates" />
                <PrinterInput label="Birim" value={newIngredientForm.unit} onChangeText={(v) => setNewIngredientForm(f => ({...f, unit: v}))} placeholder="ör: kg, gr, adet" />
                <PrinterInput label="Kritik Seviye Uyarısı" value={newIngredientForm.criticalLevel} onChangeText={(v) => setNewIngredientForm(f => ({...f, criticalLevel: v}))} placeholder="ör: 50" keyboardType="numeric" />
                <TouchableOpacity style={{ flexDirection: 'row', marginTop: 8 }} onPress={handleAddNewIngredient}>
                  <View style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>✓ Kaydet</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={[styles.searchInput, { marginLeft: 0, marginBottom: 16 }]}
              placeholder="Stok ara..."
              placeholderTextColor={COLORS.textMuted}
              value={stockSearchQuery}
              onChangeText={setStockSearchQuery}
            />
            {ingredients.filter(ing => !stockSearchQuery || ing.name.toLowerCase().includes(stockSearchQuery.toLowerCase())).map(ing => {
              const isCritical = ing.currentQty <= ing.criticalLevel;
              return (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.stockRow, isCritical && { borderColor: COLORS.danger }, selectedIngredient === ing.id && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' }]}
                  onPress={() => setSelectedIngredient(ing.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{isCritical ? '⚠️ ' : ''}{ing.name}</Text>
                    <Text style={styles.stockDetail}>Mevcut: {ing.currentQty} {ing.unit} | Kritik: {ing.criticalLevel} {ing.unit}</Text>
                  </View>
                  <View style={[styles.stockBar, { width: 100 }]}>
                    <View style={[styles.stockBarFill, { width: `${Math.min(100, (ing.currentQty / (ing.criticalLevel * 3)) * 100)}%`, backgroundColor: isCritical ? COLORS.danger : COLORS.success }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedIngredient && (
              <View style={styles.addStockRow}>
                <TextInput style={styles.input} value={stockAddQty} onChangeText={setStockAddQty} placeholder="Miktar girin" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
                <TouchableOpacity style={styles.applyBtn} onPress={handleAddStock}>
                  <Text style={styles.applyBtnText}>Stok Ekle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* YAZICILAR */}
        {activeTab === 'printers' && (
          <View>
            <View style={styles.printerHeader}>
              <View>
                <Text style={styles.sectionTitle}>Yazıcı Yapılandırması</Text>
                <Text style={styles.sectionSub}>Yazıcıları düzenleyin, ekleyin veya silin.</Text>
              </View>
              <TouchableOpacity
                style={styles.addPrinterBtn}
                onPress={() => setIsAddingPrinter(!isAddingPrinter)}
              >
                <Text style={styles.addPrinterBtnText}>{isAddingPrinter ? '✕ İptal' : '＋ Yeni Yazıcı'}</Text>
              </TouchableOpacity>
            </View>

            {/* Yeni Yazıcı Ekleme Formu */}
            {isAddingPrinter && (
              <View style={styles.addPrinterCard}>
                <Text style={styles.addPrinterTitle}>🆕 Yeni Yazıcı Ekle</Text>
                <PrinterInput label="Yazıcı Adı" value={newPrinterForm.name} onChangeText={(v) => setNewPrinterForm(f => ({...f, name: v}))} placeholder="ör: Bahçe Yazıcısı" />
                <PrinterInput label="IP Adresi" value={newPrinterForm.ip} onChangeText={(v) => setNewPrinterForm(f => ({...f, ip: v}))} placeholder="ör: 192.168.1.103" />
                <PrinterInput label="Port" value={newPrinterForm.port} onChangeText={(v) => setNewPrinterForm(f => ({...f, port: v}))} placeholder="9100" keyboardType="numeric" />
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddPrinter}>
                  <Text style={styles.saveBtnText}>✓ Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Yazıcı Listesi */}
            {printers.map(printer => (
              <View key={printer.id} style={styles.printerCard}>
                {editingPrinterId === printer.id ? (
                  /* Düzenleme Modu */
                  <View>
                    <Text style={styles.editTitle}>✏️ Düzenleniyor</Text>
                    <PrinterInput label="Yazıcı Adı" value={editForm.name} onChangeText={(v) => setEditForm(f => ({...f, name: v}))} placeholder="Yazıcı adı" />
                    <PrinterInput label="IP Adresi" value={editForm.ip} onChangeText={(v) => setEditForm(f => ({...f, ip: v}))} placeholder="IP adresi" />
                    <PrinterInput label="Port" value={editForm.port} onChangeText={(v) => setEditForm(f => ({...f, port: v}))} placeholder="Port" keyboardType="numeric" />
                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                        <Text style={styles.saveBtnText}>✓ Kaydet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingPrinterId(null)}>
                        <Text style={styles.cancelBtnText}>İptal</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Görüntüleme Modu */
                  <View>
                    <View style={styles.printerCardHeader}>
                      <Text style={styles.printerName}>🖨️ {printer.name}</Text>
                      <View style={styles.printerActions}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => startEditing(printer)}>
                          <Text style={styles.editBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePrinter(printer)}>
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.printerDetail}>IP: {printer.ip}:{printer.port}</Text>
                    <Text style={styles.printerCategories}>
                      Bağlı kategoriler: {categories.filter(c => c.printerRoute === printer.id).map(c => c.name).join(', ') || 'Yok'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* RAPORLAR */}
        {activeTab === 'reports' && (
          <View>
            <View style={styles.printerHeader}>
              <View>
                <Text style={styles.sectionTitle}>Satış Raporları</Text>
                <Text style={styles.sectionSub}>İşlemleri inceleyin ve gün sonu alın.</Text>
              </View>
              <TouchableOpacity style={styles.addPrinterBtn} onPress={handleTakeZReport}>
                <Text style={styles.addPrinterBtnText}>🏁 Gün Sonu Al</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.searchInput, { marginLeft: 0, marginBottom: 16 }]}
              placeholder="Masa veya ödeme yöntemi ara..."
              placeholderTextColor={COLORS.textMuted}
              value={reportSearchQuery}
              onChangeText={setReportSearchQuery}
            />

            <Text style={styles.catHeader}>📊 Aktif İşlemler (Z-Raporu Öncesi)</Text>
            
            {/* Masaya Göre Özet */}
            <View style={{ backgroundColor: COLORS.primary + '05', padding: 16, borderRadius: BORDER_RADIUS.lg, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '20' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 10 }}>🪑 Masaya Göre Özet</Text>
              {Object.entries(
                transactions
                  .filter(t => !t.isClosed)
                  .reduce((acc, t) => {
                    acc[t.tableName] = (acc[t.tableName] || 0) + t.total;
                    return acc;
                  }, {})
              ).map(([name, total]) => (
                <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: COLORS.textPrimary }}>{name}:</Text>
                  <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{total.toFixed(2)} ₺</Text>
                </View>
              ))}
            </View>

            {transactions
              .filter(t => !t.isClosed)
              .filter(t => !reportSearchQuery || t.tableName.toLowerCase().includes(reportSearchQuery.toLowerCase()) || t.paymentMethod.toLowerCase().includes(reportSearchQuery.toLowerCase()))
              .map(txn => (
                <View key={txn.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{txn.tableName}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{txn.time} | {txn.userName}</Text>
                  </View>
                  <Text style={[styles.menuPrice, { color: txn.paymentMethod === 'cash' ? COLORS.success : COLORS.primary, width: 150 }]}>
                    {txn.total.toFixed(2)} ₺ ({txn.paymentMethod === 'cash' ? 'Nakit' : txn.paymentMethod === 'card' ? 'Kart' : 'Kupon'})
                  </Text>
                </View>
              ))}

            {zReports.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.catHeader}>📜 Geçmiş Z-Raporları</Text>
                {zReports.map(z => (
                  <View key={z.id} style={[styles.printerCard, { backgroundColor: COLORS.surfaceLight }]}>
                    <View style={styles.printerCardHeader}>
                      <Text style={styles.printerName}>📅 {z.date}</Text>
                      <Text style={{ fontWeight: '800', color: COLORS.success }}>{z.totalSales.toFixed(2)} ₺</Text>
                    </View>
                    <Text style={styles.printerDetail}>Kapatan: {z.closedBy} | İşlem: {z.transactionCount}</Text>
                    <Text style={styles.printerDetail}>Nakit: {z.cashTotal.toFixed(2)} ₺ | Kart: {z.cardTotal.toFixed(2)} ₺</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* KAYITLAR (AUDIT LOGS) */}
        {activeTab === 'logs' && (
          <View>
            <Text style={styles.sectionTitle}>Sistem Kayıtları</Text>
            <Text style={styles.sectionSub}>Yapılan tüm işlemlerin tarihsel kaydı.</Text>

            <TextInput
              style={[styles.searchInput, { marginLeft: 0, marginBottom: 16 }]}
              placeholder="İşlem veya kullanıcı ara..."
              placeholderTextColor={COLORS.textMuted}
              value={logSearchQuery}
              onChangeText={setLogSearchQuery}
            />

            <View style={{ maxHeight: 600 }}>
              {logs
                .filter(l => !logSearchQuery || l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) || l.details.toLowerCase().includes(logSearchQuery.toLowerCase()) || l.userName.toLowerCase().includes(logSearchQuery.toLowerCase()))
                .map(log => (
                  <View key={log.id} style={[styles.menuRow, { padding: 10, marginBottom: 4 }]}>
                    <View style={{ width: 60 }}>
                      <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{log.time}</Text>
                      <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{log.date}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: COLORS.primary }}>{log.action}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.textPrimary }}>{log.details}</Text>
                      <Text style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}>Kullanıcı: {log.userName}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* PERSONEL YÖNETİMİ */}
        {activeTab === 'staff' && (
          <View>
            <View style={styles.printerHeader}>
              <View>
                <Text style={styles.sectionTitle}>Personel & İK</Text>
                <Text style={styles.sectionSub}>Personel listesi, görevler ve talepler.</Text>
              </View>
              <TouchableOpacity style={styles.addPrinterBtn} onPress={() => { setIsAddingStaff(!isAddingStaff); setEditingStaffId(null); setNewStaffForm({ name: '', role: roles[0] || 'waiter', salary: '30000' }); }}>
                <Text style={styles.addPrinterBtnText}>{isAddingStaff ? '✕ İptal' : '＋ Yeni Personel'}</Text>
              </TouchableOpacity>
            </View>

            {isAddingStaff && (
              <View style={styles.addPrinterCard}>
                <Text style={styles.addPrinterTitle}>{editingStaffId ? '✏️ Personel Düzenle' : '🆕 Yeni Personel Tanımla'}</Text>
                <PrinterInput label="Ad Soyad" value={newStaffForm.name} onChangeText={(v) => setNewStaffForm(f => ({...f, name: v}))} placeholder="ör: Can Demir" />
                <PrinterInput label="Maaş (₺)" value={newStaffForm.salary} onChangeText={(v) => setNewStaffForm(f => ({...f, salary: v}))} placeholder="30000" keyboardType="numeric" />
                <Text style={styles.printerInputLabel}>Rol Seç</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  {roles.map(r => (
                    <TouchableOpacity 
                      key={r} 
                      style={[styles.catChip, newStaffForm.role === r && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]} 
                      onPress={() => setNewStaffForm(f => ({...f, role: r}))}
                    >
                      <Text style={[styles.catChipText, newStaffForm.role === r && { color: '#fff' }]}>{r.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={[styles.catChip, { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]} 
                    onPress={() => setIsAddingRole(!isAddingRole)}
                  >
                    <Text style={[styles.catChipText, { color: COLORS.success }]}>＋ Yeni Rol</Text>
                  </TouchableOpacity>
                </View>

                {isAddingRole && (
                  <View style={{ marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8 }}>
                    <PrinterInput label="Rol Adı" value={newRoleName} onChangeText={setNewRoleName} placeholder="ör: Mutfak" />
                    <TouchableOpacity style={[styles.saveBtn, { height: 40 }]} onPress={handleAddRole}>
                      <Text style={styles.saveBtnText}>Rolü Ekle</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={[styles.saveBtn, { marginTop: 16 }]} onPress={handleAddStaff}>
                  <Text style={styles.saveBtnText}>✓ {editingStaffId ? 'Değişiklikleri Kaydet' : 'Personeli Kaydet'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Görev Atama */}
            <View style={[styles.addPrinterCard, { marginTop: 20, backgroundColor: COLORS.secondary + '10' }]}>
              <Text style={[styles.addPrinterTitle, { color: COLORS.secondary }]}>📝 Görev Ata</Text>
              <Text style={styles.printerInputLabel}>Personel Seç</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {staff.map(s => (
                    <TouchableOpacity 
                      key={s.id} 
                      style={[styles.catChip, taskForm.staffId === s.id && { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary }]} 
                      onPress={() => setTaskForm(f => ({...f, staffId: s.id}))}
                    >
                      <Text style={[styles.catChipText, taskForm.staffId === s.id && { color: '#fff' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <PrinterInput label="Görev Başlığı" value={taskForm.title} onChangeText={(v) => setTaskForm(f => ({...f, title: v}))} placeholder="ör: Masa 5'i temizle" />
              <PrinterInput label="Açıklama" value={taskForm.description} onChangeText={(v) => setTaskForm(f => ({...f, description: v}))} placeholder="Detaylar..." />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.secondary }]} onPress={handleAssignTask}>
                <Text style={styles.saveBtnText}>✓ Görevi Ata</Text>
              </TouchableOpacity>
            </View>

            {/* Talepler */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.catHeader}>📩 Bekleyen Talepler</Text>
              {requests.filter(r => r.status === 'pending').map(req => (
                <View key={req.id} style={styles.printerCard}>
                  <View style={styles.printerCardHeader}>
                    <Text style={styles.printerName}>{staff.find(s => s.id === req.staffId)?.name}</Text>
                    <Text style={{ fontWeight: '700', color: COLORS.warning }}>{req.type === 'leave' ? 'İzin' : 'Geç Giriş'}</Text>
                  </View>
                  <Text style={styles.printerDetail}>Sebep: {req.reason}</Text>
                  <Text style={styles.printerDetail}>Tarih: {req.date}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity style={[styles.editBtn, { flex: 1, backgroundColor: COLORS.success + '20' }]} onPress={() => handleUpdateRequest(req.id, 'approved')}>
                      <Text style={[styles.editBtnText, { color: COLORS.success }]}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.editBtn, { flex: 1, backgroundColor: COLORS.danger + '20' }]} onPress={() => handleUpdateRequest(req.id, 'rejected')}>
                      <Text style={[styles.editBtnText, { color: COLORS.danger }]}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {requests.filter(r => r.status === 'pending').length === 0 && <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginVertical: 20 }}>Bekleyen talep yok.</Text>}
            </View>

            {/* Vardiya Yönetimi */}
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.catHeader}>📅 Vardiya Planı</Text>
                <TouchableOpacity onPress={() => setIsAddingShift(!isAddingShift)}>
                  <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{isAddingShift ? 'İptal' : '＋ Vardiya Ekle'}</Text>
                </TouchableOpacity>
              </View>

              {isAddingShift && (
                <View style={[styles.addPrinterCard, { backgroundColor: COLORS.primary + '05' }]}>
                  <Text style={styles.printerInputLabel}>Personel</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {staff.map(s => (
                        <TouchableOpacity 
                          key={s.id} 
                          style={[styles.catChip, newShiftForm.staffId === s.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]} 
                          onPress={() => setNewShiftForm(f => ({...f, staffId: s.id}))}
                        >
                          <Text style={[styles.catChipText, newShiftForm.staffId === s.id && { color: '#fff' }]}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <PrinterInput label="Tarih" value={newShiftForm.date} onChangeText={(v) => setNewShiftForm(f => ({...f, date: v}))} placeholder="örn: 20.05.2024" />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}><PrinterInput label="Başlangıç" value={newShiftForm.startTime} onChangeText={(v) => setNewShiftForm(f => ({...f, startTime: v}))} /></View>
                    <View style={{ flex: 1 }}><PrinterInput label="Bitiş" value={newShiftForm.endTime} onChangeText={(v) => setNewShiftForm(f => ({...f, endTime: v}))} /></View>
                  </View>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddShift}>
                    <Text style={styles.saveBtnText}>✓ Vardiyayı Kaydet</Text>
                  </TouchableOpacity>
                </View>
              )}

              {shifts.map(sh => (
                <View key={sh.id} style={styles.miniCard}>
                  <Text style={styles.miniCardText}>{staff.find(s => s.id === sh.staffId)?.name} - {sh.date}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{sh.startTime} - {sh.endTime}</Text>
                </View>
              ))}
            </View>

            {/* Maaş & Puantaj Özet */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.catHeader}>💰 Puantaj & Maaş Özeti (Aylık Tahmini)</Text>
              {staff.map(person => (
                <View key={person.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{person.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Saatlik: {person.hourlyRate} ₺ | Aylık Sabit: {person.salary} ₺</Text>
                  </View>
                  <Text style={{ fontWeight: '800', color: COLORS.success }}>{person.salary.toLocaleString()} ₺</Text>
                </View>
              ))}
            </View>

            {/* Aktif Personel Listesi */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.catHeader}>👥 Personel Listesi & Yönetimi</Text>
              {staff.map(person => (
                <View key={person.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{person.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{person.role.toUpperCase()} | Maaş: {person.salary} ₺</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View style={[styles.legendDot, { backgroundColor: attendance.find(a => a.staffId === person.id && a.type === 'IN') ? COLORS.success : COLORS.textMuted }]} />
                    
                    <TouchableOpacity style={styles.editBtn} onPress={() => startEditingStaff(person)}>
                      <Text style={styles.editBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteStaff(person)}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Toplu Fiyat Güncelleme Modalı */}
      <Modal visible={showBulkModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Toplu Fiyat Güncelleme</Text>
            <Text style={styles.modalSubtitle}>
              "{categories.find(c => c.id === selectedCatForBulk)?.name}" kategorisindeki tüm ürünlere %{bulkPercent} {parseFloat(bulkPercent) > 0 ? 'zam' : 'indirim'} uygulanacak. Emin misiniz?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBulkModal(false)}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmBulkUpdate}>
                <Text style={styles.modalConfirmText}>Uygula</Text>
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
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: 24, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceLight },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 24 },
  sectionTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  sectionSub: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchInput: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.textPrimary, flex: 1, marginLeft: 16, borderWidth: 1, borderColor: COLORS.border },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  catChipText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  bulkRow: { marginBottom: 20 },
  bulkInputRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16, paddingVertical: 12, color: COLORS.textPrimary, fontSize: FONT_SIZES.md, borderWidth: 1, borderColor: COLORS.border },
  applyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, borderRadius: BORDER_RADIUS.md, justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
  catHeader: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 14, borderRadius: BORDER_RADIUS.md, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  menuName: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  menuPrice: { fontSize: FONT_SIZES.md, color: COLORS.success, fontWeight: '700', width: 80, textAlign: 'right' },
  menuPrinter: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, width: 130, textAlign: 'right' },
  stockRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: BORDER_RADIUS.md, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  stockName: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '700' },
  stockDetail: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  stockBar: { height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceLight, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: 4 },
  addStockRow: { flexDirection: 'row', gap: 12, marginTop: 16 },

  // Yazıcı stilleri
  printerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  addPrinterBtn: { backgroundColor: COLORS.success, paddingHorizontal: 18, paddingVertical: 10, borderRadius: BORDER_RADIUS.md },
  addPrinterBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
  addPrinterCard: { backgroundColor: COLORS.success + '15', padding: 20, borderRadius: BORDER_RADIUS.lg, marginBottom: 16, borderWidth: 1, borderColor: COLORS.success + '40' },
  addPrinterTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.success, marginBottom: 14 },
  printerCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: BORDER_RADIUS.lg, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  printerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  printerName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  printerDetail: { fontSize: FONT_SIZES.md, color: COLORS.secondary, marginTop: 6, fontFamily: 'monospace' },
  printerCategories: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 8 },
  printerActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: COLORS.primary + '20', padding: 10, borderRadius: BORDER_RADIUS.md },
  editBtnText: { fontSize: 18 },
  deleteBtn: { backgroundColor: COLORS.danger + '20', padding: 10, borderRadius: BORDER_RADIUS.md },
  deleteBtnText: { fontSize: 18 },
  editTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary, marginBottom: 14 },
  printerInputGroup: { marginBottom: 12 },
  printerInputLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  printerInput: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.textPrimary, fontSize: FONT_SIZES.md, borderWidth: 1, borderColor: COLORS.border },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  saveBtn: { backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, alignItems: 'center', flex: 1 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
  cancelBtn: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZES.md },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: 30, width: 360, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  modalSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceLight },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
});

export default AdminScreen;
