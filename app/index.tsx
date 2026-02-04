import { Link } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-white justify-center items-center px-6">

        {/* Logo Area */}
        <View className="mb-12 items-center">
<Image
  source={require("../assets/images/logo.png")}
  className="w-48 h-24"
  resizeMode="contain"
/>

          {/* kalau mau tambah teks di bawah logo */}
          {/* 
          <Text className="mt-4 text-gray-500">
            Selamat Datang
          </Text> 
          */}
        </View>

        {/* Buttons */}
        <View className="w-full space-y-4">
          <Link href="/login" asChild>
            <TouchableOpacity className="bg-blue-600 rounded-lg py-3">
              <Text className="text-white font-bold text-center text-lg">
                Login
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/register" asChild>
            <TouchableOpacity className="bg-gray-200 rounded-lg py-3">
              <Text className="text-gray-800 font-bold text-center text-lg">
                Daftar
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </ScrollView>
  );
}
