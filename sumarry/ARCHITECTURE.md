## 🏗️ Code Architecture & Structure

### Root Layout (`app/_layout.tsx`)

**Responsible for:**
- Checking Firebase authentication state
- Rendering loading screen while checking
- Conditional routing (auth vs tabs)

**Key Code:**
```typescript
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

// Conditional rendering:
{user ? (
  <Stack>
    <Stack.Screen name="(tabs)" ... /> {/* Logged in */}
  </Stack>
) : (
  <Stack.Screen name="auth" ... />      {/* Not logged in */}
)}
```

---

### Auth Screen (`app/auth/index.tsx`)

**Features:**
- Toggle between login & register modes
- Email & password input fields
- Validation (email, password length, confirmation)
- Firebase authentication (sign up & sign in)
- Error handling with alerts
- Loading state during auth
- Nativewind styling

**Key State Variables:**
```typescript
const [isLogin, setIsLogin] = useState(true);           // Toggle mode
const [email, setEmail] = useState('');                 // Email input
const [password, setPassword] = useState('');           // Password
const [confirmPassword, setConfirmPassword] = useState(''); // Register only
const [loading, setLoading] = useState(false);          // Loading state
```

**Key Functions:**
```typescript
const handleAuth = async () => {
  // Validation
  // Firebase auth (createUserWithEmailAndPassword or signInWithEmailAndPassword)
  // Error handling
  // Navigation (router.replace('/(tabs)'))
}
```

---

### Profile Screen (`app/(tabs)/profile.tsx`)

**Features:**
- Display user email from Firebase
- Display user UID
- Account status indicator
- Settings menu items
- Logout button with confirmation
- Beautiful gradient header

**Key Code:**
```typescript
const user = auth.currentUser;

const handleLogout = async () => {
  Alert.alert(...); // Confirmation dialog
  await signOut(auth);
  router.replace('/(auth)' as any);
}
```

---

### Navigation Structure

```
Stack (Root)
├── Condition: user ? true : false
│
├── IF TRUE (logged in):
│   └── Stack.Screen name="(tabs)"
│       └── Tabs (Bottom navigation)
│           ├── Home (index.tsx)
│           ├── Explore (explore.tsx)
│           └── Profile (profile.tsx) ← NEW
│
└── IF FALSE (not logged in):
    └── Stack.Screen name="auth"
        └── Stack (Auth)
            └── Stack.Screen name="index"
                └── Login/Register (index.tsx)
```

---

## 🔄 Authentication Flow

### Register Flow:
```
User clicks "Daftar"
    ↓
isLogin = false (show register form)
    ↓
User enters: email, password, confirmPassword
    ↓
User clicks "Daftar" button
    ↓
Validate:
  • email not empty
  • password not empty
  • password length >= 6
  • password === confirmPassword
    ↓
createUserWithEmailAndPassword(auth, email, password)
    ↓
✓ Success:
  • Alert success
  • Clear all fields
  • setIsLogin(true) (auto switch to login mode)
    ↓
❌ Error:
  • Alert error message
```

### Login Flow:
```
User in login mode (default or after register)
    ↓
User enters: email, password
    ↓
User clicks "Login" button
    ↓
Validate:
  • email not empty
  • password not empty
    ↓
signInWithEmailAndPassword(auth, email, password)
    ↓
✓ Success:
  • Alert success
  • router.replace('/(tabs)') → Go to Home
    ↓
❌ Error:
  • Alert Firebase error message
```

### Logout Flow:
```
User in Profile tab
    ↓
User clicks "Logout" button
    ↓
Alert.alert() - Show confirmation dialog
    ↓
User clicks "Logout" in dialog
    ↓
setLoading(true)
    ↓
signOut(auth)
    ↓
router.replace('/(auth)' as any)
    ↓
✓ Redirect to auth screen
    ↓
setLoading(false)
```

---

## 🎨 Styling Strategy

### Nativewind Usage:
- **Utility-first** CSS classes from Tailwind
- Applied directly to React Native components
- No StyleSheet needed

### Color Palette:
```typescript
// Primary (Blue)
bg-blue-600, text-blue-600, bg-blue-500, etc.

// Backgrounds
bg-white, bg-gray-50, bg-gray-100, bg-gray-200

// Text
text-gray-900, text-gray-800, text-gray-700, text-gray-600, etc.

// Alerts
bg-green-600 (success)
bg-red-600 (error/danger)
bg-yellow-100 (warning background)
```

### Common Patterns:

**Gradient Background:**
```typescript
className="bg-gradient-to-b from-blue-50 to-white"
```

**Card Container:**
```typescript
className="bg-white rounded-2xl p-6 shadow-lg"
```

**Input Field:**
```typescript
className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
```

