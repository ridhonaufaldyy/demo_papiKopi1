import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbPbiQN4g86ZkzvxbMpkBqkMhWsB4nTlI",
  authDomain: "fir-e38a1.firebaseapp.com",
  projectId: "fir-e38a1",
  storageBucket: "fir-e38a1.firebasestorage.app",
  messagingSenderId: "73715083459",
  appId: "1:73715083459:web:f6cfc0ffcc9d45f79d1a76",
  measurementId: "G-8CCD630ZD0"
};
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = initializeAuth(app);

// Firestore untuk menyimpan user profile & role
export const db = getFirestore(app);