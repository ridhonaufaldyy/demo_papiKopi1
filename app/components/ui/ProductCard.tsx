import { Product, formatRupiah } from '@/lib/product-service';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
}

export const ProductCard = ({ item, onPress }: ProductCardProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden flex-row"
    >
      {/* Gambar Produk */}
      <Image 
        source={{ uri: item.image || 'https://placehold.co/100x100/png' }} 
        className="w-24 h-24 bg-gray-200"
        resizeMode="cover"
      />

      {/* Detail Produk */}
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-gray-800 font-bold text-lg" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-gray-500 text-xs bg-gray-100 self-start px-2 py-1 rounded-md mt-1">
            {item.category}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-blue-600 font-bold text-base">
            {formatRupiah(item.price)}
          </Text>
          
          {/* Tombol Add Kecil */}
          <View className="bg-blue-600 rounded-full p-1.5">
            <Feather name="plus" size={16} color="white" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};