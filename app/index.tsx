import { Link } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-center px-6">

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="bg-blue-600 rounded-lg py-3 mb-4">
            <Text className="text-white text-center font-bold">Login</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity className="bg-gray-300 rounded-lg py-3">
            <Text className="text-center font-bold">Register</Text>
          </TouchableOpacity>
        </Link>

      </View>
    </ScrollView>
  );
}
