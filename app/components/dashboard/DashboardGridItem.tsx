import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DashboardGridItemProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  themeColor: string;
  bgAccent: string;
}

export const DashboardGridItem = ({
  title,
  icon,
  onPress,
  themeColor,
  bgAccent,
}: DashboardGridItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      // --- PERUBAHAN GAYA ---
      // 1. w-[47%]: Agar muat 2 kolom dengan spasi di tengah
      // 2. aspect-square: Agar bentuknya kotak persegi (seperti aplikasi HP pada umumnya)
      // 3. justify-center & items-center: Konten di tengah
      // 4. flex-col: Susunan vertikal (Icon atas, Teks bawah)
      className="w-[47%] aspect-square bg-white rounded-3xl mb-5 shadow-sm border border-gray-100 items-center justify-center"
      style={{ elevation: 3 }} // Shadow sedikit lebih tebal agar timbul
    >
      {/* Icon Container */}
      {/* Kita buat circle sedikit lebih besar agar terlihat 'clean' */}
      <View 
        className={`w-16 h-16 rounded-full ${bgAccent} items-center justify-center mb-4`}
      >
        <Feather name={icon} size={28} color={themeColor} />
      </View>
      
      {/* Title */}
      <Text className="text-gray-700 font-bold text-center text-sm px-2">
        {title}
      </Text>
    </TouchableOpacity>
  );
};