import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Definisikan tipe props agar TypeScript senang
interface DashboardGridItemProps {
  title: string;
  icon: keyof typeof Feather.glyphMap; // Validasi nama icon otomatis
  onPress?: () => void;
  themeColor: string;   // Warna Icon (Hex code)
  bgAccent: string;     // Class background bulat (misal: 'bg-red-50')
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
      // Style Container: w-[48%] agar muat 2 kolom
      className="w-[48%] bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 items-center justify-center"
      style={{ elevation: 2 }} // Shadow khusus Android
    >
      {/* Icon Circle Container */}
      <View 
        className={`w-14 h-14 rounded-full ${bgAccent} items-center justify-center mb-3`}
      >
        <Feather name={icon} size={24} color={themeColor} />
      </View>
      
      {/* Title */}
      <Text className="text-gray-700 font-semibold text-center text-sm">
        {title}
      </Text>
    </TouchableOpacity>
  );
};