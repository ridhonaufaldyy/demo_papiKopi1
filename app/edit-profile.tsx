import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { uploadImage } from '@/lib/product-service';
import { changeMyPassword, updateUserProfile } from '@/lib/user-service';

export default function EditProfileScreen() {
  const router = useRouter();
  
  // 1. AMBIL refreshUserData DARI CONTEXT
  const { userData, user, refreshUserData } = useAuth(); 

  const [loading, setLoading] = useState(false);
  
  // State menggunakan 'name'
  const [name, setName] = useState(userData?.name || user?.displayName || '');
  const [imageUri, setImageUri] = useState<string | null>(userData?.image || user?.photoURL || null);
  
  // State Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Fungsi Pilih Gambar
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Fungsi Simpan
  const handleSave = async () => {
    // Validasi field 'name'
    if (!name.trim()) {
      return Alert.alert("Validasi", "Nama tidak boleh kosong");
    }

    setLoading(true);
    try {
      // A. Update Foto & Nama
      let finalPhotoUrl = imageUri || '';

      // Jika gambar lokal (file://), upload dulu ke Cloudinary
      if (imageUri && imageUri.startsWith('file://')) {
        finalPhotoUrl = await uploadImage(imageUri);
      }

      if (user?.uid) {
        // Update ke service
        await updateUserProfile(user.uid, name, finalPhotoUrl);
      }

      // B. Update Password (Hanya jika diisi)
      if (newPassword) {
        if (!currentPassword) {
          Alert.alert("Keamanan", "Masukkan password lama untuk mengubah password.");
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          Alert.alert("Validasi", "Password baru minimal 6 karakter.");
          setLoading(false);
          return;
        }
        
        await changeMyPassword(currentPassword, newPassword);
        Alert.alert("Sukses", "Data Profil dan Password berhasil diperbarui!");
      } else {
        Alert.alert("Sukses", "Data Profil berhasil diperbarui!");
      }

      // 2. HOT RELOAD: Ambil data terbaru agar UI langsung berubah
      await refreshUserData();

      router.back();

    } catch (error: any) {
      Alert.alert("Gagal", error.message || "Terjadi kesalahan saat update profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
        <Feather name="arrow-left" size={24} color="#1f2937" onPress={() => router.back()} />
        <Text className="text-xl font-bold ml-4 text-gray-800">Edit Profil</Text>
      </View>

      <View className="p-6">
        
        {/* --- Area Foto Profil --- */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={pickImage} className="relative">
            <Image 
              source={{ uri: imageUri || 'https://placehold.co/150' }} 
              className="w-28 h-28 rounded-full bg-gray-200 border-4 border-white shadow-sm"
            />
            <View className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
              <Feather name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Form Input Nama --- */}
        <Text className="text-gray-700 font-bold mb-2">Nama Lengkap</Text>
        <TextInput 
          value={name}           
          onChangeText={setName} 
          placeholder="Nama Lengkap Anda"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-800"
        />

        <View className="h-[1px] bg-gray-100 my-2 mb-6" />

        {/* --- Form Ganti Password (Opsional) --- */}
        <Text className="text-gray-800 font-bold text-lg mb-4">Ganti Password</Text>
        
        <Text className="text-gray-500 text-xs mb-4 bg-blue-50 p-3 rounded-lg text-blue-700 border border-blue-100">
          Biarkan kosong jika tidak ingin mengubah password.
        </Text>

        <Text className="text-gray-700 font-semibold mb-2">Password Baru</Text>
        <TextInput 
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Password Baru (Min. 6 Karakter)"
          secureTextEntry
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800"
        />

        {/* Input Password Lama (Muncul jika password baru diisi) */}
        {newPassword.length > 0 && (
          <>
            <Text className="text-gray-700 font-semibold mb-2">Password Lama (Konfirmasi)</Text>
            <TextInput 
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Masukkan Password Lama"
              secureTextEntry
              className="bg-gray-50 border border-red-200 rounded-xl px-4 py-3 mb-2 text-gray-800"
            />
             <Text className="text-red-500 text-xs mb-4">* Wajib diisi untuk keamanan</Text>
          </>
        )}

        {/* --- Tombol Simpan --- */}
        <TouchableOpacity 
          onPress={handleSave}
          disabled={loading}
          className={`mt-6 py-4 rounded-xl flex-row justify-center items-center shadow-sm ${loading ? 'bg-gray-300' : 'bg-blue-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Feather name="save" size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-base ml-2">Simpan Perubahan</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}