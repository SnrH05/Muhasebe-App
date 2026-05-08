// Table Store - Masa Yönetimi
import { create } from 'zustand';

// Masa durumları
export const TABLE_STATUS = {
  EMPTY: 'empty',       // Boş (Yeşil)
  OCCUPIED: 'occupied', // Dolu (Kırmızı)
  BILL: 'bill',         // Hesap İstendi (Turuncu)
};

// Bölümler
const SECTIONS = [
  { id: 's1', name: 'Salon' },
  { id: 's2', name: 'Bahçe' },
  { id: 's3', name: 'Teras' },
];

// Başlangıç masaları
const INITIAL_TABLES = [
  // Salon
  { id: 't1', sectionId: 's1', name: 'Masa 1', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 50, y: 50 } },
  { id: 't2', sectionId: 's1', name: 'Masa 2', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 220, y: 50 } },
  { id: 't3', sectionId: 's1', name: 'Masa 3', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 390, y: 50 } },
  { id: 't4', sectionId: 's1', name: 'Masa 4', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 50, y: 210 } },
  { id: 't5', sectionId: 's1', name: 'Masa 5', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 220, y: 210 } },
  { id: 't6', sectionId: 's1', name: 'Masa 6', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 390, y: 210 } },
  // Bahçe
  { id: 't7', sectionId: 's2', name: 'B-1', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 50, y: 50 } },
  { id: 't8', sectionId: 's2', name: 'B-2', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 220, y: 50 } },
  { id: 't9', sectionId: 's2', name: 'B-3', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 390, y: 50 } },
  { id: 't10', sectionId: 's2', name: 'B-4', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 50, y: 210 } },
  // Teras
  { id: 't11', sectionId: 's3', name: 'T-1', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 50, y: 50 } },
  { id: 't12', sectionId: 's3', name: 'T-2', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 220, y: 50 } },
  { id: 't13', sectionId: 's3', name: 'T-3', status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0, position: { x: 390, y: 50 } },
];

export const useTableStore = create((set, get) => ({
  tables: INITIAL_TABLES,
  sections: SECTIONS,
  selectedSectionId: 's1',

  // Bölüm seçimi
  setSelectedSection: (sectionId) => set({ selectedSectionId: sectionId }),

  // Masaya sipariş ekleme (Garson yetkisi)
  addOrderToTable: (tableId, orderItems, waiterName) => set((state) => ({
    tables: state.tables.map(table => {
      if (table.id !== tableId) return table;
      const newOrder = {
        id: `ord_${Date.now()}`,
        items: orderItems,
        waiter: waiterName,
        time: new Date().toLocaleTimeString('tr-TR'),
        timestamp: Date.now(),
      };
      const newOrders = [...table.orders, newOrder];
      const totalAmount = newOrders.reduce((sum, ord) =>
        sum + ord.items.reduce((s, item) => s + item.price * item.quantity, 0), 0
      );
      return {
        ...table,
        status: TABLE_STATUS.OCCUPIED,
        orders: newOrders,
        totalAmount,
        paidAmount: table.paidAmount || 0,
      };
    }),
  })),

  // Masaya kısmi ödeme ekle
  addPaymentToTable: (tableId, amount) => set((state) => ({
    tables: state.tables.map(table =>
      table.id === tableId ? { ...table, paidAmount: (table.paidAmount || 0) + amount } : table
    )
  })),

  // Masadan sipariş iptal etme (Garson yetkisi)
  cancelOrderFromTable: (tableId, orderId) => set((state) => ({
    tables: state.tables.map(table => {
      if (table.id !== tableId) return table;
      
      const newOrders = table.orders.filter(ord => ord.id !== orderId);
      const totalAmount = newOrders.reduce((sum, ord) =>
        sum + ord.items.reduce((s, item) => s + item.price * item.quantity, 0), 0
      );
      
      return {
        ...table,
        status: newOrders.length === 0 ? TABLE_STATUS.EMPTY : table.status,
        orders: newOrders,
        totalAmount,
      };
    }),
  })),

  // Masa hesabını iste
  requestBill: (tableId) => set((state) => ({
    tables: state.tables.map(table =>
      table.id === tableId ? { ...table, status: TABLE_STATUS.BILL } : table
    ),
  })),

  // Masayı kapat (Ödeme sonrası)
  closeTable: (tableId) => set((state) => ({
    tables: state.tables.map(table =>
      table.id === tableId
        ? { ...table, status: TABLE_STATUS.EMPTY, orders: [], totalAmount: 0, paidAmount: 0 }
        : table
    ),
  })),

  // Masa ekleme (Sadece Admin)
  addTable: (sectionId, tableName) => set((state) => ({
    tables: [
      ...state.tables,
      {
        id: `t_${Date.now()}`,
        sectionId,
        name: tableName,
        status: TABLE_STATUS.EMPTY,
        orders: [],
        totalAmount: 0,
        paidAmount: 0,
        position: { x: 50, y: 50 },
      },
    ],
  })),

  // Masa konumunu güncelle
  moveTable: (tableId, x, y) => set((state) => ({
    tables: state.tables.map(t =>
      t.id === tableId ? { ...t, position: { x, y } } : t
    ),
  })),

  // Masa silme (Sadece Admin)
  removeTable: (tableId) => set((state) => ({
    tables: state.tables.filter(t => t.id !== tableId),
  })),

  // Masa ismi değiştirme (Sadece Admin)
  renameTable: (tableId, newName) => set((state) => ({
    tables: state.tables.map(t =>
      t.id === tableId ? { ...t, name: newName } : t
    ),
  })),

  // Masaları yeniden sırala
  reorderTables: (newTables) => set({ tables: newTables }),

  // Bölümdeki masaları getir
  getTablesBySection: (sectionId) => {
    return get().tables.filter(t => t.sectionId === (sectionId || get().selectedSectionId));
  },
}));
