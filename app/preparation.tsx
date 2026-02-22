import { getProducts, getTodayVendorStock, Product, saveVendorDailyStock, StockItem } from '@/lib/product-service';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
// Import library baru untuk mengatasi masalah keyboard
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useNotification } from './components/ui/NotificationContainer';

export default function PreparationScreen() {
  const router = useRouter();
  const notification = useNotification();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State Mode Tampilan
  const [viewMode, setViewMode] = useState<'prepared' | 'catalog'>('catalog');
  
  // State Filter Kategori & Pencarian
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // State Quantity berdasarkan Product ID
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Deteksi apakah sudah ada stok tersimpan hari ini
  const [hasSavedToday, setHasSavedToday] = useState(false);

  // State untuk Modal Detail (Estimasi Pendapatan)
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load Data setiap kali halaman dibuka (Focus)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [katalogData, todayStockData] = await Promise.all([
        getProducts(),
        getTodayVendorStock()
      ]);

      setProducts(katalogData);
      
      const uniqueCats = ['Semua', ...new Set(katalogData.map(p => p.category))];
      setCategories(uniqueCats);

      // Cek apakah ada data persiapan hari ini
      if (todayStockData && todayStockData.items && todayStockData.items.length > 0) {
        const existingQty: Record<string, number> = {};
        todayStockData.items.forEach((item: StockItem) => {
          existingQty[item.productId] = item.currentStock; 
        });
        setQuantities(existingQty);
        setHasSavedToday(true);
        setViewMode('prepared'); // Buka tab "Sudah Disiapkan"
      } else {
        setHasSavedToday(false);
        setViewMode('catalog'); // Buka tab "Katalog"
      }
    } catch (error) {
      notification.error('Gagal memuat data persiapan');
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING LOGIC ---
  const displayedProducts = products.filter(p => {
    if (viewMode === 'prepared') {
      return (quantities[p.id!] || 0) > 0;
    } else {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    }
  });

  // Data khusus untuk Detail Estimasi
  const preparedItemsList = products.filter(p => (quantities[p.id!] || 0) > 0);
  const estimatedRevenue = preparedItemsList.reduce((sum, p) => sum + (p.price * quantities[p.id!]), 0);

  // --- FUNGSI UPDATE QTY ---
  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleManualInput = (id: string, text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newQty = parseInt(cleanText) || 0;
    setQuantities(prev => ({ ...prev, [id]: newQty }));
  };

  // --- FUNGSI SIMPAN/UPDATE ---
// --- FUNGSI SIMPAN/UPDATE ---
  const handleSave = async () => {
    const selectedItems: StockItem[] = products
      .filter(p => (quantities[p.id!] || 0) > 0)
      .map(p => ({
        productId: p.id!,
        name: p.name,
        price: p.price,
        image: p.image,
        initialStock: quantities[p.id!],
        currentStock: quantities[p.id!], 
      }));

    if (selectedItems.length === 0) {
      notification.warning('Belum ada barang yang disiapkan');
      return;
    }

    try {
      setSaving(true);
      await saveVendorDailyStock(selectedItems); 
      
      // Munculkan notifikasi sukses
      notification.success(hasSavedToday ? 'Stok berhasil diperbarui!' : 'Stok tersimpan! Selamat berjualan');
      
      // --- PERUBAHAN DI SINI ---
      // Jangan gunakan router.back(). Kita arahkan langsung ke tab "Sudah Disiapkan"
      setHasSavedToday(true);   // Pastikan status tombol berubah jadi "Update Stok"
      setViewMode('prepared');  // Pindah tab secara otomatis
      // -------------------------

    } catch (error) {
      notification.error('Gagal menyimpan stok');
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER ITEM (Card Kasir) ---
  const renderItem = ({ item }: { item: Product }) => {
    const qty = quantities[item.id!] || 0;
    const isSelected = qty > 0;

    return (
      <View className={`flex-row bg-white p-3 rounded-2xl mb-4 shadow-sm border ${isSelected ? 'border-blue-400 bg-blue-50/10' : 'border-gray-100'}`}>
        <Image 
          source={{ uri: item.image || 'https://placehold.co/200' }} 
          className="w-20 h-20 rounded-xl bg-gray-100 mr-4"
          resizeMode="cover"
        />
        <View className="flex-1 justify-center">
          <Text className="font-bold text-gray-800 text-base mb-1" numberOfLines={2}>{item.name}</Text>
          <Text className="text-blue-600 font-extrabold text-sm mb-2">Rp {item.price.toLocaleString('id-ID')}</Text>
          <Text className="text-xs text-gray-400 bg-gray-100 self-start px-2 py-1 rounded-md">{item.category}</Text>
        </View>

        <View className="justify-center items-end ml-2">
          {qty === 0 ? (
            <TouchableOpacity 
              onPress={() => updateQty(item.id!, 1)}
              className="bg-blue-600 px-5 py-2.5 rounded-full shadow-sm"
            >
              <Text className="text-white font-bold text-xs">Tambah</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center bg-gray-50 rounded-full border border-gray-200 p-1 shadow-sm">
              <TouchableOpacity onPress={() => updateQty(item.id!, -1)} className="w-9 h-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
                <Feather name={qty === 1 ? "trash-2" : "minus"} size={16} color={qty === 1 ? "#ef4444" : "#4b5563"} />
              </TouchableOpacity>
              
              <TextInput
                value={qty.toString()}
                onChangeText={(text) => handleManualInput(item.id!, text)}
                keyboardType="number-pad"
                selectTextOnFocus
                className="w-10 text-center text-base font-extrabold text-gray-800"
              />
              
              <TouchableOpacity onPress={() => updateQty(item.id!, 1)} className="w-9 h-9 items-center justify-center rounded-full bg-blue-600 shadow-sm">
                <Feather name="plus" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-50">
        
        {/* --- HEADER --- */}
        <View className="bg-white pt-12 pb-2 shadow-sm z-10">
          <View className="px-5 flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-gray-50">
                <Ionicons name="arrow-back" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text className="text-xl font-extrabold ml-3 text-gray-800">Persiapan Bawaan</Text>
            </View>
          </View>

          {/* TAB SWITCHER */}
          <View className="flex-row px-5 mb-4">
            <TouchableOpacity 
              onPress={() => setViewMode('prepared')}
              className={`flex-1 py-3 border-b-2 items-center ${viewMode === 'prepared' ? 'border-blue-600' : 'border-transparent'}`}
            >
              <Text className={`font-bold ${viewMode === 'prepared' ? 'text-blue-600' : 'text-gray-400'}`}>
                Sudah Disiapkan ({preparedItemsList.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode('catalog')}
              className={`flex-1 py-3 border-b-2 items-center ${viewMode === 'catalog' ? 'border-blue-600' : 'border-transparent'}`}
            >
              <Text className={`font-bold ${viewMode === 'catalog' ? 'text-blue-600' : 'text-gray-400'}`}>
                Katalog Produk
              </Text>
            </TouchableOpacity>
          </View>

          {/* KOLOM PENCARIAN & KATEGORI (Hanya di mode Catalog) */}
          {viewMode === 'catalog' && !loading && (
            <View className="pb-3 border-b border-gray-100">
  <View className="px-5 mb-3">
    {/* Ubah py-0 menjadi py-2 agar ada ruang di atas & bawah */}
    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2 border border-gray-200">
      <Ionicons name="search" size={20} color="#9ca3af" />
      <TextInput
        placeholder="Cari nama produk..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        // Ubah font-small jadi text-sm, dan h-4 jadi h-10 (tinggi standar input 40px)
        className="flex-1 ml-2 text-gray-800 text-sm font-medium h-10"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}
    </View>
  </View>

  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
    {categories.map((cat) => (
      <TouchableOpacity
        key={cat}
        onPress={() => setSelectedCategory(cat)}
        className={`px-4 py-2 rounded-full border ${selectedCategory === cat ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300'}`}
      >
        <Text className={`font-bold text-xs ${selectedCategory === cat ? 'text-white' : 'text-gray-600'}`}>
          {cat}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
          )}
        </View>

        {/* --- LIST PRODUK (Dengan KeyboardAwareFlatList) --- */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 text-gray-400 font-medium">Memuat stok...</Text>
          </View>
        ) : displayedProducts.length === 0 ? (
          <View className="flex-1 justify-center items-center px-10">
            <Ionicons name={viewMode === 'prepared' ? "basket-outline" : "search-outline"} size={80} color="#e5e7eb" />
            <Text className="text-gray-500 mt-4 text-lg font-bold text-center">
              {viewMode === 'prepared' 
                ? 'Belum ada barang yang disiapkan' 
                : searchQuery ? 'Produk tidak ditemukan' : 'Katalog kosong'}
            </Text>
            {viewMode === 'prepared' && (
              <TouchableOpacity onPress={() => setViewMode('catalog')} className="mt-4 bg-blue-100 px-6 py-3 rounded-full">
                <Text className="text-blue-700 font-bold">+ Tambah Barang Baru</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
<KeyboardAwareFlatList
            data={displayedProducts}
            keyExtractor={(item) => item.id!}
            renderItem={renderItem}
            enableOnAndroid={true}
            
            // --- PERBAIKAN SCROLL KEYBOARD ---
            // Mengangkat layar ekstra tinggi agar tidak tertutup tombol "Simpan"
            extraScrollHeight={Platform.OS === 'ios' ? 80 : 120} 
            extraHeight={120} 
            // ---------------------------------
            
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            // Tambahkan paddingBottom sedikit lebih besar (150)
            contentContainerStyle={{ padding: 20, paddingBottom: 150 }} 
          />
        )}

        {/* --- FLOATING ACTION BUTTON (Detail Estimasi) --- */}
        {viewMode === 'prepared' && preparedItemsList.length > 0 && !Keyboard.isVisible() && (
          <TouchableOpacity 
            onPress={() => setShowDetailModal(true)}
            activeOpacity={0.8}
            className="absolute bottom-28 right-5 bg-orange-500 w-14 h-14 rounded-full flex justify-center items-center shadow-lg shadow-orange-300 z-20"
          >
            <Ionicons name="receipt" size={24} color="white" />
            <View className="absolute -top-1 -right-1 bg-red-600 w-5 h-5 rounded-full items-center justify-center border-2 border-white">
              <Text className="text-white text-[10px] font-bold">{preparedItemsList.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* --- TOMBOL BAWAH FIXED (Simpan/Update) --- */}
        <View className="absolute bottom-0 w-full p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10">
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            className={`py-4 rounded-2xl flex-row justify-center items-center gap-2 ${saving ? 'bg-gray-400' : 'bg-green-600'}`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-extrabold text-lg">
                  {hasSavedToday ? 'UPDATE STOK HARI INI' : 'SIMPAN PERSIAPAN'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* --- MODAL POP UP (STRUK DETAIL ESTIMASI) --- */}
        <Modal
          visible={showDetailModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl pt-5 pb-8 px-6 max-h-[80%]">
              
              {/* Header Modal */}
              <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <View>
                  <Text className="text-xl font-extrabold text-gray-800">Detail Persiapan</Text>
                  <Text className="text-sm text-gray-500">Estimasi pendapatan jika laku semua</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDetailModal(false)} className="bg-gray-100 p-2 rounded-full">
                  <Ionicons name="close" size={24} color="#4b5563" />
                </TouchableOpacity>
              </View>

              {/* List Belanjaan di Dalam Modal */}
              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {preparedItemsList.map((item, index) => {
                  const qty = quantities[item.id!];
                  const subtotal = item.price * qty;
                  return (
                    <View key={index} className="flex-row justify-between items-center mb-4">
                      <View className="flex-row items-center flex-1">
                        <View className="bg-blue-50 w-8 h-8 rounded-lg items-center justify-center mr-3 border border-blue-100">
                          <Text className="text-blue-600 font-bold">{qty}x</Text>
                        </View>
                        <Text className="text-gray-700 font-bold text-base flex-1" numberOfLines={1}>{item.name}</Text>
                      </View>
                      <Text className="font-bold text-gray-800">Rp {subtotal.toLocaleString('id-ID')}</Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Total Estimasi Pendapatan */}
              <View className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mt-2">
                <Text className="text-orange-600 font-bold text-xs uppercase mb-1">Total Estimasi Pendapatan</Text>
                <Text className="text-3xl font-extrabold text-orange-600">
                  Rp {estimatedRevenue.toLocaleString('id-ID')}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="information-circle" size={16} color="#f97316" />
                  <Text className="text-orange-500 text-xs ml-1 font-medium">Semangat berdagang hari ini!</Text>
                </View>
              </View>

            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}