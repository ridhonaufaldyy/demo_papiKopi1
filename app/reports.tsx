import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore'; // Import Firestore
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { listenAllTransactions } from '@/lib/product-service';

// --- UTILS ---
const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (seconds: number) => {
  return new Date(seconds * 1000).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

export default function ReportsScreen() {
  const router = useRouter();
  const db = getFirestore(); // Init DB untuk ambil nama user

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Nama User (Cache lokal: ID -> Nama)
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // --- FILTER STATE ---
  const [mode, setMode] = useState<'today' | 'week' | 'month' | 'date'>('today');
  const [pickedDate, setPickedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter Pedagang
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null); // null = Semua
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  // --- 1. FETCH TRANSAKSI REALTIME ---
  useEffect(() => {
    const unsub = listenAllTransactions((data) => {
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- 2. FETCH NAMA USER (CLIENT-SIDE JOIN) ---
  useEffect(() => {
    const fetchMissingNames = async () => {
      if (transactions.length === 0) return;

      // Cari ID unik yang belum punya nama di state 'userNames'
      const uniqueIds = [...new Set(transactions.map(t => t.userId))];
      const missingIds = uniqueIds.filter(id => !userNames[id] && id);

      if (missingIds.length === 0) return;

      const newNames: Record<string, string> = {};

      // Ambil data user satu per satu (Parallel)
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const userSnap = await getDoc(doc(db, 'users', id));
            if (userSnap.exists()) {
              const data = userSnap.data();
              // Prioritas: Nama Display -> Email -> ID Pendek
              newNames[id] = data.name || data.email || `User ${id.substring(0,4)}`;
            } else {
              newNames[id] = `User ${id.substring(0,4)}`;
            }
          } catch (e) {
            console.error("Gagal ambil nama user:", id, e);
            newNames[id] = 'Unknown User';
          }
        })
      );

      // Update state (Gabungkan dengan nama yang sudah ada)
      setUserNames(prev => ({ ...prev, ...newNames }));
    };

    fetchMissingNames();
  }, [transactions]); // Jalankan setiap kali transaksi berubah

  // --- 3. LIST PEDAGANG UNTUK FILTER ---
  const merchantList = useMemo(() => {
    // Ambil ID unik dari transaksi
    const uniqueIds = [...new Set(transactions.map(t => t.userId))].filter(Boolean);
    
    // Map ke format { id, name } menggunakan data dari state 'userNames'
    return uniqueIds.map(id => ({
      id,
      name: userNames[id] || 'Memuat Nama...' // Tampilkan loading jika belum ke-fetch
    }));
  }, [transactions, userNames]);

  // Nama pedagang yang sedang dipilih
  const activeMerchantName = merchantList.find(m => m.id === selectedMerchantId)?.name || 'Semua Pedagang';

  // --- 4. FILTER DATA UTAMA ---
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter((t) => {
      // A. Filter Waktu
      if (!t.timestamp?.seconds) return false;
      const d = new Date(t.timestamp.seconds * 1000);
      let timeMatch = true;

      if (mode === 'today') timeMatch = d >= startOfDay;
      else if (mode === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        timeMatch = d >= weekAgo;
      }
      else if (mode === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        timeMatch = d >= monthAgo;
      }
      else if (mode === 'date') timeMatch = d.toDateString() === pickedDate.toDateString();

      // B. Filter Pedagang
      let merchantMatch = true;
      if (selectedMerchantId) {
        merchantMatch = t.userId === selectedMerchantId;
      }

      return timeMatch && merchantMatch;
    });
  }, [transactions, mode, pickedDate, selectedMerchantId]);

  // --- 5. CALCULATE STATS ---
  const stats = useMemo(() => {
    // General Stats
    const totalRevenue = filteredData.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalCount = filteredData.length;
    const averageOrder = totalCount > 0 ? totalRevenue / totalCount : 0;

    // Leaderboard Ranking
    const userMap: Record<string, { name: string; revenue: number; count: number }> = {};
    
    // Kita hitung ranking HANYA jika filter "Semua Pedagang" aktif
    // Kalau pilih 1 pedagang, ranking tidak relevan (karena cuma 1)
    if (!selectedMerchantId) {
      filteredData.forEach((t) => {
        const uid = t.userId || 'unknown';
        // Pakai nama dari state 'userNames'
        const name = userNames[uid] || 'Loading...'; 
        
        if (!userMap[uid]) userMap[uid] = { name, revenue: 0, count: 0 };
        userMap[uid].revenue += t.totalAmount || 0;
        userMap[uid].count += 1;
      });
    }
    const userRanking = Object.values(userMap).sort((a, b) => b.revenue - a.revenue);

    return { totalRevenue, totalCount, averageOrder, userRanking };
  }, [filteredData, selectedMerchantId, userNames]);


  // --- COMPONENT: FILTER TIME BUTTON ---
  const FilterButton = ({ label, value, icon }: any) => {
    const isActive = mode === value;
    return (
      <TouchableOpacity
        onPress={() => {
          setMode(value);
          if (value === 'date') setShowDatePicker(true);
        }}
        className={`flex-row items-center px-4 py-2 mr-2 rounded-full border ${
          isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
        }`}
      >
        <Ionicons name={icon} size={16} color={isActive ? 'white' : '#4b5563'} />
        <Text className={`ml-2 text-xs font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      
      {/* HEADER UTAMA */}
      <View className="bg-white px-5 pt-12 pb-4 border-b border-gray-200 shadow-sm z-10">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Laporan Penjualan</Text>
          <TouchableOpacity className="p-2">
            <Ionicons name="download-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* BARIS FILTER */}
        <View>
          {/* 1. Filter Waktu */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <FilterButton label="Hari Ini" value="today" icon="today-outline" />
            <FilterButton label="Minggu Ini" value="week" icon="calendar-outline" />
            <FilterButton label="Bulan Ini" value="month" icon="stats-chart-outline" />
            <FilterButton label={mode === 'date' ? pickedDate.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : "Pilih Tanggal"} value="date" icon="calendar-number-outline" />
          </ScrollView>

          {/* 2. Filter Pedagang (NEW) */}
          <TouchableOpacity 
            onPress={() => setShowMerchantModal(true)}
            className="flex-row items-center justify-between bg-gray-100 px-4 py-3 rounded-xl border border-gray-200"
          >
            <View className="flex-row items-center">
              <View className={`p-1.5 rounded-full mr-3 ${selectedMerchantId ? 'bg-blue-100' : 'bg-gray-300'}`}>
                <Ionicons name="person" size={14} color={selectedMerchantId ? '#2563eb' : 'white'} />
              </View>
              <View>
                <Text className="text-[10px] text-gray-500 font-bold uppercase">Filter Pedagang</Text>
                <Text className="text-sm font-bold text-gray-800">{activeMerchantName}</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" className="mt-20" />
        ) : (
          <>
            {/* STATS CARDS */}
            <View className="p-5">
              <View className="bg-blue-600 rounded-2xl p-5 shadow-lg shadow-blue-200 mb-4">
                <Text className="text-blue-100 font-medium text-sm">Total Pendapatan ({selectedMerchantId ? 'Personal' : 'Global'})</Text>
                <Text className="text-white font-extrabold text-3xl mt-1">{formatRupiah(stats.totalRevenue)}</Text>
              </View>

              <View className="flex-row justify-between">
                <View className="bg-white p-4 rounded-xl flex-1 mr-2 shadow-sm border border-gray-100">
                  <Text className="text-gray-500 text-xs font-bold mb-1">Total Transaksi</Text>
                  <Text className="text-gray-800 text-xl font-bold">{stats.totalCount}</Text>
                </View>
                <View className="bg-white p-4 rounded-xl flex-1 ml-2 shadow-sm border border-gray-100">
                  <Text className="text-gray-500 text-xs font-bold mb-1">Rata-rata Order</Text>
                  <Text className="text-gray-800 text-xl font-bold">
                    {stats.averageOrder > 1000000 ? (stats.averageOrder/1000000).toFixed(1) + 'Jt' : (stats.averageOrder/1000).toFixed(0) + 'Rb'}
                  </Text>
                </View>
              </View>
            </View>

            {/* --- KONTEN DINAMIS --- */}
            <View className="bg-white rounded-t-3xl shadow-sm border-t border-gray-100 px-5 pt-6 pb-20 min-h-[500px]">
              
              {/* HEADER SECTION */}
              <View className="flex-row justify-between items-end mb-6">
                <Text className="text-lg font-bold text-gray-800">
                  {selectedMerchantId ? 'Riwayat Transaksi' : 'Ranking Pedagang'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {selectedMerchantId 
                    ? `${filteredData.length} Data Ditemukan` 
                    : `${stats.userRanking.length} Pedagang Aktif`
                  }
                </Text>
              </View>

              {/* LIST LOGIC */}
              {filteredData.length === 0 ? (
                <View className="items-center py-10">
                  <Ionicons name="file-tray-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-400 mt-2">Tidak ada data di periode ini</Text>
                </View>
              ) : selectedMerchantId ? (
                // --- MODE 1: DETAIL TRANSAKSI (JIKA 1 PEDAGANG DIPILIH) ---
                <View>
                  {filteredData.sort((a,b) => b.timestamp.seconds - a.timestamp.seconds).map((t, index) => (
                    <View key={t.id || index} className="flex-row items-center bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100">
                      <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                         <Ionicons name="checkmark-sharp" size={20} color="#16a34a" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-800 text-base">{formatRupiah(t.totalAmount)}</Text>
                        <Text className="text-xs text-gray-500">{formatDate(t.timestamp.seconds)}</Text>
                      </View>
                      <View>
                         <Text className="text-[10px] text-gray-400 font-medium">Lunas</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                // --- MODE 2: LEADERBOARD (JIKA SEMUA PEDAGANG) ---
                stats.userRanking.map((user, index) => {
                  const maxVal = stats.userRanking[0].revenue;
                  const percent = (user.revenue / maxVal) * 100;
                  return (
                    <View key={index} className="mb-6">
                      <View className="flex-row justify-between items-center mb-1">
                        <View className="flex-row items-center">
                          <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${index < 3 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                            <Text className={`text-xs font-bold ${index < 3 ? 'text-yellow-700' : 'text-gray-500'}`}>{index + 1}</Text>
                          </View>
                          <Text className="font-bold text-gray-700 text-sm">{user.name}</Text>
                        </View>
                        <Text className="font-bold text-gray-800">{formatRupiah(user.revenue)}</Text>
                      </View>
                      <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <View className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* --- MODAL PILIH PEDAGANG --- */}
      <Modal visible={showMerchantModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[60%]">
            <View className="p-5 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">Pilih Pedagang</Text>
              <TouchableOpacity onPress={() => setShowMerchantModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={[{ id: null, name: 'Semua Pedagang' }, ...merchantList]}
              keyExtractor={(item) => item.id || 'all'}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedMerchantId(item.id);
                    setShowMerchantModal(false);
                  }}
                  className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
                    selectedMerchantId === item.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <Text className={`font-bold ${selectedMerchantId === item.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {item.name}
                  </Text>
                  {selectedMerchantId === item.id && <Ionicons name="checkmark-circle" size={20} color="#2563eb" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL DATE PICKER */}
      {showDatePicker && (
        <DateTimePicker
          value={pickedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setPickedDate(date);
          }}
        />
      )}
    </View>
  );
}