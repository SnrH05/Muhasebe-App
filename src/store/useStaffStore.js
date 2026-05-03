// Staff Store - Personel, Vardiya, Devam Takibi ve Görev Yönetimi
import { create } from 'zustand';

export const useStaffStore = create((set, get) => ({
  staff: [
    { id: 'u1', name: 'Ahmet Yılmaz', role: 'admin', salary: 45000, hourlyRate: 250 },
    { id: 'u3', name: 'Ayşe Demir', role: 'waiter', salary: 30000, hourlyRate: 150 },
    { id: 'u4', name: 'Fatma Çelik', role: 'waiter', salary: 30000, hourlyRate: 150 },
  ],
  roles: ['admin', 'cashier', 'waiter'], // Dinamik roller
  shifts: [], // { id, staffId, startTime, endTime, date }
  attendance: [], // { id, staffId, type: 'IN'|'OUT', timestamp, locationOK: true, qrOK: true }
  tasks: [], // { id, staffId, title, description, status: 'pending'|'completed', photoUrl, completedAt }
  requests: [], // { id, staffId, type: 'leave'|'late', status: 'pending'|'approved'|'rejected', reason, date }
  settings: {
    checkInTolerance: 15, // dakika
    breakDuration: 45, // dakika
  },

  // Personel İşlemleri
  addStaff: (person) => set((state) => ({ staff: [...state.staff, { ...person, id: `u_${Date.now()}` }] })),
  updateStaff: (id, updates) => set((state) => ({ staff: state.staff.map(s => s.id === id ? { ...s, ...updates } : s) })),
  removeStaff: (id) => set((state) => ({ staff: state.staff.filter(s => s.id !== id) })),

  // Rol İşlemleri
  addRole: (role) => set((state) => ({ roles: [...state.roles, role.toLowerCase()] })),
  removeRole: (role) => set((state) => ({ roles: state.roles.filter(r => r !== role) })),

  // Vardiya İşlemleri
  addShift: (shift) => set((state) => ({ shifts: [...state.shifts, { ...shift, id: `sh_${Date.now()}` }] })),
  removeShift: (id) => set((state) => ({ shifts: state.shifts.filter(s => s.id !== id) })),

  // Devam Takibi
  checkIn: (staffId, location = true, qr = true) => {
    const entry = {
      id: `att_${Date.now()}`,
      staffId,
      type: 'IN',
      timestamp: new Date().toISOString(),
      locationOK: location,
      qrOK: qr
    };
    set((state) => ({ attendance: [entry, ...state.attendance] }));
    return entry;
  },
  
  checkOut: (staffId) => {
    const entry = {
      id: `att_${Date.now()}`,
      staffId,
      type: 'OUT',
      timestamp: new Date().toISOString()
    };
    set((state) => ({ attendance: [entry, ...state.attendance] }));
    return entry;
  },

  // Görev İşlemleri
  assignTask: (task) => set((state) => ({ tasks: [...state.tasks, { ...task, id: `tk_${Date.now()}`, status: 'pending' }] })),
  completeTask: (taskId, photoUrl) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'completed', photoUrl, completedAt: new Date().toISOString() } : t)
  })),

  // Talep İşlemleri
  addRequest: (req) => set((state) => ({ requests: [...state.requests, { ...req, id: `rq_${Date.now()}`, status: 'pending' }] })),
  updateRequestStatus: (id, status) => set((state) => ({
    requests: state.requests.map(r => r.id === id ? { ...r, status } : r)
  })),

  // Puantaj Hesaplama (Basit)
  calculatePayroll: (staffId, startDate, endDate) => {
    const { attendance, staff } = get();
    const person = staff.find(s => s.id === staffId);
    if (!person) return 0;

    // Belirli tarihler arasındaki giriş çıkışları filtrele
    // (Gerçek uygulamada saat farkları toplanır)
    const records = attendance.filter(a => a.staffId === staffId);
    // ... mantık ...
    return person.salary; // Şimdilik sabit
  }
}));
