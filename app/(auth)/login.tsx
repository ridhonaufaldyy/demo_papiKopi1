import { loginWithEmailPassword } from '@/lib/auth-utils';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    try {
      setLoading(true);
      
      // Login dan dapatkan user data dengan role
      const userData = await loginWithEmailPassword(email, password);
      
      Alert.alert('Sukses', `Login berhasil! Role: ${userData.role}`);
      
      // Navigasi berdasarkan role
      if (userData.role === 'admin') {
        router.replace('/(admin)/dashboard'); // Ganti dengan route admin Anda
      } else {
        router.replace('/(user)/dashboard'); // Ganti dengan route user Anda
      }
      
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Terjadi error saat login';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <View className="px-6 pt-16 pb-8">
        {/* Header */}
        <View className="mb-12">
          <Text className="text-4xl font-bold text-center text-blue-600 mb-2">
            Selamat Datang
          </Text>
          <Text className="text-center text-gray-600 text-base">
            Masuk ke akun Anda
          </Text>
        </View>

        {/* Form Container */}
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          {/* Email Input */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">Email</Text>
            <TextInput
              placeholder="Masukkan email Anda"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              placeholderTextColor="#999"
              className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">Password</Text>
            <TextInput
              placeholder="Masukkan password"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              placeholderTextColor="#999"
              className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
              secureTextEntry
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-lg py-3 flex-row justify-center items-center ${
              loading ? 'bg-gray-400' : 'bg-blue-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-bold text-lg">Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle to Register */}
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-600">Belum punya akun? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-blue-600 font-bold text-base">Daftar</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Info Box */}
        {/* <View className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
          <Text className="text-gray-700 text-xs text-center">
            💡 Tip: Gunakan email dan password apapun untuk testing
          </Text>
        </View> */}
      </View>
    </ScrollView>
  );
}
