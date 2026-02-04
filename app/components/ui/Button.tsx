import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const Button = ({ 
  title, 
  loading, 
  variant = 'primary', 
  className, 
  disabled,
  ...props 
}: ButtonProps) => {
  
  // Helper untuk menentukan warna background
  const getBgColor = () => {
    if (disabled || loading) return 'bg-gray-400';
    switch (variant) {
      case 'secondary': return 'bg-gray-200';
      case 'danger': return 'bg-red-600';
      case 'outline': return 'bg-transparent border-2 border-blue-600';
      default: return 'bg-blue-600'; // primary
    }
  };

  // Helper untuk warna text
  const getTextColor = () => {
    if (variant === 'secondary') return 'text-gray-800';
    if (variant === 'outline') return 'text-blue-600';
    return 'text-white';
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`${getBgColor()} rounded-lg py-3 flex-row justify-center items-center ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#000' : '#fff'} size="small" />
      ) : (
        <Text className={`${getTextColor()} font-bold text-lg`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};