import { useAuth } from '@/lib/auth-context';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DashboardGridItem } from '../components/dashboard/DashboardGridItem';

// --- Config Sederhana (Menu Profil dihapus dari sini) ---
// Kita bisa simpan config ini di file terpisah (misal: lib/menu-config.ts) agar lebih clean
const MENU_ITEMS = {
  admin: [
    { title: 'Analytics', icon: 'bar-chart-2' },
    { title: 'Users', icon: 'users' },
    { title: 'Produk', icon: 'package' },
    { title: 'Sistem', icon: 'settings' },
  ],
  user: [
    { title: 'Pesanan', icon: 'shopping-bag' },
    { title: 'Voucher', icon: 'gift' },
    { title: 'Favorit', icon: 'heart' },
    { title: 'Bantuan', icon: 'help-circle' },
  ],
};

export default function HomeScreen() {
  const { userData } = useAuth();
  
  const role = userData?.role || 'user';
  // Fallback ke array kosong jika role tidak dikenali
  const menuItems = MENU_ITEMS[role as keyof typeof MENU_ITEMS] || [];

  // Theme Helpers
  const isUser = role === 'user';
  const themeColor = isUser ? '#2563eb' : '#ef4444';
  const bgLight = isUser ? 'bg-blue-50' : 'bg-red-50';
  const textPrimary = isUser ? 'text-blue-600' : 'text-red-600';

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-6 rounded-b-[30px] shadow-sm mb-8">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400 font-medium text-sm">Selamat Datang,</Text>
            <Text className={`text-2xl font-extrabold ${textPrimary}`}>
              {userData?.name || 'User'}
            </Text>
          </View>
          <View className={`w-10 h-10 rounded-full ${bgLight} items-center justify-center`}>
            <Feather name={isUser ? "smile" : "shield"} size={20} color={themeColor} />
          </View>
        </View>

        {/* Banner / Info Singkat */}
        <View className={`mt-6 p-4 rounded-xl ${isUser ? 'bg-blue-600' : 'bg-red-600'}`}>
          <Text className="text-white font-bold text-lg">
            {isUser ? 'Belanja Lebih Hemat!' : 'Status Sistem Aman'}
          </Text>
          <Text className="text-white/80 text-xs mt-1">
            {isUser ? 'Cek promo terbaru hari ini.' : 'Semua layanan berjalan normal.'}
          </Text>
        </View>
      </View>

      {/* Grid Menu */}
      <View className="px-6 pb-20">
        <Text className="text-lg font-bold text-gray-800 mb-4">Fitur Utama</Text>
        <View className="flex-row flex-wrap justify-between">
          {menuItems.map((item: any, index: number) => (
            <DashboardGridItem
              key={index}
              title={item.title}
              icon={item.icon}
              themeColor={themeColor}
              bgAccent={bgLight}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}