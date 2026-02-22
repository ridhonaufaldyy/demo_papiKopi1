import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

// --- KONFIGURASI CLOUDINARY ---
const CLOUD_NAME = "dqsa5twlc"; 
const UPLOAD_PRESET = "papikopi-product"; 

// Tipe Data Produk
export interface Product {
  id?: string;
  name: string;
  price: number;
  image: string;
  category: string;
  createdAt?: any;
}

const COLLECTION_NAME = 'products';

/**
 * Service: Upload Gambar ke Cloudinary
 * Menggunakan fetch API bawaan (Tanpa library tambahan)
 */
export async function uploadImage(uri: string): Promise<string> {
  try {
    // --- PERBAIKAN DI SINI ---
    // Kita hanya cek apakah variabel kosong atau tidak.
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Konfigurasi Cloudinary belum diisi di file product-service.ts");
    }

    // 1. Siapkan Data Form
    const data = new FormData();
    
    // @ts-ignore: React Native membutuhkan objek file spesifik (uri, type, name)
    data.append('file', {
      uri: uri,
      type: 'image/jpeg', // Default ke jpeg, Cloudinary akan menyesuaikan
      name: 'upload.jpg',
    });
    
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);

    // 2. Kirim ke API Cloudinary
    const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    console.log("Mengupload ke Cloudinary...");
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();

    // Cek jika ada error dari Cloudinary
    if (result.error) {
      console.error("Cloudinary Error Detail:", result.error);
      throw new Error(result.error.message);
    }

    if (result.secure_url) {
      console.log("Upload Sukses:", result.secure_url);
      return result.secure_url;
    } else {
      throw new Error("Gagal mendapatkan URL gambar dari Cloudinary");
    }

  } catch (error) {
    console.error("Error upload image:", error);
    throw error;
  }
}

/**
 * Service: Tambah Produk Baru ke Firestore
 * (Data gambar yang disimpan adalah URL dari Cloudinary)
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
 * Service: Ambil Semua Produk dari Firestore
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
 * Service: Hapus Produk
 */
export async function deleteProduct(id: string) {
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

/**
 * Service: Update Produk (Untuk Edit)
 */
export async function updateProduct(id: string, data: Partial<Product>) {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// --- TIPE DATA BARU UNTUK STOK VENDOR ---
export interface StockItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  initialStock: number; // Stok awal yang dibawa
  currentStock: number; // Stok berjalan (nanti berkurang saat jualan)
}

export interface VendorStock {
  id?: string;
  userId: string;
  date: string;
  status: string;
  items: StockItem[]; // Array barang
  createdAt?: any;
}

/**
 * SERVICE BARU: Simpan Persiapan Dagang (Stok Harian)
 */
export async function saveVendorDailyStock(items: StockItem[]) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User belum login");

    // Kita simpan ke collection 'vendor_stocks'
    await addDoc(collection(db, 'vendor_stocks'), {
      userId: user.uid,
      date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      createdAt: serverTimestamp(),
      status: 'ready', // ready, selling, closed
      items: items, // Array barang yang dibawa
    });

    return true;
  } catch (error) {
    console.error("Error saving stock:", error);
    throw error;
  }
}

/**
 * SERVICE BARU: Ambil Stok Hari Ini milik User
 */
// GANTI FUNGSI getTodayVendorStock DENGAN INI:

export async function getTodayVendorStock(): Promise<VendorStock | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User belum login");

    const today = new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, 'vendor_stocks'),
      where('userId', '==', user.uid),
      where('date', '==', today),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Casting data ke tipe VendorStock agar TypeScript paham isinya
    const docData = snapshot.docs[0].data();
    return { 
      id: snapshot.docs[0].id, 
      userId: docData.userId,
      date: docData.date,
      status: docData.status,
      items: docData.items, // TypeScript sekarang tahu ini ada!
      createdAt: docData.createdAt
    } as VendorStock;

  } catch (error) {
    console.error("Error get stock:", error);
    return null;
  }
}

// Tipe Data untuk Transaksi
export interface TransactionItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface SalesTransaction {
  userId: string;
  items: TransactionItem[];
  totalAmount: number;
  timestamp: any; // Waktu transaksi
  location: {
    latitude: number;
    longitude: number;
  };
}

/**
 * SERVICE: Simpan Transaksi Penjualan
 */
export async function saveTransaction(
  items: TransactionItem[], 
  totalAmount: number, 
  location: { lat: number; lng: number }
) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User belum login");

    await addDoc(collection(db, 'transactions'), {
      userId: user.uid,
      userName: user.displayName || 'Pedagang', // Opsional: biar mudah dibaca admin
      items: items,
      totalAmount: totalAmount,
      timestamp: serverTimestamp(), // Waktu Server (Akurat)
      location: {
        latitude: location.lat,
        longitude: location.lng
      }
    });

    // TODO (Opsional): Kurangi stok di 'vendor_stocks' (Nanti kita bahas di tahap advanced)
    
    return true;
  } catch (error) {
    console.error("Error saving transaction:", error);
    throw error;
  }
}

/**
 * SERVICE ADMIN: Ambil Semua Transaksi untuk Heatmap
 */
export async function getAllTransactions() {
  try {
    // Ambil semua dokumen di collection 'transactions'
    const q = query(collection(db, 'transactions'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]; // Sesuaikan tipe jika perlu
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return [];
  }
}

export const listenAllTransactions = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, 'transactions'), (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });
};