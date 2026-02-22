import { getLeaderboardData } from '@/lib/product-service';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useNotification } from './components/ui/NotificationContainer';

const { width } = Dimensions.get('window');

interface LeaderboardItem {
  id: string;
  name: string;
  totalSales: number;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const notification = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'all-time'>('today');
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);

  // Gunakan useEffect standar untuk kestabilan navigasi
  // useEffect(() => {
  //   let isMounted = true;
    
  //   const loadData = async () => {
  //     setLoading(true);
  //     try {
  //       const result = await getLeaderboardData(timeframe);
  //       if (isMounted) setLeaders(result);
  //     } catch (err) {
  //       if (isMounted) notification.error("Gagal memuat peringkat");
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   loadData();
  //   return () => { isMounted = false; };
  // }, [timeframe]);

// --- FUNGSI LOAD DATA (Sekarang bisa dipanggil dari mana saja) ---
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLeaderboardData(timeframe);
      setLeaders(result);
    } catch (err) {
      notification.error("Gagal memuat peringkat");
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe]); // Fungsi ini akan diperbarui setiap timeframe berubah

  // Jalankan fetch setiap kali timeframe berubah
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getMedalStyle = (index: number) => {
    switch (index) {
      case 0: return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '#eab308', border: 'border-yellow-400' };
      case 1: return { bg: 'bg-slate-100', text: 'text-slate-500', icon: '#94a3b8', border: 'border-slate-300' };
      case 2: return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '#c2410c', border: 'border-orange-400' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-400', icon: '#9ca3af', border: 'border-gray-100' };
    }
  };

  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const style = getMedalStyle(index);
    const isTop3 = index < 3;

    return (
      <View className={`flex-row items-center bg-white p-4 mb-3 rounded-2xl border ${style.border} shadow-sm`}>
        {/* Badge Peringkat */}
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${style.bg}`}>
          {isTop3 ? (
            <Feather name="award" size={20} color={style.icon} />
          ) : (
            <Text className={`font-bold ${style.text}`}>{index + 1}</Text>
          )}
        </View>

        {/* Profil */}
        <Image 
          source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff` }} 
          className="w-12 h-12 rounded-full mr-3"
        />

        {/* Nama Pedagang (USERNAME) - flex-1 agar teks panjang tidak mendorong pendapatan */}
        <View className="flex-1 mr-2">
          <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-gray-400 text-[10px] uppercase tracking-tighter">Pedagang Aktif</Text>
        </View>

        {/* Pendapatan - Disesuaikan dengan width agar tidak nabrak */}
        <View className="items-end min-w-[90px]">
          <Text className="text-gray-400 text-[9px] font-bold mb-0.5">TOTAL</Text>
          <Text 
            className={`font-black ${isTop3 ? style.text : 'text-gray-700'} text-base`}
            numberOfLines={1}
            adjustsFontSizeToFit // Otomatis mengecil jika angka terlalu besar
          >
            Rp {item.totalSales.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="bg-blue-600 px-6 pt-14 pb-6 rounded-b-[30px] shadow-lg">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/20 rounded-full">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black text-xl">Papan Peringkat</Text>
          <View className="w-10" />
        </View>

        {/* TAB SWITCHER */}
        <View className="flex-row bg-blue-800/40 p-1.5 rounded-2xl">
          <TouchableOpacity 
            onPress={() => setTimeframe('today')}
            className={`flex-1 py-3 rounded-xl items-center ${timeframe === 'today' ? 'bg-white' : ''}`}
          >
            <Text className={`font-bold ${timeframe === 'today' ? 'text-blue-600' : 'text-blue-100'}`}>Hari Ini</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTimeframe('all-time')}
            className={`flex-1 py-3 rounded-xl items-center ${timeframe === 'all-time' ? 'bg-white' : ''}`}
          >
            <Text className={`font-bold ${timeframe === 'all-time' ? 'text-blue-600' : 'text-blue-100'}`}>Semua</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchLeaderboard()} />}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="trophy-outline" size={80} color="#d1d5db" />
              <Text className="text-gray-400 font-bold mt-4">Belum ada data penjualan</Text>
            </View>
          }
        />
      )}
    </View>
  );
}