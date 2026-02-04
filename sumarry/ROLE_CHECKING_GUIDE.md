# Panduan Role Checking Saat Login

## Fitur yang Ditambahkan

Sistem pengecekan role (user/admin) saat login telah diimplementasikan dengan fitur:

1. **Login dengan pengecekan role** - Saat user login, sistem akan mengecek role mereka dari Firestore
2. **Navigasi otomatis** - User akan diarahkan ke halaman yang berbeda berdasarkan role mereka
3. **Auth Context** - Menyediakan informasi user dan role di seluruh aplikasi

## File-file yang Dibuat/Diubah

### 1. `lib/auth-utils.ts` (BARU)
Utility functions untuk authentication dan role checking:
- `loginWithEmailPassword()` - Login dan ambil user data dengan role
- `getUserRole()` - Ambil role dari user
- `getUserData()` - Ambil data user lengkap

### 2. `lib/auth-context.tsx` (BARU)
Context provider untuk menyimpan auth state:
- `AuthProvider` - Wrapper component untuk aplikasi
- `useAuth()` - Hook untuk akses user data dan role di component manapun

### 3. `app/(auth)/login.tsx` (DIUBAH)
Update login screen dengan:
- Firebase authentication
- Pengecekan role
- Navigasi berdasarkan role

## Setup Firestore Database

Untuk sistem ini bekerja, Anda perlu membuat collection `users` di Firestore dengan struktur:

```
users/
  {userId}/
    {
      email: "user@example.com",
      role: "user" atau "admin",
      name: "Nama User",
      createdAt: "2024-01-01"
    }
```

Contoh roles:
- `"user"` - Role biasa
- `"admin"` - Role administrator

## Langkah-langkah Implementasi

### Step 1: Setup AuthProvider di Root Layout

Update file `app/_layout.tsx`:

```tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Stack dan component lainnya */}
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### Step 2: Buat Dashboard Routes

Buat folder dan file untuk user dan admin:

**User Dashboard** (`app/(user)/dashboard.tsx`):
```tsx
import { useAuth } from '@/lib/auth-context';
import { View, Text } from 'react-native';

export default function UserDashboard() {
  const { userData } = useAuth();
  
  return (
    <View>
      <Text>Selamat datang, {userData?.name}</Text>
    </View>
  );
}
```

**Admin Dashboard** (`app/(admin)/dashboard.tsx`):
```tsx
import { useAuth } from '@/lib/auth-context';
import { View, Text } from 'react-native';

export default function AdminDashboard() {
  const { userData, isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Text>Anda tidak memiliki akses admin</Text>;
  }
  
  return (
    <View>
      <Text>Admin Panel - {userData?.name}</Text>
    </View>
  );
}
```

### Step 3: Update Navigation Stack

Update `app/_layout.tsx` untuk menambahkan auth groups:

```tsx
<Stack>
  <Stack.Screen name="index" />
  <Stack.Screen name="(auth)/login" />
  <Stack.Screen name="(auth)/register" />
  <Stack.Screen name="(user)/dashboard" />
  <Stack.Screen name="(admin)/dashboard" />
</Stack>
```

## Menggunakan Auth di Component

### Akses User Info
```tsx
import { useAuth } from '@/lib/auth-context';

export default function MyComponent() {
  const { user, userData, isAdmin, loading } = useAuth();
  
  if (loading) return <Text>Loading...</Text>;
  
  return (
    <View>
      <Text>Email: {userData?.email}</Text>
      <Text>Role: {userData?.role}</Text>
      <Text>Is Admin: {isAdmin ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

### Logout
```tsx
const { logout } = useAuth();

const handleLogout = async () => {
  try {
    await logout();
    router.replace('/(auth)/login');
  } catch (error) {
    Alert.alert('Error', 'Gagal logout');
  }
};
```

## Membuat User dengan Role di Firestore

### Cara 1: Melalui Admin SDK (Backend/Cloud Function)

```javascript
// Cloud Function atau backend
const admin = require('firebase-admin');

exports.createUserWithRole = functions.https.onCall(async (data, context) => {
  const { email, password, name, role } = data;
  
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: name,
  });
  
  // Simpan role di Firestore
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    email,
    name,
    role: role || 'user', // 'user' atau 'admin'
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { uid: userRecord.uid };
});
```

### Cara 2: Manual di Firebase Console

1. Buat user di Authentication
2. Salin UID user
3. Buat document di collection `users` dengan UID sebagai document ID
4. Isi fields: email, role, name, createdAt

## Testing

### Test Login dengan Role User
```
Email: user@example.com
Password: userpassword123
Role: user
→ Navigasi ke /(user)/dashboard
```

### Test Login dengan Role Admin
```
Email: admin@example.com
Password: adminpassword123
Role: admin
→ Navigasi ke /(admin)/dashboard
```

## Error Handling

Sistem sudah menangani error untuk:
- Email/password tidak diisi
- User tidak terdaftar
- User data tidak ada di Firestore
- Koneksi Firebase gagal

## Troubleshooting

### "User data tidak ditemukan di database"
- Pastikan user sudah dibuat di collection `users` dengan struktur yang benar
- Pastikan document ID sama dengan user UID dari Firebase Auth

### Login berhasil tapi navigasi error
- Pastikan route `/(user)/dashboard` dan `/(admin)/dashboard` sudah dibuat
- Check di `app/_layout.tsx` sudah include kedua route tersebut

### Auth context undefined
- Pastikan `AuthProvider` sudah wrap aplikasi di `_layout.tsx`
- Pastikan `useAuth()` hanya digunakan di component yang ada di dalam `AuthProvider`

## Keamanan

1. **Firestore Security Rules** - Set rules agar user hanya bisa baca data mereka sendiri
2. **Custom Claims** - Tambahkan custom claims di JWT untuk extra security
3. **Server-side validation** - Selalu validasi role di backend untuk operasi sensitif
