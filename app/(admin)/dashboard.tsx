import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function AdminDashboard() {
  const { userData, isAdmin, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // Check if user is actually admin
  if (!isAdmin) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <View className="bg-red-100 rounded-2xl p-6 mb-6">
          <Text className="text-red-700 font-bold text-center">
            ⛔ Akses Ditolak
          </Text>
          <Text className="text-red-600 text-center mt-2">
            Anda tidak memiliki akses ke halaman admin.
          </Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
          className="bg-red-600 rounded-lg py-3 px-6"
        >
          <Text className="text-white font-bold text-center">Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Gagal logout');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-red-50 to-white">
      <View className="px-6 pt-12 pb-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-red-600 mb-2">Admin Panel</Text>
          <Text className="text-gray-600">Selamat datang, Admin!</Text>
        </View>

        {/* Admin Info Card */}
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6 border-2 border-red-200">
          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Nama Admin</Text>
            <Text className="text-gray-800 font-semibold text-lg">{userData?.name || 'Admin'}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Email</Text>
            <Text className="text-gray-800 font-semibold">{userData?.email}</Text>
          </View>

          <View className="border-t border-gray-200 pt-4">
            <Text className="text-gray-500 text-sm mb-1">Role</Text>
            <View className="flex-row items-center">
              <View className="bg-red-100 rounded-full px-3 py-1">
                <Text className="text-red-700 font-semibold text-sm">
                  👑 {userData?.role.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Functions */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">Management</Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <TouchableOpacity className="border-b border-gray-200 p-4">
              <Text className="text-gray-800 font-semibold">📊 Dashboard Analytics</Text>
              <Text className="text-gray-500 text-sm mt-1">Lihat statistik dan analitik</Text>
            </TouchableOpacity>

            <TouchableOpacity className="border-b border-gray-200 p-4">
              <Text className="text-gray-800 font-semibold">👥 Manajemen User</Text>
              <Text className="text-gray-500 text-sm mt-1">Kelola pengguna sistem</Text>
            </TouchableOpacity>

            <TouchableOpacity className="border-b border-gray-200 p-4">
              <Text className="text-gray-800 font-semibold">📦 Manajemen Produk</Text>
              <Text className="text-gray-500 text-sm mt-1">Tambah, edit, atau hapus produk</Text>
            </TouchableOpacity>

            <TouchableOpacity className="border-b border-gray-200 p-4">
              <Text className="text-gray-800 font-semibold">⚙️ Pengaturan Sistem</Text>
              <Text className="text-gray-500 text-sm mt-1">Konfigurasi sistem</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4">
              <Text className="text-gray-800 font-semibold">📋 Laporan</Text>
              <Text className="text-gray-500 text-sm mt-1">Buat dan unduh laporan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-600 rounded-lg py-3 flex-row justify-center items-center"
        >
          <Text className="text-white font-bold text-lg">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