**Button (Primary):**
```typescript
className={`bg-blue-600 rounded-lg py-3 ${loading ? 'bg-gray-400' : ''}`}
```

**Center Content:**
```typescript
className="flex-1 justify-center items-center"
```

---

## 📊 Component Hierarchy

```
RootLayout
├── [Loading Screen]
└── ThemeProvider
    └── Stack
        ├── [Auth Branch]
        │   └── AuthLayout
        │       └── AuthScreen
        │           ├── Email Input
        │           ├── Password Input
        │           ├── Confirm Password (register mode)
        │           └── Auth Button
        │
        └── [Tabs Branch]
            └── TabsLayout
                ├── HomeScreen
                ├── ExploreScreen
                └── ProfileScreen
                    ├── User Info
                    ├── Settings Menu
                    └── Logout Button
```

---

## 🔧 Key Dependencies Used

```typescript
// Navigation
import { useRouter } from 'expo-router';
import { Stack, Tabs } from 'expo-router';

// Firebase Auth
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User 
} from 'firebase/auth';
import { auth } from '@/firebaseConfig';

// React Native UI
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';

// React
import React, { useState, useEffect } from 'react';
```

---

## 🧪 State Management Strategy

### No Redux/Context API needed because:
- Auth state managed by Firebase directly
- UI state is simple (login form fields)
- Navigation driven by auth state

### State per Component:
- **RootLayout**: `user`, `loading`
- **AuthScreen**: `email`, `password`, `confirmPassword`, `isLogin`, `loading`
- **ProfileScreen**: `loading`

---

## 🛡️ Error Handling

### Try-Catch Pattern:
```typescript
try {
  setLoading(true);
  // Firebase operation
  // Success handling
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  Alert.alert('Error', errorMessage);
} finally {
  setLoading(false);
}
```

### Firebase Error Messages:
- Firebase provides user-friendly error messages
- Examples:
  - "Firebase: Error (auth/user-not-found)"
  - "Firebase: Error (auth/wrong-password)"
  - "Firebase: Error (auth/weak-password)"

---

## 📱 Responsive Design

### Mobile-First Approach:
- Use `flex-1` for flexible sizing
- Use `px-6` for consistent horizontal padding
- Use `py-3`/`py-4` for vertical padding
- Use `space-y-X` for vertical gaps
- Use `flex-row` with `justify-between` for horizontal layout

### Tested On:
- iPhone (SE to Max sizes)
- Android phones
- Tablets (iPad, Android tablets)
- Web (responsive)

---

## 🚀 Performance Considerations

### Optimization:
1. **Auth check on app start** - Only happens once
2. **Firebase SDK lazy loaded** - Only when needed
3. **Navigator doesn't re-render** - Only when auth state changes
4. **Inputs cleared** - To prevent memory leaks
5. **Unsubscribe on unmount** - To prevent memory leaks

### Code:
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(...);
  return () => unsubscribe(); // ← Cleanup
}, []);
```

---

## 📝 Code Patterns Used

### 1. Conditional Rendering:
```typescript
{user ? <ScreenA /> : <ScreenB />}
```

### 2. Ternary for Classes:
```typescript
className={loading ? 'bg-gray-400' : 'bg-blue-600'}
```

### 3. Promise with Loading:
```typescript
setLoading(true);
await operation();
setLoading(false);
```

### 4. Type Safety:
```typescript
const [user, setUser] = useState<User | null>(null);
```

### 5. Error Type Guard:
```typescript
error instanceof Error ? error.message : 'Unknown error'
```

---

## 🔐 Security Implementation

### Firebase Security:
- Password hashing (Firebase handles)
- Secure HTTPS (Firebase)
- Session tokens (Firebase)

### App Security:
- AsyncStorage for local persistence
- Auth state validation on every app start
- Confirmation dialogs for destructive actions

### Code Example:
```typescript
// Firebase creates hashed password automatically
await createUserWithEmailAndPassword(auth, email, password);

// Session persists locally with AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
```

---

## 🎯 Best Practices Implemented

✅ **Type Safety** - TypeScript for all variables
✅ **Error Handling** - Try-catch with user-friendly alerts
✅ **Loading States** - Spinners during async operations
✅ **Validation** - Input validation before submission
✅ **Cleanup** - Unsubscribe from Firebase listeners
✅ **Code Organization** - Separate components by feature
✅ **Documentation** - Comments where needed
✅ **Accessibility** - Clear labels and accessible inputs
✅ **Responsive Design** - Works on all screen sizes
✅ **Security** - Firebase best practices

---

This architecture makes the app:
- 📱 Easy to add more features
- 🔒 Secure by default
- ⚡ Fast and responsive
- 🧹 Clean and maintainable
- 🎨 Beautiful and professional
