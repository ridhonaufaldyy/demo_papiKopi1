import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';

// ==========================================
// Types & Interfaces
// ==========================================

export type UserRole = 'user' | 'admin';

export interface UserData {
  uid?: string; // Berguna untuk referensi ID di UI
  email: string;
  role: UserRole;
  name?: string;
  createdAt?: Timestamp | string | null;
}

// ==========================================
// Auth Services
// ==========================================

/**
 * Service untuk Mendaftar User Baru
 * Menangani Auth Firebase + Simpan data ke Firestore
 */
export async function registerUser(name: string, email: string, pass: string): Promise<UserData> {
  try {
    // 1. Create User di Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Siapkan data user
    const newUser: UserData = {
      uid: user.uid,
      name,
      email,
      role: 'user', // Default role
      createdAt: null, // Placeholder untuk timestamp client-side
    };

    // 3. Simpan ke Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...newUser,
      createdAt: serverTimestamp(), // Gunakan server timestamp
    });

    return newUser;
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
}

/**
 * Service untuk Login
 * Melakukan login auth dan langsung mengambil data profil dari Firestore
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<UserData> {
  try {
    // 1. Login Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Ambil data profil lengkap (Reusing function biar DRY)
    const userData = await getUserData(user.uid);

    if (!userData) {
      throw new Error('Data user tidak ditemukan di database.');
    }

    return userData;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
}

/**
 * Service untuk Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

// ==========================================
// Data Services
// ==========================================

/**
 * Mengambil data user lengkap dari Firestore berdasarkan UID
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return null;
    }

    const data = userDocSnap.data();
    
    return {
      uid: userId,
      email: data.email,
      role: data.role || 'user',
      name: data.name,
      createdAt: data.createdAt,
    } as UserData;
  } catch (error) {
    console.error('Get User Data Error:', error);
    return null;
  }
}

/**
 * Helper cepat untuk cek role (biasanya untuk route protection)
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const userData = await getUserData(userId);
  return userData?.role || 'user';
}