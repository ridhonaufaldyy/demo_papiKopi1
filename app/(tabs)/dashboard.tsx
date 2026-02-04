import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/auth-utils';
import { getProducts, Product } from '@/lib/product-service';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Import Components
import { DashboardGridItem } from '../components/dashboard/DashboardGridItem';
import { ProductCard } from '../components/ui/ProductCard';

// --- Tipe Data ---
type IconName = keyof typeof Feather.glyphMap;

interface MenuItem {
  title: string;
  icon: IconName;
  route?: string; // Property untuk navigasi
}

interface DashboardConfig {
  greeting: string;
  themeColor: string;
  primaryColor: string;
  bgLight: string;
  headerIcon: IconName;
  menuItems: MenuItem[];
}

// --- Konfigurasi Menu (UPDATE DISINI) ---
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
      // TOMBOL INI YANG KITA UPDATE:
      { 
        title: 'Produk',        // Judul Button
        icon: 'package',        // Icon Kotak
        route: '/add-product'   // <--- Arahkan ke halaman tambah produk
      }, 
      { title: 'Sistem', icon: 'settings' },
    ]
  },
  user: {
    greeting: 'Mau minum apa?',
    themeColor: '#2563eb',
    primaryColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    headerIcon: 'smile',
    menuItems: []
  }
};

export default function DashboardScreen() {
  const { userData, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  // State untuk Data Produk (User View)
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  const currentRole = userData?.role || 'user';
  const config = ROLE_CONFIG[currentRole];

  // Logic: Fetch Data Produk (Hanya berjalan jika User)
  useFocusEffect(
    useCallback(() => {
      if (currentRole === 'user') {
        const fetchProducts = async () => {
          setProductLoading(true);
          const data = await getProducts();
          setProducts(data);
          setProductLoading(false);
        };
        fetchProducts();
      }
    }, [currentRole])
  );

  // Logic: Navigasi Menu Grid (Admin)
  const handleMenuPress = (route?: string) => {
    if (route) {
      router.push(route as any); // Pindah halaman sesuai route
    } else {
      Alert.alert('Info', 'Fitur ini belum tersedia');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Konfirmasi', 'Keluar aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }}
    ]);
  };

  if (authLoading) return <View className="flex-1 bg-white" />;

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View className="bg-white px-6 pt-14 pb-8 rounded-b-[30px] shadow-sm mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-gray-400 font-medium text-sm">{config.greeting}</Text>
            <Text className={`text-2xl font-extrabold ${config.primaryColor}`}>
              {userData?.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
             <Feather name="log-out" size={20} color={config.themeColor} />
          </TouchableOpacity>
        </View>

        {/* Banner Status */}
        <View className={`p-4 rounded-xl ${currentRole === 'admin' ? 'bg-red-600' : 'bg-blue-600'}`}>
           <Text className="text-white font-bold text-lg">
             {currentRole === 'admin' ? 'Status Sistem Aman' : 'Promo Hari Ini!'}
           </Text>
           <Text className="text-white/80 text-xs">
             {currentRole === 'admin' ? 'Semua layanan berjalan normal.' : 'Diskon spesial untukmu.'}
           </Text>
        </View>
      </View>

      {/* CONTENT AREA */}
      <View className="px-6 pb-20">
        
        {/* TAMPILAN ADMIN: GRID BUTTONS */}
        {currentRole === 'admin' && (
          <>
            <Text className="text-lg font-bold text-gray-800 mb-4">Fitur Utama</Text>
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
          </>
        )}

        {/* TAMPILAN USER: LIST PRODUK */}
        {currentRole === 'user' && (
          <>
            <Text className="text-lg font-bold text-gray-800 mb-4">Menu Minuman</Text>
            
            {productLoading ? (
              <ActivityIndicator size="large" color="#2563eb" />
            ) : products.length === 0 ? (
              <View className="items-center py-10">
                <Feather name="coffee" size={40} color="#ccc" />
                <Text className="text-gray-400 mt-2">Belum ada menu tersedia</Text>
              </View>
            ) : (
              products.map((item) => (
                <ProductCard 
                  key={item.id} 
                  item={item} 
                  onPress={() => Alert.alert('Order', `Pesan ${item.name}?`)}
                />
              ))
            )}
          </>
        )}

      </View>
    </ScrollView>
  );
}