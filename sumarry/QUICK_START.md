# 🚀 Quick Start Guide

## Instalasi & Menjalankan Aplikasi

### 1. **Pastikan sudah install dependencies**
```bash
npm install
```

### 2. **Jalankan development server**
```bash
npm start
```

Kemudian pilih:
- `a` untuk Android emulator
- `i` untuk iOS simulator
- `w` untuk Web browser

### 3. **Login/Register**
Aplikasi akan langsung menampilkan login screen

---

## 🔑 Login Credentials (untuk testing)

**Jika sudah ada akun:**
```
Email: your-email@example.com
Password: your-password
```

**Untuk register akun baru:**
1. Click "Daftar" link
2. Enter email & password (min 6 chars)
3. Click "Daftar" button
4. Auto switch to login mode
5. Enter same credentials
6. Click "Login"

---

## 📁 Struktur Folder Penting

```
app/
├── auth/index.tsx           ← Login/Register page
├── (tabs)/profile.tsx       ← Logout button & user info
└── _layout.tsx              ← Auth state checking (LOGIN LOGIC)

components/
└── nativewind-examples.tsx  ← Styling reference

constants/
└── auth-theme.ts            ← Theme customization
```

---

## 🎨 Customization

### 1. **Ubah Warna Primary**

Edit `constants/auth-theme.ts`:
```typescript
primary: {
  light: '#3b82f6',    // ← Change this to your color
  dark: '#1e40af',
  lighter: '#eff6ff',
},
```

### 2. **Ubah Gradient Background**

Di `app/auth/index.tsx` line 52:
```typescript
<ScrollView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
                         //  ^^^^^^^^ Change these colors ^^^^^^^^
```

### 3. **Ubah Button Text**

Edit di file yang sama, search untuk:
- "Login" → "Masuk"
- "Daftar" → "Buat Akun"
- "Logout" → "Keluar"

---

## 🧪 Testing Checklist

- [ ] App opens to login screen
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can access Home, Explore, Profile tabs
- [ ] Can see user email in Profile
- [ ] Can logout
- [ ] Session persists after app restart

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `LOGIN_REGISTER_GUIDE.md` | Detailed feature documentation |
| `IMPLEMENTATION_SUMMARY.md` | Complete implementation overview |
| `README_LOGIN_REGISTER.md` | User guide & features |
| `components/nativewind-examples.tsx` | Styling reference |
| `constants/auth-theme.ts` | Theme customization |

---

## ⚡ Common Commands

```bash
# Start development server with cache cleared
npm start -- --clear

# Start Android emulator
npm run android

# Start iOS simulator
npm run ios

# Start Web browser
npm run web

# Run linter
npm run lint
```

---

## 🐛 Troubleshooting

### **Login screen tidak muncul**
```bash
npm start -- --clear
```
Restart dengan cache cleared

### **"Cannot find module firebaseConfig"**
Check `firebaseConfig.js` exists di root folder

### **Session tidak persist**
Check Firebase config di `firebaseConfig.js` has AsyncStorage initialization

### **Button tidak responsive**
Make sure `touchableOpacity` component imported dari 'react-native'

---

## 📞 Need Help?

1. Check `LOGIN_REGISTER_GUIDE.md` for detailed docs
2. Check `components/nativewind-examples.tsx` for styling examples
3. Check `constants/auth-theme.ts` for customization options

---

## ✅ What's Working

✅ Login/Register screens
✅ Firebase authentication
✅ Session persistence
✅ Protected routes
✅ Profile page with logout
✅ Nativewind styling
✅ Error handling

---

**Happy coding!** 🚀
