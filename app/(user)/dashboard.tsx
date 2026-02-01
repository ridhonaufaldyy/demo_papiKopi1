import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function UserDashboard() {
  const { userData, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
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
    <ScrollView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <View className="px-6 pt-12 pb-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-blue-600 mb-2">Dashboard User</Text>
          <Text className="text-gray-600">Selamat datang!</Text>
        </View>

        {/* User Info Card */}
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Nama</Text>
            <Text className="text-gray-800 font-semibold text-lg">{userData?.name || 'User'}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Email</Text>
            <Text className="text-gray-800 font-semibold">{userData?.email}</Text>
          </View>

          <View className="border-t border-gray-200 pt-4">
            <Text className="text-gray-500 text-sm mb-1">Role</Text>
            <View className="flex-row items-center">
              <View className="bg-green-100 rounded-full px-3 py-1">
                <Text className="text-green-700 font-semibold text-sm">{userData?.role}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">Fitur User</Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <TouchableOpacity className="border-b border-gray-200 p-4">
              <Text className="text-gray-800 font-semibold">Profil Saya</Text>
              <Text className="text-gray-500 text-sm mt-1">Lihat dan edit profil</Text>
            </TouchableOpacity>

            <TouchableOpacity className="border-b border-gray-200 p-4">
              <Text className="text-gray-800 font-semibold">Pesanan</Text>
              <Text className="text-gray-500 text-sm mt-1">Riwayat pesanan Anda</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4">
              <Text className="text-gray-800 font-semibold">Pengaturan</Text>
              <Text className="text-gray-500 text-sm mt-1">Atur preferensi Anda</Text>
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
