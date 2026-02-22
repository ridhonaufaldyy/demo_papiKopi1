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
  uid?: string;
  email: string;
  role: UserRole;
  name?: string;   // <--- KITA PAKAI INI SAJA (Hapus fullName)
  image?: string;  // Tetap butuh ini untuk foto
  createdAt?: Timestamp | string | null;
}

// ==========================================
// Auth Services
// ==========================================

export async function registerUser(name: string, email: string, pass: string): Promise<UserData> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    const newUser: UserData = {
      uid: user.uid,
      name, // Simpan sebagai name
      email,
      role: 'user', 
      createdAt: null, 
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
    });

    return newUser;
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
}

export async function loginWithEmailPassword(email: string, password: string): Promise<UserData> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
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
      
      // --- Update Sederhana ---
      name: data.name, // Langsung ambil field 'name'
      image: data.image || null,
      
      createdAt: data.createdAt,
    } as UserData;

  } catch (error) {
    console.error('Get User Data Error:', error);
    return null;
  }
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const userData = await getUserData(userId);
  return userData?.role || 'user';
}