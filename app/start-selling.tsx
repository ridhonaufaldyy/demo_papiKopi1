import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert, // Tetap di-import untuk modal konfirmasi interaktif
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  clearTodaysTransactions,
  getTodayRemainingStock,
  getTodaySalesSummary,
  saveTransaction,
  StockItem,
  TransactionItem,
  VendorStock
} from '@/lib/product-service';
import { useNotification } from './components/ui/NotificationContainer';

export default function StartSellingScreen() {
  const router = useRouter();
  const notification = useNotification(); // <--- INISIALISASI NOTIFIKASI
  
  // Data Stok & Loading
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<VendorStock | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);

  // State GPS & Status Jualan
  const [isSelling, setIsSelling] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // State Modal Transaksi & Pembayaran
  const [modalVisible, setModalVisible] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({}); 
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [processing, setProcessing] = useState(false);

  // --- STATE SUMMARY PENJUALAN ---
  const [salesSummary, setSalesSummary] = useState({ count: 0, total: 0 });
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // --- 1. LOAD DATA STOK & SUMMARY ---
  useFocusEffect(
    useCallback(() => {
      fetchTodayData();
    }, [])
  );

  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const [stockResponse, summaryResponse] = await Promise.all([
        getTodayRemainingStock(),
        getTodaySalesSummary()
      ]);

      if (stockResponse) {
        setStockData(stockResponse);
        setItems(stockResponse.items || []);
      }
      if (summaryResponse) {
        setSalesSummary(summaryResponse);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI RESET TRANSAKSI (TESTING) ---
  const handleResetTransactions = () => {
    // Tetap pakai Alert untuk dialog Yes/No
    Alert.alert(
      "Reset Penjualan Hari Ini?",
      "Semua transaksi hari ini akan dihapus. Stok barang dan total pendapatan akan kembali seperti saat persiapan pagi. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Reset",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const deletedCount = await clearTodaysTransactions();
              // Menggunakan custom notification untuk pesan sukses
              notification.success(`${deletedCount} Transaksi hari ini telah direset!`);
              await fetchTodayData(); 
            } catch (error) {
              // Menggunakan custom notification untuk error
              notification.error("Gagal mereset transaksi.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // --- 2. LOGIKA GPS ---
  const handleStartSelling = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      notification.error('Aplikasi butuh izin lokasi untuk mencatat transaksi.');
      return;
    }

    setIsSelling(true);
    updateLocation();
    notification.success("Mode jualan aktif! Lokasi Anda siap dilacak.");
  };

  const updateLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    } catch (err) {
      console.log("Gagal ambil lokasi");
    }
  };

  // --- 3. LOGIKA KERANJANG BELANJA ---
  const addToCart = (productId: string, delta: number, maxStock: number) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, Math.min(maxStock, currentQty + delta)); 
      return { ...prev, [productId]: newQty };
    });
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const qty = cart[item.productId] || 0;
      return total + (qty * item.price);
    }, 0);
  };

  const handleCheckout = async () => {
    const total = calculateTotal();
    if (total === 0) return notification.error("Belum ada barang yang dipilih.");

    if (!currentLocation) {
      await updateLocation();
    }
    if (!currentLocation) {
      return notification.error("Gagal mendapatkan lokasi GPS. Pastikan GPS HP aktif.");
    }

    setProcessing(true);
    try {
      const transactionItems: TransactionItem[] = items
        .filter(item => (cart[item.productId] || 0) > 0)
        .map(item => ({
          productId: item.productId,
          name: item.name,
          qty: cart[item.productId],
          price: item.price,
          subtotal: cart[item.productId] * item.price
        }));

      await saveTransaction(transactionItems, total, currentLocation, paymentMethod);
      
      // Kurangi Stok Lokal
      setItems(prevItems => 
        prevItems.map(item => {
          const soldQty = cart[item.productId] || 0;
          return { ...item, currentStock: item.currentStock - soldQty };
        })
      );

      // Update Tampilan Summary
      setSalesSummary(prev => ({
        count: prev.count + 1,
        total: prev.total + total
      }));

      notification.success(`Transaksi ${paymentMethod.toUpperCase()} senilai Rp ${total.toLocaleString('id-ID')} berhasil dicatat!`);
      setModalVisible(false);
      setCart({}); 
      setPaymentMethod('cash'); 
      
    } catch (error) {
      notification.error("Terjadi kesalahan. Transaksi gagal disimpan.");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  // --- TAMPILAN JIKA BELUM INPUT STOK ---
  if (!loading && !stockData) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-6">
        <Feather name="clipboard" size={50} color="#f97316" />
        <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">Stok Belum Siap</Text>
        <TouchableOpacity 
          onPress={() => router.push('/preparation')}
          className="bg-blue-600 px-6 py-3 rounded-xl mt-4"
        >
          <Text className="text-white font-bold">Input Stok Sekarang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStockItem = ({ item }: { item: StockItem }) => (
    <View className={`flex-row items-center bg-white p-4 mb-3 rounded-xl border ${item.currentStock === 0 ? 'border-red-200 opacity-60' : 'border-gray-100'} shadow-sm`}>
      <Image source={{ uri: item.image || 'https://placehold.co/100' }} className="w-14 h-14 rounded-lg bg-gray-200" />
      <View className="flex-1 ml-3">
        <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>{item.name}</Text>
        <Text className="text-gray-500 text-xs">Rp {item.price.toLocaleString('id-ID')}</Text>
      </View>
      <View className={`${item.currentStock === 0 ? 'bg-red-50' : 'bg-blue-50'} px-3 py-2 rounded-lg items-center min-w-[60px]`}>
        <Text className={`text-xs font-bold ${item.currentStock === 0 ? 'text-red-500' : 'text-blue-600'}`}>
          {item.currentStock === 0 ? 'HABIS' : 'STOK'}
        </Text>
        <Text className={`text-lg font-extrabold ${item.currentStock === 0 ? 'text-red-600' : 'text-blue-700'}`}>
          {item.currentStock}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className={`${isSelling ? 'bg-green-600' : 'bg-blue-600'} px-6 pt-14 pb-6 rounded-b-[30px] shadow-md z-10`}>
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
             <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-xl">
            {isSelling ? 'Sedang Berjualan' : 'Mulai Jualan'}
          </Text>
          
          <TouchableOpacity 
            onPress={handleResetTransactions}
            className="p-2 bg-white/20 rounded-full"
          >
             <Feather name="refresh-cw" size={18} color="white" />
          </TouchableOpacity>
        </View>
                
        {isSelling && (
           <View className="flex-row items-center bg-white/20 p-2 rounded-lg mb-2">
             <Feather name="map-pin" size={14} color="white" className="mr-2" />
             <Text className="text-white text-xs">
               GPS: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Mencari lokasi...'}
             </Text>
           </View>
        )}

        <View className="flex-row justify-between mt-2">
           <View>
             <Text className="text-blue-100 text-xs mb-1">Total Barang Tersisa</Text>
             <Text className="text-white font-extrabold text-3xl">
               {items.reduce((acc, curr) => acc + curr.currentStock, 0)} Pcs
             </Text>
           </View>
        </View>
      </View>

      {/* List Barang */}
      <View className="flex-1 px-6 pt-4">
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          renderItem={renderStockItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTodayData} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* --- FLOATING ACTION BUTTON (REKAP PENJUALAN) --- */}
      {isSelling && (
        <TouchableOpacity 
          onPress={() => setSummaryModalVisible(true)}
          activeOpacity={0.8}
          className="absolute bottom-28 right-5 bg-orange-500 w-14 h-14 rounded-full flex justify-center items-center shadow-lg shadow-orange-300 z-20"
        >
          <Feather name="trending-up" size={24} color="white" />
          <View className="absolute -top-1 -right-1 bg-red-600 min-w-[20px] h-5 px-1 rounded-full items-center justify-center border-2 border-white">
            <Text className="text-white text-[10px] font-bold">{salesSummary.count}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* FOOTER ACTION */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
        {!isSelling ? (
          <TouchableOpacity 
            onPress={handleStartSelling}
            className="bg-blue-600 h-16 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-200"
          >
            <Feather name="navigation" size={24} color="white" className="mr-3"/>
            <Text className="text-white font-bold text-xl">MULAI KELILING</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="bg-green-600 h-16 rounded-2xl flex-row justify-center items-center shadow-lg shadow-green-200"
          >
            <Feather name="plus-circle" size={24} color="white" className="mr-3"/>
            <Text className="text-white font-bold text-xl">CATAT TRANSAKSI</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- MODAL TRANSAKSI (BAYAR) --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[90%]">
            
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-800">Input Penjualan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items.filter(item => item.currentStock > 0)} 
              keyExtractor={(item) => item.productId}
              contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const qty = cart[item.productId] || 0;
                return (
                  <View className="flex-row items-center justify-between mb-5 border-b border-gray-50 pb-4">
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
                      <Text className="text-gray-500">Rp {item.price.toLocaleString('id-ID')}</Text>
                      <Text className="text-xs text-blue-600 mt-1 font-medium">Sisa Stok: {item.currentStock}</Text>
                    </View>

                    <View className="flex-row items-center bg-gray-100 rounded-lg p-1">
                      <TouchableOpacity 
                        onPress={() => addToCart(item.productId, -1, item.currentStock)}
                        className="w-10 h-10 bg-white rounded-md items-center justify-center shadow-sm"
                      >
                        <Feather name="minus" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      <Text className="w-12 text-center font-bold text-xl text-gray-800">{qty}</Text>
                      <TouchableOpacity 
                        onPress={() => addToCart(item.productId, 1, item.currentStock)}
                        className="w-10 h-10 bg-blue-600 rounded-md items-center justify-center shadow-sm"
                      >
                        <Feather name="plus" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />

            <View className="p-5 border-t border-gray-200 bg-gray-50">
              <View className="mb-4">
                <Text className="text-gray-500 font-bold mb-2 text-xs uppercase tracking-wider">Metode Pembayaran</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={() => setPaymentMethod('cash')}
                    className={`flex-1 py-3 border rounded-xl flex-row justify-center items-center gap-2 ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500' : 'border-gray-200 bg-white'}`}
                  >
                    <Feather name="dollar-sign" size={18} color={paymentMethod === 'cash' ? '#2563eb' : '#9ca3af'} />
                    <Text className={`font-bold ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-500'}`}>Tunai</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setPaymentMethod('qris')}
                    className={`flex-1 py-3 border rounded-xl flex-row justify-center items-center gap-2 ${paymentMethod === 'qris' ? 'bg-blue-50 border-blue-500' : 'border-gray-200 bg-white'}`}
                  >
                    <Feather name="grid" size={18} color={paymentMethod === 'qris' ? '#2563eb' : '#9ca3af'} />
                    <Text className={`font-bold ${paymentMethod === 'qris' ? 'text-blue-600' : 'text-gray-500'}`}>QRIS</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row justify-between mb-4 items-center">
                <Text className="text-gray-600 font-bold text-base">Total Tagihan</Text>
                <Text className="text-3xl font-extrabold text-blue-700">
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={handleCheckout}
                disabled={processing || calculateTotal() === 0}
                className={`h-14 rounded-xl flex-row justify-center items-center ${processing || calculateTotal() === 0 ? 'bg-gray-400' : 'bg-green-600'}`}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Feather name="check-circle" size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg">PROSES PEMBAYARAN</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* --- MODAL RINGKASAN PENJUALAN --- */}
      <Modal visible={summaryModalVisible} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full p-6 rounded-3xl shadow-xl items-center relative">
            
            <TouchableOpacity 
              onPress={() => setSummaryModalVisible(false)} 
              className="absolute top-4 right-4 p-2"
            >
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4 mt-2">
              <Feather name="award" size={32} color="#f97316" />
            </View>

            <Text className="text-xl font-bold text-gray-800 mb-1">Capaian Hari Ini</Text>
            <Text className="text-gray-500 text-sm mb-6 text-center">Terus semangat! Setiap transaksi membawa Anda lebih dekat ke target.</Text>

            <View className="w-full flex-row justify-between mb-4">
              <View className="bg-gray-50 flex-1 p-4 rounded-2xl mr-2 border border-gray-100 items-center">
                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Transaksi</Text>
                <Text className="text-2xl font-extrabold text-gray-800">{salesSummary.count}</Text>
              </View>

              <View className="bg-orange-50 flex-1 p-4 rounded-2xl ml-2 border border-orange-100 items-center">
                <Text className="text-orange-400 text-xs font-bold uppercase mb-1">Pendapatan</Text>
                <Text 
                  className="text-xl font-extrabold text-orange-600 text-center"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Rp {salesSummary.total.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            {/* Hubungkan dengan halaman riwayat */}
            <TouchableOpacity 
              onPress={() => {
                setSummaryModalVisible(false);
                router.push('/riwayat'); // <--- MENGARAH KE HALAMAN RIWAYAT
              }}
              className="w-full bg-blue-50 border border-blue-100 py-3 rounded-xl mt-2 flex-row justify-center items-center"
            >
              <Feather name="list" size={16} color="#2563eb" className="mr-2" />
              <Text className="text-blue-600 font-bold text-center ml-2">Lihat Detail Riwayat</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}