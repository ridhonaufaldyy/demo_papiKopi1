import { storage } from '@/firebaseConfig';
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp
} from 'firebase/firestore';
import {
    getDownloadURL,
    ref,
    uploadBytes
} from "firebase/storage"; // Import fungsi storage
import { db } from './firebase';
// Tipe Data Produk
export interface Product {
  id?: string;
  name: string;
  price: number;
  image: string; // Kita pakai URL gambar dulu (simplifikasi)
  category: string;
  createdAt?: any;
}

const COLLECTION_NAME = 'products';

/**
 * Service: Tambah Produk Baru (Create)
 */
export async function addProduct(data: Product) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

/**
 * Service: Ambil Semua Produk (Read)
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Helper: Format Rupiah
 */
export const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

/**
 * Service: Upload Gambar ke Firebase Storage
 */
export async function uploadImage(uri: string): Promise<string> {
  try {
    // 1. Convert URI ke Blob (Binary Large Object)
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Buat referensi nama file unik (misal: products/123456789.jpg)
    const filename = `products/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // 3. Upload file
    await uploadBytes(storageRef, blob);

    // 4. Ambil URL Publik
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error upload image:", error);
    throw new Error("Gagal mengupload gambar");
  }
}