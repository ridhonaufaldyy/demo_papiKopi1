import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert("Error", "Email, nama, dan password harus diisi");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter");
      return;
    }

    try {
      setLoading(true);

      // 1. Register ke Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2. Simpan data user ke Firestore dengan role default "user"
      await setDoc(doc(db, "users", uid), {
        email,
        name,
        role: "user", // Default role untuk user baru
        createdAt: serverTimestamp(),
      });

      Alert.alert("Sukses", "Akun berhasil dibuat! Silakan login dengan akun Anda");

      // Reset form
      setEmail("");
      setName("");
      setPassword("");
      setConfirmPassword("");

      // Navigasi ke login screen
      router.replace("/(auth)/login");

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi error saat registrasi";
      Alert.alert("Error", errorMessage);
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
            Buat Akun
          </Text>
          <Text className="text-center text-gray-600 text-base">
            Daftar untuk memulai
          </Text>
        </View>

        {/* Form */}
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6">

          {/* Nama */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">Nama Lengkap</Text>
            <TextInput
              placeholder="Masukkan nama lengkap"
              value={name}
              onChangeText={setName}
              editable={!loading}
              placeholderTextColor="#999"
              className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
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

          {/* Password */}
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
            <Text className="text-gray-500 text-xs mt-1">
              Minimal 6 karakter
            </Text>
          </View>

          {/* Confirm */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">
              Konfirmasi Password
            </Text>
            <TextInput
              placeholder="Ketik ulang password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
              placeholderTextColor="#999"
              className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
              secureTextEntry
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className={`rounded-lg py-3 flex-row justify-center items-center ${
              loading ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-bold text-lg">Daftar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-600">Sudah punya akun? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-blue-600 font-bold text-base">Login</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </ScrollView>
  );
}
