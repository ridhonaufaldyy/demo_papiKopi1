import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNotification } from '../components/ui/NotificationContainer';

import { auth, db } from "@/lib/firebase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function RegisterScreen() {
  const router = useRouter();
  const notification = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const { name, email, password, confirmPassword } = form;

    // Validasi Dasar
    if (!name.trim() || !email.trim() || !password.trim()) {
      notification.warning("Semua data wajib diisi");
      return;
    }
    if (password !== confirmPassword) {
      notification.error("Password dan konfirmasi tidak cocok");
      return;
    }
    if (password.length < 6) {
      notification.error("Password minimal 6 karakter");
      return;
    }

    try {
      setLoading(true);

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Simpan Data ke Firestore
      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      notification.success("Akun berhasil dibuat!");
      router.replace("/(auth)/login");

    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mendaftar";
      notification.error(msg);
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

        {/* Form Section */}
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