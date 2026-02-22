import { Product, formatRupiah } from '@/lib/product-service';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  item: Product;
  // Tanda tanya (?) artinya Opsional (Boleh ada, boleh tidak)
  onPress?: () => void;  // Untuk klik kartu biasa (Dashboard)
  onEdit?: () => void;   // Untuk tombol Edit (Admin)
  onDelete?: () => void; // Untuk tombol Hapus (Admin)
}

export const ProductCard = ({ item, onPress, onEdit, onDelete }: ProductCardProps) => {
  // Tentukan apakah ini Mode Admin (Jika onEdit & onDelete ada isinya)
  const isAdminMode = onEdit && onDelete;

  // Jika ada onPress, bungkus pakai TouchableOpacity. Jika tidak, pakai View biasa.
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 flex-row h-32 overflow-hidden"
    >
      
      {/* GAMBAR FULL HEIGHT */}
      <Image 
        source={{ uri: item.image || 'https://placehold.co/150' }} 
        className="w-32 h-full bg-gray-200"
        resizeMode="cover"
      />

      {/* Konten Sebelah Kanan */}
      <View className="flex-1 p-3 justify-between">
        
        {/* Info Produk */}
        <View>
          <View className="flex-row justify-between items-start">
             <Text className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded mb-1 self-start">
              {item.category}
            </Text>
          </View>
          <Text className="text-gray-800 font-bold text-base" numberOfLines={2}>
            {item.name}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            {formatRupiah(item.price)}
          </Text>
        </View>

        {/* AREA TOMBOL ADMIN (Hanya muncul jika props onEdit/onDelete dikirim) */}
        {isAdminMode && (
          <View className="flex-row justify-end space-x-3 gap-2">
            
            {/* Tombol Edit */}
            <TouchableOpacity 
              onPress={onEdit}
              className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
            >
              <Feather name="edit-2" size={14} color="#2563eb" />
              <Text className="text-blue-600 text-xs font-bold ml-1">Edit</Text>
            </TouchableOpacity>

            {/* Tombol Delete */}
            <TouchableOpacity 
              onPress={onDelete}
              className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
            >
              <Feather name="trash-2" size={14} color="#dc2626" />
              <Text className="text-red-600 text-xs font-bold ml-1">Hapus</Text>
            </TouchableOpacity>

          </View>
        )}

      </View>
    </Container>
  );
};