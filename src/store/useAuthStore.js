// Auth Store - Personel Giriş ve Yetkilendirme (RBAC)
import { create } from 'zustand';
import { ROLES } from '../theme';

// Demo kullanıcılar
const MOCK_USERS = [
  { id: 'u1', name: 'Ahmet Yılmaz', role: ROLES.ADMIN, pinCode: '1234' },
  { id: 'u2', name: 'Mehmet Kaya', role: ROLES.CASHIER, pinCode: '5678' },
  { id: 'u3', name: 'Ayşe Demir', role: ROLES.WAITER, pinCode: '1111' },
  { id: 'u4', name: 'Fatma Çelik', role: ROLES.WAITER, pinCode: '2222' },
];

export const useAuthStore = create((set, get) => ({
  currentUser: null,
  users: MOCK_USERS,
  isAuthenticated: false,

  // PIN ile giriş
  login: (pinCode) => {
    const user = get().users.find(u => u.pinCode === pinCode);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return { success: true, user };
    }
    return { success: false, error: 'Geçersiz PIN kodu' };
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  // Yetki kontrol fonksiyonu
  hasPermission: (requiredRole) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    if (currentUser.role === ROLES.ADMIN) return true; // Admin her şeyi yapabilir
    return currentUser.role === requiredRole;
  },

  isAdmin: () => get().currentUser?.role === ROLES.ADMIN,
  isWaiter: () => get().currentUser?.role === ROLES.WAITER,
  isCashier: () => get().currentUser?.role === ROLES.CASHIER,
}));
