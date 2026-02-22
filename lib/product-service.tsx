import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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

    // Ambil tanggal hari ini (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // 1. CEK APAKAH DOKUMEN HARI INI SUDAH ADA
    const q = query(
      collection(db, 'vendor_stocks'),
      where('userId', '==', user.uid),
      where('date', '==', today)
    );
    
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // 2. JIKA SUDAH ADA -> LAKUKAN UPDATE
      const docId = snapshot.docs[0].id;
      const stockRef = doc(db, 'vendor_stocks', docId);
      
      await updateDoc(stockRef, {
        items: items, // Timpa item lama dengan yang baru disesuaikan
        updatedAt: serverTimestamp()
      });
      console.log("Stok hari ini berhasil di-update!");

    } else {
      // 3. JIKA BELUM ADA -> BUAT DOKUMEN BARU
      await addDoc(collection(db, 'vendor_stocks'), {
        userId: user.uid,
        date: today,
        status: 'active',
        items: items,
        createdAt: serverTimestamp()
      });
      console.log("Stok hari ini berhasil dibuat baru!");
    }
    
  } catch (error) {
    console.error("Error saving daily stock:", error);
    throw error; // Lempar error agar bisa ditangkap oleh notifikasi di UI
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

export async function getTodayRemainingStock(): Promise<VendorStock | null> {
  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. AMBIL STOK PERSIAPAN AWAL
    const stockQuery = query(
      collection(db, 'vendor_stocks'),
      where('userId', '==', user.uid),
      where('date', '==', today),
      limit(1)
    );
    
    const stockSnap = await getDocs(stockQuery);
    
    if (stockSnap.empty) return null;
    
    const docData = stockSnap.docs[0].data();
    let initialItems: StockItem[] = docData.items || [];

    // 2. AMBIL SEMUA DATA TRANSAKSI HARI INI
    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('date', '==', today)
    );
    const txSnap = await getDocs(txQuery);

    // 3. HITUNG TOTAL BARANG YANG SUDAH TERJUAL
    const soldQuantities: Record<string, number> = {};
    txSnap.forEach(doc => {
      const txData = doc.data();
      const txItems = txData.items || [];
      txItems.forEach((item: any) => {
        soldQuantities[item.productId] = (soldQuantities[item.productId] || 0) + item.qty;
      });
    });

    // 4. KURANGI STOK AWAL DENGAN TOTAL TERJUAL
    const remainingItems = initialItems.map(item => ({
      ...item,
      // Jika barang ada di transaksi, kurangi currentStock-nya. Jika tidak, biarkan utuh.
      currentStock: Math.max(0, item.currentStock - (soldQuantities[item.productId] || 0))
    }));

    return { 
      id: stockSnap.docs[0].id, 
      userId: docData.userId,
      date: docData.date,
      status: docData.status,
      items: remainingItems, // Kirim stok yang SUDAH DIKURANGI ke layar jualan
      createdAt: docData.createdAt
    } as VendorStock;

  } catch (error) {
    console.error("Error calculating remaining stock:", error);
    return null;
  }
}


// --- FUNGSI UNTUK MERESET TRANSAKSI HARI INI (TESTING) ---
export async function clearTodaysTransactions() {
  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Cari semua transaksi hari ini
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('date', '==', today)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0; // Tidak ada yang dihapus
    }

    // Eksekusi hapus masal
    const deletePromises: Promise<void>[] = [];
    snapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, 'transactions', document.id)));
    });

    await Promise.all(deletePromises);
    return snapshot.size; 

  } catch (error) {
    console.error("Gagal menghapus transaksi:", error);
    throw error;
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
  location: { lat: number; lng: number },
  paymentMethod: 'cash' | 'qris'
  // Parameter dailyStockId kita hapus karena kita tidak akan menyentuh data persiapan lagi
) {
  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  try {
    // 1. HANYA SIMPAN RIWAYAT TRANSAKSI KE DATABASE
    await addDoc(collection(db, 'transactions'), {
      userId: user.uid,
      items: items,
      totalAmount: totalAmount,
      location: location,
      paymentMethod: paymentMethod, // Simpan cash/qris
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0] // Untuk filter laporan harian
    });

    // KODE YANG MENGURANGI STOK PERSIAPAN (vendor_stocks) TELAH DIHAPUS.
    // Data persiapan Anda sekarang aman dan tidak akan berubah.

  } catch (error) {
    console.error("Gagal memproses transaksi:", error);
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

export async function getTodaySalesSummary() {
  const user = auth.currentUser;
  if (!user) return { count: 0, total: 0 };

  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('date', '==', today)
    );

    const snapshot = await getDocs(q);
    
    let totalRevenue = 0;
    snapshot.forEach(doc => {
      totalRevenue += doc.data().totalAmount || 0;
    });

    return { 
      count: snapshot.size, // Jumlah transaksi (nota)
      total: totalRevenue   // Total uang (rupiah)
    };
  } catch (error) {
    console.error("Error get today sales:", error);
    return { count: 0, total: 0 };
  }
}

// --- TIPE DATA UNTUK LEADERBOARD ---
interface LeaderboardItem {
  id: string;
  name: string;
  totalSales: number;
}

// --- FUNGSI UNTUK LEADERBOARD (MENGAMBIL USERNAME ASLI) ---
export async function getLeaderboardData(timeframe: 'today' | 'all-time'): Promise<LeaderboardItem[]> {
  try {
    let q;
    const transactionsRef = collection(db, 'transactions');
    
    if (timeframe === 'today') {
      const today = new Date().toISOString().split('T')[0];
      // Pastikan TIDAK ADA .limit(5) di sini
      q = query(transactionsRef, where('date', '==', today));
    } else {
      // Ambil semua tanpa batasan jumlah
      q = query(transactionsRef);
    }

    const snapshot = await getDocs(q);
    const salesMap: Record<string, number> = {};

    snapshot.forEach((docSnap) => {
      const tx = docSnap.data();
      const uid = tx.userId;
      if (uid) {
        salesMap[uid] = (salesMap[uid] || 0) + (Number(tx.totalAmount) || 0);
      }
    });

    const leaderPromises = Object.keys(salesMap).map(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        return {
          id: uid,
          // Mengambil username asli dari tabel users
          name: userData?.username || userData?.name || `Pedagang ${uid.substring(0, 5)}`,
          totalSales: salesMap[uid]
        };
      } catch (e) {
        return { id: uid, name: `Pedagang ${uid.substring(0, 5)}`, totalSales: salesMap[uid] };
      }
    });

    const result = await Promise.all(leaderPromises);
    
    // Urutkan dari yang terbesar ke terkecil
    return result.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return [];
  }
}

export async function getUserTransactions() {
  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc') // Urutkan dari transaksi terbaru
    );

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
}