import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export interface UserData {
  email: string;
  role: UserRole;
  name?: string;
  createdAt?: string;
}

/**
 * Login user dan ambil role dari Firestore
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<UserData> {
  try {
    // Login dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ambil data user dari Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error('User data tidak ditemukan di database');
    }

    const userData = userDocSnap.data() as UserData;
    
    return {
      email: userData.email || user.email || '',
      role: userData.role || 'user', // Default ke 'user' jika role tidak ada
      name: userData.name,
      createdAt: userData.createdAt,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get role dari user yang sedang login
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return 'user'; // Default role
    }

    return userDocSnap.data().role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default role jika ada error
  }
}

/**
 * Get user data lengkap
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return null;
    }

    return userDocSnap.data() as UserData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}
