import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/auth-utils';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNotification } from '../components/ui/NotificationContainer';

// Import Components
import { DashboardGridItem } from '../components/dashboard/DashboardGridItem';

// --- Tipe Data ---
type IconName = keyof typeof Feather.glyphMap;

interface MenuItem {
  title: string;
  icon: IconName;
  route?: string;
}

interface DashboardConfig {
  greeting: string;
  themeColor: string;
  primaryColor: string;
  bgLight: string;
  headerIcon: IconName;
  menuItems: MenuItem[];
}

// --- Konfigurasi Menu ---
const ROLE_CONFIG: Record<UserRole, DashboardConfig> = {
  admin: {
    greeting: 'Admin Panel',
    themeColor: '#ef4444',
    primaryColor: 'text-red-600',
    bgLight: 'bg-red-50',
    headerIcon: 'shield',
    menuItems: [
      { title: 'Analytics', icon: 'bar-chart-2', route: '/sales-map' },
      { title: 'Users', icon: 'users', route: '/manage-users' },
      { title: 'Produk', icon: 'package', route: '/product-list' },
      { title: 'Sistem', icon: 'settings' },
      { title: 'Laporan', icon: 'file-text', route: '/reports' },
    ]
  },
  user: {
    greeting: 'Siap Berdagang?',
    themeColor: '#2563eb',
    primaryColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    headerIcon: 'truck',
    menuItems: [
      { title: 'Persiapan', icon: 'clipboard', route: '/preparation' },
      { title: 'Mulai Jualan', icon: 'map-pin', route: '/start-selling' },
      { title: 'Top Penjualan', icon: 'award', route: '/leaderboard' },
      { title: 'Riwayat', icon: 'clock', route: '/riwayat' },
    ]
  }
};

export default function DashboardScreen() {
  const { userData, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const notification = useNotification();

  // Kita ambil role & config saat ini
  const currentRole = userData?.role || 'user';
  const config = ROLE_CONFIG[currentRole];

  // Logic: Navigasi Menu Grid
  const handleMenuPress = (route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      notification.info('Fitur ini belum tersedia');
    }
  };

  // --- FUNGSI EKSEKUSI LOGOUT ---
  const performLogout = useCallback(async () => {
    try {
      await logout();
      notification.success('Logout berhasil');
      router.replace('/(auth)/login');
    } catch (error) {
      notification.error('Gagal logout');
      console.error(error);
    }
  }, [logout, notification, router]);

  // --- TRIGGER TOMBOL LOGOUT (UI) ---
  const handleLogoutPress = () => {
    notification.confirm(
      'Anda akan keluar dari akun. Lanjutkan?',
      performLogout,
      () => {
        notification.info('Logout dibatalkan');
      },
      'Logout?'
    );
  };

  // --- HANDLE TOMBOL BACK ANDROID - HANYA KETIKA DI DASHBOARD UTAMA ---
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        notification.confirm(
          'Apakah Anda yakin ingin keluar dari akun?',
          performLogout,
          () => true,
          'Konfirmasi Logout'
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [notification, performLogout])
  );

  // --- FIX: Loading Check diletakkan di awal ---
  if (authLoading) return <View className="flex-1 bg-white" />;

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View className="bg-white px-6 pt-14 pb-8 rounded-b-[30px] shadow-sm mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-gray-400 font-medium text-sm">{config.greeting}</Text>
            
            {/* Nama User & Edit Profile */}
            <TouchableOpacity 
              onPress={() => router.push('/edit-profile')} 
              activeOpacity={0.7}
              className="flex-row items-center mt-1"
            >
              <Text className={`text-2xl font-extrabold mr-2 ${config.primaryColor}`}>
                {userData?.name || userData?.email || 'User'}
              </Text>
              <View className="bg-gray-100 p-1.5 rounded-full">
                <Feather name="edit-2" size={14} color="#9ca3af" />
              </View>
            </TouchableOpacity>

          </View>
          
          <TouchableOpacity onPress={handleLogoutPress}>
             <Feather name="log-out" size={20} color={config.themeColor} />
          </TouchableOpacity>
        </View>

        {/* Banner Status */}
        <View className={`p-4 rounded-xl ${currentRole === 'admin' ? 'bg-red-600' : 'bg-blue-600'}`}>
           <Text className="text-white font-bold text-lg">
             {currentRole === 'admin' ? 'Status Sistem Aman' : 'Mode Pedagang Aktif'}
           </Text>
           <Text className="text-white/80 text-xs">
             {currentRole === 'admin' ? 'Semua layanan berjalan normal.' : 'Jangan lupa cek stok sebelum berangkat.'}
           </Text>
        </View>
      </View>

      {/* CONTENT AREA (GRID MENU UNTUK SEMUA ROLE) */}
      <View className="px-6 pb-20">
        
        <Text className="text-lg font-bold text-gray-800 mb-4">Menu Utama</Text>
        
        {/* Render Grid Items sesuai Config Role */}
        <View className="flex-row flex-wrap justify-between">
          {config.menuItems.map((item, index) => (
            <DashboardGridItem
              key={index}
              title={item.title}
              icon={item.icon}
              themeColor={config.themeColor}
              bgAccent={config.bgLight}
              onPress={() => handleMenuPress(item.route)}
            />
          ))}
        </View>

      </View>
    </ScrollView>
  );
}