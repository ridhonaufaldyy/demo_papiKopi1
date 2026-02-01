# Setup Expo + React Native + Nativewind + Firebase

## Deskripsi Project
Project ini menggunakan:
- **Expo** - Framework React Native
- **Nativewind** - Tailwind CSS untuk React Native
- **Firebase** - Backend & Authentication
- **React Navigation** - Navigasi

## Dependencies yang Terinstall

### Production Dependencies
- `expo` - Platform React Native
- `react-native` - Framework native
- `expo-router` - Navigasi file-based
- `nativewind` - Tailwind CSS untuk RN
- `tailwindcss` - Utility-first CSS
- `firebase` - Firebase SDK
- `react-navigation/*` - Navigasi tambahan
- `@react-native-async-storage/async-storage` - Persistent storage untuk Firebase Auth

### Dev Dependencies
- `postcss` - CSS processor untuk Tailwind
- `autoprefixer` - Auto vendor prefixing
- `typescript` - Type safety
- `eslint` - Linting

## Konfigurasi yang Sudah Dilakukan

### 1. **Firebase Config** (`firebaseConfig.js`)
```javascript
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// Login session akan persist bahkan setelah app ditutup
```

### 2. **Nativewind Setup**
- `babel.config.js` - Configured dengan `nativewind/babel` preset
- `tailwind.config.js` - Content path dan preset Nativewind
- `postcss.config.js` - PostCSS dengan Tailwind dan Autoprefixer
- `global.css` - Tailwind directives
- `nativewind-env.d.ts` - Type definitions

### 3. **Main Layout** (`app/_layout.tsx`)
```tsx
import '../global.css'; // Global CSS import
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
```

## Cara Menggunakan Nativewind

### Contoh Component dengan Tailwind Classes:
```tsx
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View className="flex-1 bg-white p-6 justify-center items-center">
      <Text className="text-2xl font-bold mb-4 text-center">
        Hello Nativewind!
      </Text>
      <View className="bg-blue-500 px-6 py-3 rounded-lg">
        <Text className="text-white font-semibold">Press Me</Text>
      </View>
    </View>
  );
}
```

### Styling Classes yang Tersedia:
- `flex`, `flex-1`, `flex-row`, `justify-center`, `items-center`, `p-6`
- `bg-white`, `bg-blue-500`, `rounded-lg`
- `text-2xl`, `font-bold`, `text-white`, `text-center`
- `mb-4`, `px-6`, `py-3` (spacing)
- Dan semua Tailwind utilities lainnya

## Cara Menggunakan Firebase Authentication

Lihat contoh di `components/auth-example.tsx`:

```tsx
import { auth } from '@/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Sign Up
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// Sign In
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Sign Out
await signOut(auth);
```

## Menjalankan Project

```bash
# Development
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Linting
npm run lint
```

## Troubleshooting

### CSS Module Warning
- Normal untuk Nativewind, TypeScript tidak mengenali `.css` import pada React Native
- Tidak mempengaruhi runtime

### Firebase Auth Persistence
- `AsyncStorage` memastikan user tetap login setelah app ditutup
- Sudah dikonfigurasi di `firebaseConfig.js`

### Tailwind Classes Tidak Bekerja
- Pastikan import `../global.css` ada di root layout
- Babel config sudah include `nativewind/babel`
- Jalankan `npm start -- --clear` untuk clear cache

## Struktur Project

```
project/
├── app/                    # Main app routes (expo-router)
│   ├── _layout.tsx        # Root layout dengan CSS & theme
│   ├── (tabs)/            # Tab navigation
│   └── modal.tsx
├── components/            # Reusable components
│   ├── auth-example.tsx   # Firebase Auth example
│   └── ...
├── firebaseConfig.js      # Firebase configuration
├── global.css             # Global Tailwind CSS
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── babel.config.js        # Babel configuration (Nativewind)
└── package.json
```

## Fitur yang Sudah Siap

✅ Nativewind + Tailwind CSS terintegrasi
✅ Firebase Authentication
✅ Session persistence (tidak logout saat app ditutup)
✅ Tab navigation
✅ Proper TypeScript setup
✅ Dark/Light theme support

## Next Steps

1. Update Firebase config dengan credentials Anda di `firebaseConfig.js`
2. Implementasikan screens/pages Anda menggunakan Nativewind styling
3. Gunakan Firebase untuk authentication, database, storage, dll
4. Test pada device/emulator: `npm start`

Semua error sudah diperbaiki dan project siap untuk development! 🚀
