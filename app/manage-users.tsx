import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Import service (Pastikan Anda sudah punya fungsi deleteUser di user-service)
import { deleteUser, getAllUsers, UserData } from '@/lib/user-service';

export default function ManageUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Ambil Data User ---
  const fetchUsers = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await getAllUsers();
      // Opsional: Filter agar Admin tidak bisa menghapus dirinya sendiri di list ini
      // const filtered = data.filter(u => u.role !== 'admin'); 
      setUsers(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengambil data user");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // --- Handle Hapus User ---
  const handleDeleteUser = (user: UserData) => {
    Alert.alert(
      "Hapus User",
      `Yakin ingin menghapus akun "${user.name}"? \nUser ini tidak akan bisa mengakses data lagi.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(user.id);
              
              // Optimistic Update: Hapus dari layar langsung biar cepat
              setUsers(prev => prev.filter(u => u.id !== user.id));
              
              Alert.alert("Sukses", "User berhasil dihapus.");
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus user.");
            }
          }
        }
      ]
    );
  };

  // --- Komponen Kartu User ---
  const renderItem = ({ item }: { item: UserData }) => (
    <View className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm flex-row items-center justify-between">
      
      {/* Info User (Kiri) */}
      <View className="flex-row items-center flex-1 mr-2">
        {/* Avatar */}
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${item.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Feather name="user" size={20} color={item.role === 'admin' ? '#dc2626' : '#2563eb'} />
        </View>
        
        <View className="flex-1">
          <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {item.email}
          </Text>
          
          {/* Badge Role */}
          <View className={`self-start px-2 py-0.5 rounded mt-1 ${item.role === 'admin' ? 'bg-red-50' : 'bg-blue-50'}`}>
            <Text className={`text-[10px] font-bold uppercase ${item.role === 'admin' ? 'text-red-600' : 'text-blue-600'}`}>
              {item.role}
            </Text>
          </View>
        </View>
      </View>

      {/* Tombol Aksi (Kanan) - HANYA DELETE */}
      <TouchableOpacity 
        onPress={() => handleDeleteUser(item)}
        className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100 ml-2"
      >
        <Feather name="trash-2" size={18} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-200 flex-row items-center shadow-sm">
        <Feather name="arrow-left" size={24} color="#1f2937" onPress={() => router.back()} />
        <Text className="text-xl font-bold ml-4 text-gray-800">Manajemen User</Text>
      </View>

      {/* List User */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Feather name="users" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-4">Belum ada user terdaftar.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}