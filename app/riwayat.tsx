import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { getUserTransactions } from '@/lib/product-service';

export default function RiwayatScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await getUserTransactions();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- MENGHITUNG TOTAL PENDAPATAN ---
  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [transactions]);

  const renderTransactionItem = ({ item }: { item: any }) => {
    const date = item.date || 'Tanggal tidak tersedia';
    const isQR = item.paymentMethod === 'qris';

    return (
      <View className="bg-white p-5 mb-4 rounded-3xl border border-gray-100 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            {/* PERBAIKAN: Menggunakan MaterialCommunityIcons agar tipe datanya valid */}
            <View className={`p-3 rounded-2xl ${isQR ? 'bg-purple-100' : 'bg-green-100'} mr-4`}>
              <MaterialCommunityIcons 
                name={isQR ? "qrcode" : "cash-multiple"} 
                size={20} 
                color={isQR ? "#a855f7" : "#22c55e"} 
              />
            </View>
            <View>
              <Text className="font-bold text-gray-800 text-base">
                {isQR ? 'Pembayaran QRIS' : 'Tunai (Cash)'}
              </Text>
              <Text className="text-gray-400 text-xs">{date}</Text>
            </View>
          </View>
          <Text className="font-black text-gray-800 text-lg">
            Rp {item.totalAmount?.toLocaleString('id-ID')}
          </Text>
        </View>

        <View className="h-[1px] bg-gray-50 w-full mb-4" />

        {/* List Produk */}
        <View className="space-y-2">
          {item.items?.map((prod: any, idx: number) => (
            <View key={idx} className="flex-row justify-between items-center">
              <View className="flex-row items-center flex-1 mr-4">
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2" />
                <Text className="text-gray-500 text-sm flex-1" numberOfLines={1}>
                  {prod.name}
                </Text>
                <Text className="text-gray-400 text-xs font-bold ml-2">x{prod.qty}</Text>
              </View>
              <Text className="text-gray-600 text-xs font-medium">
                Rp {prod.subtotal?.toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER SECTION */}
      <View className="bg-blue-600 px-6 pt-14 pb-8 rounded-b-[40px] shadow-lg">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 bg-white/20 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black text-xl">Riwayat Jualan</Text>
          <TouchableOpacity onPress={fetchTransactions} className="p-2 bg-white/20 rounded-full">
             <Feather name="refresh-cw" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* KARTU TOTAL PENDAPATAN */}
        <View className="bg-white/10 p-5 rounded-3xl border border-white/20 flex-row items-center justify-between">
           <View>
              <Text className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Pendapatan</Text>
              <Text className="text-white text-3xl font-black">
                 Rp {totalRevenue.toLocaleString('id-ID')}
              </Text>
           </View>
           <View className="bg-white/20 p-3 rounded-2xl">
              <Feather name="trending-up" size={28} color="white" />
           </View>
        </View>
      </View>

      {/* BODY CONTENT */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-400 mt-4 font-bold">Menghitung keuntungan...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="bg-white p-8 rounded-full shadow-sm mb-6">
            <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#d1d5db" />
          </View>
          <Text className="text-gray-500 font-bold text-lg">Belum Ada Transaksi</Text>
          <Text className="text-gray-400 text-center mt-2 leading-5">
            Semua nota yang kamu buat akan tersimpan rapi di sini untuk laporanmu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={{ padding: 20, paddingTop: 25, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchTransactions} tintColor="#2563eb" />
          }
          ListHeaderComponent={
            <Text className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-4 ml-1">
               Daftar Nota Masuk
            </Text>
          }
        />
      )}
    </View>
  );
}