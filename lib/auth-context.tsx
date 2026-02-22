import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getUserData,
  loginWithEmailPassword,
  logoutUser,
  registerUser,
  UserData
} from './auth-utils';
import { auth } from './firebase';

// Definisi Tipe Context
interface AuthContextType {
  user: User | null;          // User Firebase Auth (Raw)
  userData: UserData | null;  // User Firestore (Data Profil Lengkap)
  loading: boolean;
  login: typeof loginWithEmailPassword;
  register: typeof registerUser;
  logout: typeof logoutUser;
  refreshUserData: () => Promise<void>; // <--- FUNGSI BARU KITA
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Fungsi untuk Refresh Data Manual ---
  const refreshUserData = async () => {
    if (user) {
      // Ambil data terbaru dari Firestore
      const updatedData = await getUserData(user.uid);
      if (updatedData) {
        setUserData(updatedData); // Update state global
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Ambil data profil dari Firestore
        const data = await getUserData(currentUser.uid);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login: loginWithEmailPassword,
      register: registerUser,
      logout: logoutUser,
      refreshUserData // Export fungsi ini agar bisa dipakai
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};