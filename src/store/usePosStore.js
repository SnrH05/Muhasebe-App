// POS Store - Menü, Sepet, Sipariş ve Ödeme Yönetimi
import { create } from 'zustand';
import { DEFAULT_PRINTERS, PRINTERS } from '../theme';

// Kategoriler
const CATEGORIES = [
  { id: 'cat1', name: 'Sıcak İçecekler', color: '#ff7eb3', icon: '☕', printerRoute: PRINTERS.BARISTA.id },
  { id: 'cat2', name: 'Soğuk İçecekler', color: '#7eb3ff', icon: '🧊', printerRoute: PRINTERS.BARISTA.id },
  { id: 'cat3', name: 'Ana Yemekler', color: '#ffb37e', icon: '🍖', printerRoute: PRINTERS.KITCHEN.id },
  { id: 'cat4', name: 'Tatlılar', color: '#b37eff', icon: '🍰', printerRoute: PRINTERS.DESSERT.id },
  { id: 'cat5', name: 'Pizzalar', color: '#ff7e7e', icon: '🍕', printerRoute: PRINTERS.KITCHEN.id },
  { id: 'cat6', name: 'Salatalar', color: '#7effb3', icon: '🥗', printerRoute: PRINTERS.KITCHEN.id },
];

// Menü Kalemleri
const MENU_ITEMS = [
  // Sıcak İçecekler
  { id: 'm1', categoryId: 'cat1', name: 'Çay', price: 15, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm2', categoryId: 'cat1', name: 'Türk Kahvesi', price: 40, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm3', categoryId: 'cat1', name: 'Filtre Kahve', price: 45, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm4', categoryId: 'cat1', name: 'Latte', price: 55, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm5', categoryId: 'cat1', name: 'Cappuccino', price: 55, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm6', categoryId: 'cat1', name: 'Sıcak Çikolata', price: 50, printerRoute: PRINTERS.BARISTA.id },
  // Soğuk İçecekler
  { id: 'm7', categoryId: 'cat2', name: 'Ayran', price: 20, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm8', categoryId: 'cat2', name: 'Kola', price: 35, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm9', categoryId: 'cat2', name: 'Limonata', price: 40, printerRoute: PRINTERS.BARISTA.id },
  { id: 'm10', categoryId: 'cat2', name: 'Ice Tea', price: 35, printerRoute: PRINTERS.BARISTA.id },
  // Ana Yemekler
  { id: 'm11', categoryId: 'cat3', name: 'Hamburger Menü', price: 180, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm12', categoryId: 'cat3', name: 'Tavuk Şiş', price: 160, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm13', categoryId: 'cat3', name: 'Adana Kebap', price: 200, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm14', categoryId: 'cat3', name: 'Köfte Ekmek', price: 120, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm15', categoryId: 'cat3', name: 'Izgara Köfte', price: 170, printerRoute: PRINTERS.KITCHEN.id },
  // Tatlılar
  { id: 'm16', categoryId: 'cat4', name: 'Sufle', price: 90, printerRoute: PRINTERS.DESSERT.id },
  { id: 'm17', categoryId: 'cat4', name: 'Künefe', price: 110, printerRoute: PRINTERS.DESSERT.id },
  { id: 'm18', categoryId: 'cat4', name: 'Cheesecake', price: 95, printerRoute: PRINTERS.DESSERT.id },
  { id: 'm19', categoryId: 'cat4', name: 'Baklava', price: 85, printerRoute: PRINTERS.DESSERT.id },
  // Pizzalar
  { id: 'm20', categoryId: 'cat5', name: 'Margarita', price: 180, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm21', categoryId: 'cat5', name: 'Karışık Pizza', price: 220, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm22', categoryId: 'cat5', name: 'Sucuklu Pizza', price: 200, printerRoute: PRINTERS.KITCHEN.id },
  // Salatalar
  { id: 'm23', categoryId: 'cat6', name: 'Sezar Salata', price: 100, printerRoute: PRINTERS.KITCHEN.id },
  { id: 'm24', categoryId: 'cat6', name: 'Mevsim Salata', price: 70, printerRoute: PRINTERS.KITCHEN.id },
];

export const usePosStore = create((set, get) => ({
  categories: CATEGORIES,
  menuItems: MENU_ITEMS,
  printers: DEFAULT_PRINTERS,
  cart: [],
  selectedCategoryId: 'cat1',
  activeTableId: null,
  discountPresets: [
    { id: 'd1', name: 'Personel İndirimi', type: 'percent', value: 20 },
    { id: 'd2', name: 'Müdür İndirimi', type: 'percent', value: 100 },
    { id: 'd3', name: 'Adisyon İkramı', type: 'amount', value: 50 },
  ],

  // Kategori seçme
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),

  // Aktif masa seçme
  setActiveTable: (tableId) => set({ activeTableId: tableId }),

  // Sepete ürün ekleme
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(c => c.id === item.id);
    if (existing) {
      return {
        cart: state.cart.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        ),
      };
    }
    return { cart: [...state.cart, { ...item, quantity: 1 }] };
  }),

  // Sepetten ürün çıkarma
  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(c => c.id !== itemId),
  })),

  // Adet azaltma
  decreaseQuantity: (itemId) => set((state) => {
    const existing = state.cart.find(c => c.id === itemId);
    if (existing && existing.quantity > 1) {
      return {
        cart: state.cart.map(c =>
          c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        ),
      };
    }
    return { cart: state.cart.filter(c => c.id !== itemId) };
  }),

  // Sepeti temizle
  clearCart: () => set({ cart: [] }),

  // Toplam tutar
  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  // Toplam adet
  getCartItemCount: () => {
    return get().cart.reduce((total, item) => total + item.quantity, 0);
  },

  // Yazıcıya göre ürünleri grupla (3-yollu yazıcı yönlendirme)
  getItemsByPrinter: () => {
    const { cart } = get();
    const grouped = {};
    cart.forEach((item) => {
      const route = item.printerRoute || 'unknown';
      if (!grouped[route]) grouped[route] = [];
      grouped[route].push(item);
    });
    return grouped;
  },

  // Toplu fiyat güncelleme (Kategori bazlı zam/indirim)
  bulkPriceUpdate: (categoryId, multiplier) => set((state) => ({
    menuItems: state.menuItems.map(item =>
      item.categoryId === categoryId
        ? { ...item, price: Math.round(item.price * multiplier) }
        : item
    ),
  })),

  // Yazıcı CRUD işlemleri
  addPrinter: (printer) => set((state) => ({
    printers: [...state.printers, { ...printer, id: `printer_${Date.now()}` }],
  })),

  updatePrinter: (printerId, updates) => set((state) => ({
    printers: state.printers.map(p =>
      p.id === printerId ? { ...p, ...updates } : p
    ),
  })),

  removePrinter: (printerId) => set((state) => ({
    printers: state.printers.filter(p => p.id !== printerId),
    // Silinen yazıcıya bağlı kategorilerin route'unu temizle
    categories: state.categories.map(c =>
      c.printerRoute === printerId ? { ...c, printerRoute: null } : c
    ),
    menuItems: state.menuItems.map(m =>
      m.printerRoute === printerId ? { ...m, printerRoute: null } : m
    ),
  })),

  // Kategori CRUD işlemleri
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, { ...category, id: category.id || `cat_${Date.now()}` }],
  })),

  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id),
    menuItems: state.menuItems.filter(m => m.categoryId !== id) // Kategori silinince içindeki ürünleri de siliyoruz
  })),

  // Menüye yeni ürün ekleme
  addMenuItem: (item) => set((state) => ({
    menuItems: [...state.menuItems, { ...item, id: item.id || `m_${Date.now()}` }],
  })),

  // Menü ürününü güncelleme
  updateMenuItem: (id, updates) => set((state) => ({
    menuItems: state.menuItems.map(m => m.id === id ? { ...m, ...updates } : m)
  })),

  // Menü ürününü favoriye ekle/çıkar
  toggleFavoriteMenuItem: (id) => set((state) => ({
    menuItems: state.menuItems.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)
  })),

  // İndirim Preset İşlemleri
  addDiscountPreset: (preset) => set((state) => ({
    discountPresets: [...state.discountPresets, { ...preset, id: `dp_${Date.now()}` }]
  })),

  removeDiscountPreset: (id) => set((state) => ({
    discountPresets: state.discountPresets.filter(dp => dp.id !== id)
  })),
}));
