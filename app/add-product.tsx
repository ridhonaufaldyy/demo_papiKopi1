import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Import Image Picker
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { addProduct, uploadImage } from '@/lib/product-service';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

// Pilihan Kategori
const CATEGORIES = [
  { id: '1', name: 'Coffee' },
  { id: '2', name: 'Non-Coffee' },
  { id: '3', name: 'Snack' },
  { id: '4', name: 'Makanan Berat' },
];

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // State untuk Dropdown
  
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    image: null as string | null, // Ubah jadi null defaultnya
  });

  

  // --- 1. Fungsi Ganti Input Text ---
  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // --- 2. Fungsi Pilih Gambar dari Galeri ---
  const pickImage = async () => {
    // Meminta izin akses galeri
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Anda perlu mengizinkan akses kamera/galeri.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Bisa crop
      aspect: [1, 1],      // Rasio kotak
      quality: 0.5,        // Kompres sedikit agar tidak terlalu besar
    });

    if (!result.canceled) {
      setForm(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  // --- 3. Fungsi Simpan (Dengan Logika Upload) ---
const handleSave = async () => {
    // 1. Validasi
    if (!form.name || !form.price || !form.category) {
      return Alert.alert('Validasi', 'Data wajib diisi semua');
    }
    if (!form.image) {
      return Alert.alert('Validasi', 'Gambar wajib dipilih');
    }

    try {
      setLoading(true);

      // 2. PROSES UPLOAD GAMBAR DULU
      // Mengubah file lokal (file://) menjadi URL Online (https://)
      const onlineImageUrl = await uploadImage(form.image);

      // 3. SIMPAN DATA KE DATABASE
      // Simpan URL onlinenya, bukan URI lokalnya
      await addProduct({
        name: form.name,
        category: form.category,
        image: onlineImageUrl, // <--- Pakai URL dari Firebase Storage
        price: parseInt(form.price),
      });
      
      Alert.alert('Sukses', 'Produk berhasil ditambahkan!');
      router.back();
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center bg-white">
        <Feather 
          name="arrow-left" 
          size={24} 
          color="#1f2937" 
          onPress={() => router.back()} 
        />
        <Text className="text-xl font-bold ml-4 text-gray-800">Tambah Produk</Text>
      </View>

      <View className="p-6">
        
        {/* --- UPLOAD GAMBAR AREA --- */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {form.image ? (
              <Image 
                source={{ uri: form.image }} 
                className="w-40 h-40 rounded-2xl bg-gray-100 border border-gray-200" 
              />
            ) : (
              <View className="w-40 h-40 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 items-center justify-center">
                <Feather name="camera" size={32} color="#9ca3af" />
                <Text className="text-gray-400 text-xs mt-2">Ketuk untuk Upload</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-blue-500 mt-2 font-medium" onPress={pickImage}>
            {form.image ? 'Ganti Gambar' : 'Pilih dari Galeri'}
          </Text>
        </View>

        {/* Form Input */}
        <Input 
          label="Nama Produk" 
          placeholder="Contoh: Kopi Gula Aren"
          value={form.name}
          onChangeText={(t) => handleChange('name', t)}
        />
        
        <Input 
          label="Harga (Rp)" 
          placeholder="15000"
          keyboardType="numeric"
          value={form.price}
          onChangeText={(t) => handleChange('price', t)}
        />

        {/* --- CUSTOM DROPDOWN (KATEGORI) --- */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Kategori</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="border-2 border-gray-300 rounded-lg px-4 py-3 flex-row justify-between items-center bg-white"
          >
            <Text className={`text-base ${form.category ? 'text-black' : 'text-gray-400'}`}>
              {form.category || 'Pilih Kategori'}
            </Text>
            <Feather name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Button 
          title="Simpan Produk" 
          onPress={handleSave} 
          loading={loading}
          className="mt-6 bg-red-600"
        />
      </View>

      {/* --- MODAL UNTUK PILIHAN KATEGORI --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[50%]">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <Text className="text-xl font-bold text-gray-800">Pilih Kategori</Text>
              <Feather name="x" size={24} color="black" onPress={() => setModalVisible(false)} />
            </View>
            
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-4 border-b border-gray-100 flex-row items-center justify-between"
                  onPress={() => {
                    handleChange('category', item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text className={`text-lg ${form.category === item.name ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                    {item.name}
                  </Text>
                  {form.category === item.name && (
                    <Feather name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}