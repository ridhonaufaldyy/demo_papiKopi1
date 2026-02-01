# Panduan Alur Register dengan Firestore

## Alur Registrasi

Berikut adalah alur lengkap saat user melakukan registrasi:

```
┌─────────────────────────────────────┐
│  User Membuka Register Screen       │
└────────┬────────────────────────────┘
         │
         ├─ Input Email
         ├─ Input Nama Lengkap
         ├─ Input Password (min 6 char)
         └─ Input Konfirmasi Password
         │
         ▼
┌──────────────────────────────────────┐
│  Validasi Data                       │
│  - Email tidak kosong                │
│  - Nama tidak kosong                 │
│  - Password tidak kosong             │
│  - Password === Confirm Password     │
│  - Password.length >= 6              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  1. Create User di Firebase Auth     │
│     (createUserWithEmailAndPassword) │
│                                      │
│     Response: user.uid               │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  2. Simpan User Data ke Firestore    │
│     Collection: users                │
│     Document ID: user.uid            │
│                                      │
│     Data:                            │
│     {                                │
│       email: string,                 │
│       name: string,                  │
│       role: "user" (default),        │
│       createdAt: timestamp           │
│     }                                │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Sukses!                             │
│  - Reset form                        │
│  - Show alert "Akun berhasil dibuat" │
│  - Redirect ke Login Screen          │
└──────────────────────────────────────┘
```

## File yang Diubah

### `app/(auth)/register.tsx`

**Perubahan:**
1. Import `useRouter` untuk navigasi
2. Tambah state `name` untuk input nama lengkap
3. Tambah input field untuk nama di form
4. Update validasi untuk cek nama
5. Tambah field `name` saat menyimpan ke Firestore
6. Navigasi ke login screen setelah register berhasil

**Alur Login:**
```typescript
const handleRegister = async () => {
  // 1. Validasi input
  // 2. Create user di Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  
  // 3. Simpan data user ke Firestore
  await setDoc(doc(db, "users", uid), {
    email,
    name,
    role: "user",
    createdAt: serverTimestamp(),
  });
  
  // 4. Redirect ke login
  router.replace("/(auth)/login");
};
```

## Firestore Collection Structure

```
firestore/
└─ users/
   └─ {uid}/
      ├─ email: string
      ├─ name: string
      ├─ role: "user" | "admin"
      └─ createdAt: timestamp
```

## Contoh Data User Setelah Register

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2024-02-01T10:30:00Z"
}
```

## Error Handling

Register akan menampilkan error alert jika:

1. **Email kosong**
   - Message: "Email, nama, dan password harus diisi"

2. **Nama kosong**
   - Message: "Email, nama, dan password harus diisi"

3. **Password kosong**
   - Message: "Email, nama, dan password harus diisi"

4. **Password tidak cocok**
   - Message: "Password tidak cocok"

5. **Password kurang dari 6 karakter**
   - Message: "Password minimal 6 karakter"

6. **Email sudah terdaftar**
   - Message: "The email address is already in use by another account."

7. **Firebase error lainnya**
   - Message: Firebase error message

## Testing Register

### Test Case 1: Register Sukses
```
Email: user123@example.com
Nama: John Doe
Password: Password123
Confirm: Password123

Expected: Redirect ke login screen
```

### Test Case 2: Password Tidak Cocok
```
Email: user@example.com
Nama: Jane Doe
Password: Password123
Confirm: Password456

Expected: Alert "Password tidak cocok"
```

### Test Case 3: Password Terlalu Pendek
```
Email: user@example.com
Nama: Jane Doe
Password: Pass1
Confirm: Pass1

Expected: Alert "Password minimal 6 karakter"
```

### Test Case 4: Email Sudah Terdaftar
```
Email: existing@example.com (sudah ada)
Nama: Another User
Password: Password123
Confirm: Password123

Expected: Alert Firebase error "already in use"
```

## Integrasi dengan Login

Setelah user berhasil register dan diarahkan ke login:

1. User memasukkan email dan password yang sama saat register
2. Login akan:
   - Authenticate di Firebase Auth
   - Ambil role dari Firestore
   - Redirect ke dashboard sesuai role (user atau admin)

## Keamanan

1. **Password Hashing** - Firebase Auth otomatis hash password
2. **Validation** - Client-side validation sebelum submit
3. **Firestore Rules** - Set rules untuk keamanan (lihat ROLE_CHECKING_GUIDE.md)
4. **Server-side Check** - Validasi di backend jika ada (Cloud Functions)
