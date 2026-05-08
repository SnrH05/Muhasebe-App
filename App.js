// Ana Navigasyon Yapısı
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from './src/theme';
import { useAuthStore } from './src/store/useAuthStore';

// Ekranlar
import LoginScreen from './src/screens/LoginScreen';
import PosScreen from './src/screens/PosScreen';
import TablesScreen from './src/screens/TablesScreen';
import TableOrderScreen from './src/screens/TableOrderScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AdminScreen from './src/screens/AdminScreen';
import StaffPortalScreen from './src/screens/StaffPortalScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab ikonları
const tabIcons = {
  Masalar: '🪑',
  POS: '💰',
  Raporlar: '📊',
  Yönetim: '⚙️',
  Görevler: '📝',
};

// Alt Tab Navigasyon
function MainTabs() {
  const { currentUser, isAdmin, isWaiter, logout } = useAuthStore();
  const admin = isAdmin();
  const waiter = isWaiter();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 75, // Biraz daha yüksek yapalım çerçeveler sığsın
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          marginHorizontal: 8,
          marginVertical: 2,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: COLORS.border,
          backgroundColor: 'rgba(255,255,255,0.03)',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginBottom: 2 },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6, marginBottom: 2 }}>
            {tabIcons[route.name] || '📋'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Masalar" component={TablesScreen} />
      {!waiter && <Tab.Screen name="POS" component={PosScreen} />}
      {!waiter && <Tab.Screen name="Raporlar" component={ReportsScreen} />}
      {admin && <Tab.Screen name="Yönetim" component={AdminScreen} />}
      <Tab.Screen name="Görevler" component={StaffPortalScreen} />
    </Tab.Navigator>
  );
}

// Ana Stack Navigasyon
export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TableOrder" component={TableOrderScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
