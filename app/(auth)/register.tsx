import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { auth, db } from "@/lib/firebase";
// Import komponen reusable (Pastikan file ini sudah dibuat sesuai langkah sebelumnya)
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. Menggunakan Single State Object (Lebih rapi daripada banyak useState)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Helper function untuk update state dinamis
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    // Destructuring untuk kemudahan akses
    const { name, email, password, confirmPassword } = form;

    // Validasi Dasar
    if (!name.trim() || !email.trim() || !password.trim()) {
      return Alert.alert("Validasi", "Semua data wajib diisi.");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Validasi", "Password dan konfirmasi tidak cocok.");
    }
    if (password.length < 6) {
      return Alert.alert("Validasi", "Password minimal 6 karakter.");
    }

    try {
      setLoading(true);

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Simpan Data ke Firestore
      // Tips: Logic ini idealnya dipisah ke file terpisah (misal: lib/auth-service.ts)
      // tapi untuk sekarang kita simpan disini agar konteks tetap jelas.
      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Sukses", "Akun berhasil dibuat! Silakan login.");
      router.replace("/(auth)/login");

    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mendaftar";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="flex-1 px-6 justify-center py-10">

        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-center text-blue-600 mb-2">
            Buat Akun
          </Text>
          <Text className="text-center text-gray-500">
            Isi formulir di bawah untuk memulai
          </Text>
        </View>

        {/* Form Section - Bersih & Mudah Dibaca */}
        <View className="mb-6">
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Budi Santoso"
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="nama@email.com"
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry
          />

          <Input
            label="Konfirmasi Password"
            placeholder="Ketik ulang password"
            value={form.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
            secureTextEntry
            // Opsional: Berikan visual error jika tidak cocok saat mengetik
            error={
              form.confirmPassword && form.password !== form.confirmPassword 
                ? "Password tidak cocok" 
                : undefined
            }
          />

          <Button
            title="Daftar Sekarang"
            onPress={handleRegister}
            loading={loading}
            className="mt-4"
          />
        </View>

        {/* Footer Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-600">Sudah punya akun? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-blue-600 font-bold">Login disini</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </ScrollView>
  );
}