import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile
} from "firebase/auth";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  image?: string; 
}

/**
 * Ambil semua user (Fitur Admin)
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    const users: UserData[] = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserData);
    });
    return users;
  } catch (error) {
    console.error("Error get users:", error);
    return [];
  }
}

/**
 * Hapus User (Fitur Admin)
 */
export async function deleteUser(userId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (error) {
    console.error("Error delete user:", error);
    throw error;
  }
}

/**
 * Update Data Profil Diri Sendiri (Nama & Foto)
 */
export async function updateUserProfile(uid: string, name: string, photoURL: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User tidak ditemukan/belum login");

    // 1. Update di Firebase Auth (Agar nama di Auth juga berubah)
    await updateProfile(user, {
      displayName: name,
      photoURL: photoURL
    });

    // 2. Update di Firestore (Database Profil)
    const userRef = doc(db, 'users', uid);
    
    // --- KOREKSI DI SINI: Gunakan 'name' ---
    await updateDoc(userRef, {
      name: name,      // Sekarang update ke field 'name'
      image: photoURL 
    });

    return true;
  } catch (error) {
    console.error("Error update profile:", error);
    throw error;
  }
}

/**
 * Ubah Password Sendiri
 */
export async function changeMyPassword(currentPassword: string, newPassword: string) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User tidak valid");

    // 1. Buat Kredensial dari Password Lama
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    // 2. Re-Autentikasi 
    await reauthenticateWithCredential(user, credential);

    // 3. Update Password
    await updatePassword(user, newPassword);

    return true;
  } catch (error: any) {
    console.error("Error change password:", error);
    if (error.code === 'auth/wrong-password') {
      throw new Error("Password lama salah.");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Terlalu banyak percobaan gagal. Coba lagi nanti.");
    }
    throw error;
  }
}