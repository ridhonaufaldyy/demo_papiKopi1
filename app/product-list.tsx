import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert, // Import Alert
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Import Service dan Component
import { deleteProduct, getProducts, Product } from '@/lib/product-service'; // Import deleteProduct
import { ProductCard } from './components/ui/ProductCard';

export default function ProductListScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Fungsi Ambil Data ---
  const fetchData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- LOGIKA DELETE ---
  const handleDelete = (item: Product) => {
    Alert.alert(
      "Hapus Produk",
      `Apakah Anda yakin ingin menghapus "${item.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive",
          onPress: async () => {
            try {
              if (item.id) {
                await deleteProduct(item.id);
                // Update state langsung tanpa fetch ulang agar lebih cepat (Optimistic UI)
                setProducts(prev => prev.filter(p => p.id !== item.id));
                Alert.alert("Sukses", "Produk berhasil dihapus");
              }
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus produk");
            }
          }
        }
      ]
    );
  };

  // --- LOGIKA EDIT ---
  const handleEdit = (item: Product) => {
    // Kita arahkan ke halaman edit (bisa menggunakan halaman add-product dengan parameter)
    router.push({
      pathname: '/add-product', // Pastikan rute ini benar
      params: { 
        id: item.id,
        editMode: 'true', // Flag untuk memberi tahu ini mode edit
        // Kita kirim data produk lewat params (stringified agar aman)
        productData: JSON.stringify(item) 
      }
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-200 flex-row items-center justify-between shadow-sm">
        <View className="flex-row items-center">
            <Feather 
              name="arrow-left" 
              size={24} 
              color="#1f2937" 
              onPress={() => router.back()} 
            />
            <Text className="text-xl font-bold ml-4 text-gray-800">Daftar Menu</Text>
        </View>
        <View className="bg-red-100 px-3 py-1 rounded-full">
            <Text className="text-red-600 text-xs font-bold">{products.length} Items</Text>
        </View>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className="text-gray-400 mt-2 text-sm">Memuat produk...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id || Math.random().toString()}
          
          // Menggunakan Props baru: onEdit & onDelete
          renderItem={({ item }) => (
            <ProductCard 
              item={item} 
              onEdit={() => handleEdit(item)} 
              onDelete={() => handleDelete(item)} 
            />
          )}
          
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <View className="bg-gray-100 p-6 rounded-full mb-4">
                  <Feather name="coffee" size={40} color="#9ca3af" />
              </View>
              <Text className="text-gray-800 font-bold text-lg">Belum ada menu</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC2626']} />
          }
        />
      )}

      {/* FAB Add */}
      <TouchableOpacity
        onPress={() => router.push('/add-product')}
        className="absolute bottom-8 right-6 bg-red-600 w-16 h-16 rounded-full items-center justify-center shadow-lg elevation-5"
        activeOpacity={0.8}
      >
        <Feather name="plus" size={32} color="white" />
      </TouchableOpacity>

    </View>
  );
}