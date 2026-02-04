import { useAuth } from '@/lib/auth-context';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function TabsLayout() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }

  // Warna aktif berdasarkan role (Merah untuk Admin, Biru untuk User)
  const themeColor = userData?.role === 'admin' ? '#ef4444' : '#2563eb';

return (
    <Tabs screenOptions={{ headerShown: false, /* ...style lainnya */ }}>
      
      {/* Pastikan name="dashboard" sesuai dengan nama file dashboard.tsx */}
      <Tabs.Screen
        name="dashboard" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}