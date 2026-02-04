import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/auth-utils';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Import Component Baru
import { DashboardGridItem } from './components/dashboard/DashboardGridItem';

// --- Tipe & Config (Tetap Sama) ---
type IconName = keyof typeof Feather.glyphMap;

interface MenuItem {
  title: string;
  icon: IconName;
  action?: () => void;
}

interface DashboardConfig {
  greeting: string;
  themeColor: string;
  primaryColor: string;
  bgLight: string;
  headerIcon: IconName;
  menuItems: MenuItem[];
}

const ROLE_CONFIG: Record<UserRole, DashboardConfig> = {
  admin: {
    greeting: 'Admin Panel',
    themeColor: '#ef4444', 
    primaryColor: 'text-red-600',
    bgLight: 'bg-red-50',
    headerIcon: 'shield',
    menuItems: [
      { title: 'Analytics', icon: 'bar-chart-2' },
      { title: 'Users', icon: 'users' },
      { title: 'Produk', icon: 'package' },
      { title: 'Sistem', icon: 'settings' },
      { title: 'Laporan', icon: 'file-text' },
      { title: 'Notifikasi', icon: 'bell' },
    ]
  },
  user: {
    greeting: 'Halo,',
    themeColor: '#2563eb', 
    primaryColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    headerIcon: 'smile',
    menuItems: [
      { title: 'Profil', icon: 'user' },
      { title: 'Pesanan', icon: 'shopping-bag' },
      { title: 'Voucher', icon: 'gift' },
      { title: 'Favorit', icon: 'heart' },
      { title: 'Alamat', icon: 'map-pin' },
      { title: 'Bantuan', icon: 'help-circle' },
    ]
  }
};

// --- Main Component ---
export default function UnifiedDashboard() {
  const { userData, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert('Konfirmasi', 'Keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Keluar', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        } 
      }
    ]);
  };

  const currentRole = userData?.role || 'user';
  const config = ROLE_CONFIG[currentRole];

  return (
    <ScrollView 
      className="flex-1 bg-gray-50" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header Section */}
      <View className="bg-white px-6 pt-14 pb-8 rounded-b-[30px] shadow-sm mb-8">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-400 font-medium text-sm mb-1">{config.greeting}</Text>
            <Text className={`text-3xl font-extrabold ${config.primaryColor}`}>
              {userData?.name || 'User'}
            </Text>
          </View>
          <View className={`w-12 h-12 rounded-full ${config.bgLight} items-center justify-center`}>
            <Feather name={config.headerIcon} size={24} color={config.themeColor} />
          </View>
        </View>

        {/* Mini Info Row */}
        <View className="flex-row space-x-3">
          <View className={`flex-1 rounded-2xl p-4 ${config.bgLight} flex-row items-center space-x-3`}>
             <Feather name="shield" size={18} color={config.themeColor} />
             <View>
               <Text className="text-gray-500 text-[10px] uppercase font-bold">Role</Text>
               <Text className={`font-bold capitalize ${config.primaryColor}`}>{userData?.role}</Text>
             </View>
          </View>
          <View className="flex-1 rounded-2xl p-4 bg-gray-100 flex-row items-center space-x-3">
             <Feather name="mail" size={18} color="#6b7280" />
             <View>
               <Text className="text-gray-500 text-[10px] uppercase font-bold">Email</Text>
               <Text className="text-gray-800 font-bold text-xs" numberOfLines={1}>
                 {userData?.email?.split('@')[0]}
               </Text>
             </View>
          </View>
        </View>
      </View>

      {/* Grid Menu Section */}
      <View className="px-6">
        <Text className="text-lg font-bold text-gray-800 mb-4">Menu Utama</Text>
        
        {/* Container Grid */}
        <View className="flex-row flex-wrap justify-between">
          
          {/* DI SINI KITA PAKAI COMPONENT REUSABLE TADI 
            Code jadi sangat bersih!
          */}
          {config.menuItems.map((item, index) => (
            <DashboardGridItem
              key={index}
              title={item.title}
              icon={item.icon}
              onPress={item.action}
              // Kita passing warna dari config Dashboard
              themeColor={config.themeColor}
              bgAccent={config.bgLight}
            />
          ))}

        </View>
      </View>

      {/* Logout Button */}
      <View className="px-6 mt-6">
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-white border border-red-100 p-4 rounded-xl space-x-2"
        >
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text className="text-red-500 font-bold ml-2">Keluar Aplikasi</Text>
        </TouchableOpacity>
        <Text className="text-center text-gray-400 text-xs mt-6">Versi 1.0.0</Text>
      </View>

    </ScrollView>
  );
}