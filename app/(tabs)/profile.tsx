import { useAuth } from '@/lib/auth-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'; // Tambah Image

export default function ProfileScreen() {
  const { userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
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

  const InfoItem = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Feather.glyphMap }) => (
    <View className="flex-row items-center bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
      <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
        <Feather name={icon} size={20} color="#4b5563" />
      </View>
      <View>
        <Text className="text-gray-400 text-xs font-medium">{label}</Text>
        <Text className="text-gray-800 font-semibold text-base">{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header Profile */}
      <View className="bg-white pb-8 pt-16 rounded-b-[40px] shadow-sm items-center mb-6">
        
        {/* --- UPDATE: TAMPILKAN FOTO PROFIL --- */}
        <View className="mb-4 shadow-md relative">
          {userData?.image ? (
            <Image 
              source={{ uri: userData.image }} 
              className="w-24 h-24 rounded-full border-4 border-white bg-gray-200"
            />
          ) : (
            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center border-4 border-white">
               <Feather name="user" size={40} color="#9ca3af" />
            </View>
          )}
        </View>

        <Text className="text-2xl font-bold text-gray-800">{userData?.name || 'User'}</Text>
        <Text className="text-gray-500">{userData?.email}</Text>
        
        <View className={`mt-3 px-4 py-1 rounded-full ${userData?.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Text className={`text-xs font-bold uppercase ${userData?.role === 'admin' ? 'text-red-600' : 'text-blue-600'}`}>
            {userData?.role}
          </Text>
        </View>
      </View>

      {/* Info Section */}
      <View className="px-6 mb-8">
        <Text className="text-lg font-bold text-gray-800 mb-4">Info Akun</Text>
        <InfoItem label="Nama Lengkap" value={userData?.name || '-'} icon="smile" />
        <InfoItem label="Email" value={userData?.email || '-'} icon="mail" />
        <InfoItem label="Member Sejak" value="2024" icon="calendar" />
      </View>

      {/* Action Buttons */}
      <View className="px-6 pb-20 space-y-3">
        
        {/* --- UPDATE: NAVIGASI KE EDIT PROFILE --- */}
        <TouchableOpacity 
          onPress={() => router.push('/edit-profile')} // <--- TAMBAHAN DI SINI
          className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-3"
        >
          <View className="flex-row items-center">
            <Feather name="edit-3" size={20} color="#4b5563" className="mr-3" />
            <Text className="text-gray-700 font-medium ml-3">Edit Profil</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-50 p-4 rounded-xl mt-4"
        >
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text className="text-red-600 font-bold ml-2">Keluar Aplikasi</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}