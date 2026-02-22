import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location'; // Import Location
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  getTodayVendorStock,
  saveTransaction,
  StockItem,
  TransactionItem,
  VendorStock
} from '@/lib/product-service';

export default function StartSellingScreen() {
  const router = useRouter();
  
  // Data Stok & Loading
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<VendorStock | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);

  // State GPS & Status Jualan
  const [isSelling, setIsSelling] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  // State Modal Transaksi
  const [modalVisible, setModalVisible] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({}); // { 'id_produk': jumlah_beli }
  const [processing, setProcessing] = useState(false);

  // --- 1. LOAD DATA STOK ---
  useFocusEffect(
    useCallback(() => {
      fetchTodayStock();
    }, [])
  );

  const fetchTodayStock = async () => {
    setLoading(true);
    try {
      const data = await getTodayVendorStock();
      if (data) {
        setStockData(data);
        setItems(data.items || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOGIKA GPS ---
  const handleStartSelling = async () => {
    // Minta Izin GPS
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi butuh akses lokasi untuk mencatat transaksi.');
      return;
    }

    setLocationPermission(true);
    setIsSelling(true); // Ubah status jadi "Sedang Keliling"
    
    // Ambil lokasi awal
    updateLocation();
    
    Alert.alert("Mulai!", "Mode berjualan aktif. Lokasi Anda sedang dilacak.");
  };

  const updateLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      console.log("Lokasi update:", location.coords);
    } catch (err) {
      console.log("Gagal ambil lokasi");
    }
  };

  // --- 3. LOGIKA KERANJANG BELANJA (TRANSAKSI) ---
  const addToCart = (productId: string, delta: number, maxStock: number) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, Math.min(maxStock, currentQty + delta)); // Gak boleh minus & gak boleh lebih dari stok
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
    if (total === 0) return Alert.alert("Kosong", "Belum ada barang yang dipilih.");

    // Pastikan Lokasi Terupdate
    if (!currentLocation) {
       await updateLocation(); // Paksa update dulu
    }

    // Jika masih null (misal sinyal jelek), beri peringatan atau pakai dummy (0,0)
    // Di sini kita blokir biar data valid
    if (!currentLocation) {
      return Alert.alert("GPS Error", "Gagal mendapatkan lokasi. Pastikan GPS aktif.");
    }

    setProcessing(true);
    try {
      // Susun Data Transaksi
      const transactionItems: TransactionItem[] = items
        .filter(item => (cart[item.productId] || 0) > 0)
        .map(item => ({
          productId: item.productId,
          name: item.name,
          qty: cart[item.productId],
          price: item.price,
          subtotal: cart[item.productId] * item.price
        }));

      // Kirim ke Firebase
      await saveTransaction(transactionItems, total, currentLocation);

      Alert.alert("Sukses", "Transaksi berhasil disimpan!");
      setModalVisible(false);
      setCart({}); // Reset keranjang
      
      // TODO: Disini idealnya kita kurangi stok tampilan (items) secara lokal
      
    } catch (error) {
      Alert.alert("Gagal", "Transaksi gagal disimpan.");
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

  // --- RENDER ITEM STOK UTAMA ---
  const renderStockItem = ({ item }: { item: StockItem }) => (
    <View className="flex-row items-center bg-white p-4 mb-3 rounded-xl border border-gray-100 shadow-sm">
      <Image source={{ uri: item.image || 'https://placehold.co/100' }} className="w-14 h-14 rounded-lg bg-gray-200" />
      <View className="flex-1 ml-3">
        <Text className="font-bold text-gray-800 text-base">{item.name}</Text>
        <Text className="text-gray-500 text-xs">Rp {item.price.toLocaleString()}</Text>
      </View>
      <View className="bg-blue-50 px-3 py-2 rounded-lg items-center">
        <Text className="text-xs text-blue-600 font-bold">STOK</Text>
        <Text className="text-lg font-extrabold text-blue-700">{item.currentStock}</Text>
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
          <View className="w-6" /> 
        </View>
        
        {/* Info Lokasi (Kecil) */}
        {isSelling && (
           <View className="flex-row items-center bg-white/20 p-2 rounded-lg mb-2">
             <Feather name="map-pin" size={14} color="white" className="mr-2" />
             <Text className="text-white text-xs">
               GPS Aktif: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Mencari lokasi...'}
             </Text>
           </View>
        )}

        <View className="flex-row justify-between mt-2">
           <View>
             <Text className="text-blue-100 text-xs mb-1">Total Barang</Text>
             <Text className="text-white font-extrabold text-3xl">
               {items.reduce((acc, curr) => acc + curr.currentStock, 0)} Pcs
             </Text>
           </View>
        </View>
      </View>

      {/* List Barang */}
      <View className="flex-1 px-6 pt-4">
        <Text className="text-gray-600 font-bold mb-3">Stok Bawaan:</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          renderItem={renderStockItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTodayStock} />}
        />
      </View>

      {/* FOOTER ACTION */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
        {!isSelling ? (
          // TOMBOL MULAI KELILING
          <TouchableOpacity 
            onPress={handleStartSelling}
            className="bg-blue-600 h-16 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-200"
          >
            <Feather name="navigation" size={24} color="white" className="mr-3"/>
            <Text className="text-white font-bold text-xl">MULAI KELILING</Text>
          </TouchableOpacity>
        ) : (
          // TOMBOL CATAT TRANSAKSI (Muncul setelah mulai keliling)
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="bg-green-600 h-16 rounded-2xl flex-row justify-center items-center shadow-lg shadow-green-200"
          >
            <Feather name="plus-circle" size={24} color="white" className="mr-3"/>
            <Text className="text-white font-bold text-xl">CATAT TRANSAKSI</Text>
          </TouchableOpacity>
        )}
      </View>


      {/* --- MODAL TRANSAKSI --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%]">
            
            {/* Header Modal */}
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-800">Input Penjualan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* List Barang untuk Dijual */}
            <FlatList
              data={items}
              keyExtractor={(item) => item.productId}
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
              renderItem={({ item }) => {
                const qty = cart[item.productId] || 0;
                return (
                  <View className="flex-row items-center justify-between mb-6 border-b border-gray-50 pb-4">
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
                      <Text className="text-gray-500">Rp {item.price.toLocaleString()}</Text>
                      <Text className="text-xs text-blue-600 mt-1">Sisa Stok: {item.currentStock}</Text>
                    </View>

                    {/* Counter */}
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

            {/* Footer Total & Bayar */}
            <View className="p-6 border-t border-gray-100 bg-gray-50">
              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-500 font-bold">Total Transaksi</Text>
                <Text className="text-2xl font-extrabold text-blue-700">
                  Rp {calculateTotal().toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={handleCheckout}
                disabled={processing || calculateTotal() === 0}
                className={`h-14 rounded-xl flex-row justify-center items-center ${processing ? 'bg-gray-400' : 'bg-blue-600'}`}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Feather name="save" size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg">SIMPAN TRANSAKSI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}