import { loginWithEmailPassword } from '@/lib/auth-utils';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNotification } from '../components/ui/NotificationContainer';

export default function LoginScreen() {
  const router = useRouter();
  const notification = useNotification();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Helper sederhana untuk update state
  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      notification.warning('Email dan password harus diisi');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Proses Login
      await loginWithEmailPassword(form.email, form.password);
      
      // 2. Navigasi Sederhana
      notification.success('Login berhasil!');
      router.replace('/dashboard');
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login gagal';
      notification.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="flex-1 px-6 justify-center pb-10">
        
        {/* Header Section */}
        <View className="mb-10">
          <Text className="text-4xl font-bold text-blue-600 mb-2 text-center">
            Selamat Datang
          </Text>
          <Text className="text-gray-500 text-center">
            Masuk ke aplikasi Clean Code
          </Text>
        </View>

        {/* Form Section */}
        <View>
          <Input
            label="Email"
            placeholder="nama@email.com"
            value={form.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="••••••"
            value={form.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
          />

          <Button 
            title="Masuk" 
            onPress={handleLogin} 
            loading={loading} 
            className="mt-4"
          />
        </View>

        {/* Footer Section */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Belum punya akun? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-blue-600 font-bold">Daftar sekarang</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </ScrollView>
  );
}