import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router'; // 1. Import useLocalSearchParams
import React, { useEffect, useState } from 'react'; // 2. Import useEffect
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

// Import fungsi updateProduct juga
import { addProduct, updateProduct, uploadImage } from '@/lib/product-service';
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
  
  // 3. Ambil parameter dari navigasi
  const params = useLocalSearchParams();
  const { id, editMode, productData } = params;
  const isEditing = editMode === 'true';

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    image: null as string | null,
  });

  // --- 4. useEffect: Isi Form jika Mode Edit ---
  useEffect(() => {
    if (isEditing && productData) {
      try {
        const data = JSON.parse(productData as string);
        setForm({
          name: data.name,
          price: data.price.toString(), // Ubah angka ke string untuk Input
          category: data.category,
          image: data.image, // URL gambar lama
        });
        
        // Update judul halaman navigasi (Opsional)
        router.setParams({ title: 'Edit Produk' });
      } catch (error) {
        console.error("Gagal parsing data produk", error);
      }
    }
  }, [editMode, productData]);

  // Fungsi Ganti Input Text
  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Fungsi Pilih Gambar
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Anda perlu mengizinkan akses galeri.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setForm(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  // --- 5. Logika Simpan (Cerdas) ---
  const handleSave = async () => {
    // Validasi Dasar
    if (!form.name || !form.price || !form.category) {
      return Alert.alert('Validasi', 'Nama, Harga, dan Kategori wajib diisi');
    }
    if (!form.image) {
      return Alert.alert('Validasi', 'Gambar wajib dipilih');
    }

    try {
      setLoading(true);
      let finalImageUrl = form.image;

      // LOGIKA SMART UPLOAD:
      // Kita hanya upload ke Cloudinary jika gambarnya berasal dari galeri HP (file://...)
      // Jika gambarnya masih link lama (https://...), berarti user tidak ganti gambar.
      const isLocalFile = form.image.startsWith('file://');
      
      if (isLocalFile) {
        finalImageUrl = await uploadImage(form.image);
      }

      const payload = {
        name: form.name,
        category: form.category,
        image: finalImageUrl,
        price: parseInt(form.price),
      };

      if (isEditing) {
        // --- MODE EDIT: Update Data ---
        if (!id) throw new Error("ID Produk hilang");
        await updateProduct(id as string, payload);
        Alert.alert('Sukses', 'Produk berhasil diperbarui!');
      } else {
        // --- MODE TAMBAH: Buat Baru ---
        await addProduct(payload);
        Alert.alert('Sukses', 'Produk berhasil ditambahkan!');
      }
      
      router.back();
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header Dinamis */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center bg-white">
        <Feather 
          name="arrow-left" 
          size={24} 
          color="#1f2937" 
          onPress={() => router.back()} 
        />
        <Text className="text-xl font-bold ml-4 text-gray-800">
          {isEditing ? 'Edit Produk' : 'Tambah Produk'}
        </Text>
      </View>

      <View className="p-6">
        
        {/* Upload Gambar Area */}
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

        {/* Custom Dropdown */}
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

        {/* Tombol Simpan Dinamis */}
        <Button 
          title={isEditing ? "Simpan Perubahan" : "Simpan Produk"}
          onPress={handleSave} 
          loading={loading}
          className="mt-6 bg-red-600"
        />
      </View>

      {/* Modal Kategori */}
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