// Audit Log Store - İşlem Geçmişi ve Raporlama
import { create } from 'zustand';

export const useAuditStore = create((set, get) => ({
  logs: [],
  transactions: [],
  zReports: [], // Gün sonu raporları geçmişi
  dailySales: 0,
  dailyTransactionCount: 0,

  addLog: (action, details, userId, userName) => set((state) => ({
    logs: [{
      id: `log_${Date.now()}`,
      action,
      details,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('tr-TR'),
      date: new Date().toLocaleDateString('tr-TR'),
    }, ...state.logs],
  })),

  addTransaction: (tableId, tableName, items, total, paymentMethod, userId, userName, discount = 0) =>
    set((state) => ({
      transactions: [{
        id: `txn_${Date.now()}`,
        tableId, tableName, items, total, paymentMethod,
        userId, userName,
        discount, // İndirim tutarı
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('tr-TR'),
        date: new Date().toLocaleDateString('tr-TR'),
        isClosed: false, // Gün sonu alınana kadar açık
      }, ...state.transactions],
      dailySales: state.dailySales + total,
      dailyTransactionCount: state.dailyTransactionCount + 1,
    })),

  // Güncel aktif (kapatılmamış) rapor özeti
  getXReport: () => {
    const { transactions } = get();
    const openTxns = transactions.filter(t => !t.isClosed);
    const total = openTxns.reduce((s, t) => s + t.total, 0);
    const cashTotal = openTxns.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + t.total, 0);
    const cardTotal = openTxns.filter(t => t.paymentMethod === 'card').reduce((s, t) => s + t.total, 0);
    const voucherTotal = openTxns.filter(t => t.paymentMethod === 'meal_voucher').reduce((s, t) => s + t.total, 0);
    
    return { 
      totalSales: total, 
      transactionCount: openTxns.length, 
      cashTotal, 
      cardTotal, 
      voucherTotal,
      transactions: openTxns 
    };
  },

  // Manuel Gün Sonu Al (Z-Raporu)
  takeZReport: (userId, userName) => {
    const report = get().getXReport();
    if (report.transactionCount === 0) return null;

    const zReport = {
      id: `z_${Date.now()}`,
      ...report,
      type: 'Z_REPORT',
      closedAt: new Date().toISOString(),
      closedBy: userName,
      date: new Date().toLocaleDateString('tr-TR'),
    };

    set((state) => ({
      zReports: [zReport, ...state.zReports],
      // Mevcut işlemleri kapatılmış olarak işaretle
      transactions: state.transactions.map(t => ({ ...t, isClosed: true })),
      dailySales: 0,
      dailyTransactionCount: 0,
    }));

    get().addLog('Z_REPORT_TAKEN', `Gün sonu alındı. Toplam: ${zReport.totalSales} ₺`, userId, userName);
    return zReport;
  },

  resetDaily: () => set({ dailySales: 0, dailyTransactionCount: 0 }),
}));
