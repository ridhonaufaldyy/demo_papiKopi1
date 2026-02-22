import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { getProducts, Product, saveVendorDailyStock, StockItem } from '@/lib/product-service';

export default function PreparationScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter Kategori
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // State Quantity
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'Semua') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      const uniqueCats = ['Semua', ...new Set(data.map(p => p.category))];
      setCategories(uniqueCats);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Tambah/Kurang via Tombol
  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // --- FUNGSI BARU: Input Manual via Keyboard ---
  const handleManualInput = (id: string, text: string) => {
    // Hapus karakter selain angka
    const cleanText = text.replace(/[^0-9]/g, '');
    
    // Konversi ke number (jika kosong jadi 0)
    const newQty = parseInt(cleanText) || 0;
    
    setQuantities(prev => ({ ...prev, [id]: newQty }));
  };

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
      return Alert.alert("Kosong", "Belum ada barang yang dimasukkan.");
    }

    try {
      setSaving(true);
      await saveVendorDailyStock(selectedItems);
      Alert.alert("Siap!", "Stok tersimpan. Selamat berjualan!", [
        { text: "Lanjut", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Gagal", "Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const qty = quantities[item.id!] || 0;
    const isSelected = qty > 0;

    return (
      <View className={`bg-white mb-4 rounded-2xl shadow-sm border-2 ${isSelected ? 'border-blue-500' : 'border-gray-100'}`}>
        <View className="p-4 flex-row">
          <Image 
            source={{ uri: item.image || 'https://placehold.co/150' }} 
            className="w-24 h-24 rounded-xl bg-gray-200"
            resizeMode="cover"
          />
          
          <View className="flex-1 ml-4 justify-center">
            <Text className="text-xl font-bold text-gray-900 leading-tight mb-1">{item.name}</Text>
            <Text className="text-gray-500 font-medium mb-2">{item.category}</Text>
            <Text className="text-blue-600 font-bold text-lg">Rp {item.price.toLocaleString()}</Text>
          </View>
        </View>

        {/* Kontrol Stok Besar */}
        <View className="flex-row items-center border-t border-gray-100 h-16">
          {/* Tombol KURANG */}
          <TouchableOpacity 
            onPress={() => updateQty(item.id!, -1)}
            activeOpacity={0.6}
            className="w-20 h-full bg-red-50 items-center justify-center border-r border-gray-100 rounded-bl-xl"
          >
            <Feather name="minus" size={32} color="#dc2626" />
          </TouchableOpacity>
          
          {/* --- INPUT ANGKA (BISA DIKETIK) --- */}
          <View className={`flex-1 h-full justify-center ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
            <TextInput
              value={qty === 0 ? '' : qty.toString()} // Jika 0 tampilkan kosong biar enak diketik (atau bisa '0')
              placeholder="0"
              onChangeText={(text) => handleManualInput(item.id!, text)}
              keyboardType="number-pad" // Keyboard Angka
              className={`text-3xl font-extrabold text-center ${isSelected ? 'text-blue-700' : 'text-gray-400'}`}
              selectTextOnFocus={true} // Agar pas diklik langsung ke-select semua (mudah ditimpa)
            />
          </View>
          
          {/* Tombol TAMBAH */}
          <TouchableOpacity 
            onPress={() => updateQty(item.id!, 1)}
            activeOpacity={0.6}
            className="w-20 h-full bg-blue-600 items-center justify-center rounded-br-xl"
          >
            <Feather name="plus" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    // Tambahkan TouchableWithoutFeedback agar keyboard menutup saat klik area kosong
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-50">
        {/* Header Statis */}
        <View className="bg-white pt-14 pb-2 border-b border-gray-200 shadow-sm z-10">
          <View className="px-6 flex-row items-center mb-4">
            <Feather name="arrow-left" size={28} color="#1f2937" onPress={() => router.back()} />
            <Text className="text-2xl font-bold ml-4 text-gray-800">Persiapan Stok</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`mr-3 px-6 py-3 rounded-full border ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`font-bold text-base ${selectedCategory === cat ? 'text-white' : 'text-gray-600'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List Produk */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id!}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled" // Agar scroll lancar saat keyboard muncul
            ListEmptyComponent={
              <View className="items-center py-20">
                <Feather name="package" size={50} color="#d1d5db" />
                <Text className="text-gray-400 mt-4 text-lg">Tidak ada produk di kategori ini</Text>
              </View>
            }
          />
        )}

        {/* Footer Floating Button */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            className={`h-16 rounded-2xl flex-row justify-center items-center ${saving ? 'bg-gray-400' : 'bg-green-600'}`}
          >
            {saving ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <>
                <Feather name="check-circle" size={28} color="white" className="mr-3" />
                <Text className="text-white font-bold text-xl">SELESAI & SIMPAN</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}