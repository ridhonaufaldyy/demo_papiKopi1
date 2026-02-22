import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { listenAllTransactions } from '@/lib/product-service';

/* =========================
   UTIL (LOGIC TETAP SAMA)
========================= */

const isValidCoordinate = (lat: number, lng: number) =>
  lat !== 0 &&
  lng !== 0 &&
  lat >= -11 &&
  lat <= 6 &&
  lng >= 95 &&
  lng <= 141;

const filterOutliers = (
  data: { lat: number; lng: number; amount: number }[]
) => {
  if (data.length < 5) return data;

  const center = data.reduce(
    (a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }),
    { lat: 0, lng: 0 }
  );

  const meanLat = center.lat / data.length;
  const meanLng = center.lng / data.length;

  const distances = data.map(p =>
    Math.hypot(p.lat - meanLat, p.lng - meanLng)
  );

  const mean =
    distances.reduce((a, b) => a + b, 0) / distances.length;
  const stdDev = Math.sqrt(
    distances.reduce((a, d) => a + Math.pow(d - mean, 2), 0) /
      distances.length
  );

  return data.filter((_, i) => distances[i] <= mean + stdDev * 1.2);
};

const calculateTieredClusters = (
  data: { lat: number; lng: number; amount: number }[]
) => {
  if (data.length < 5) return [];

  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const k = 5;

  let centroids = sorted.slice(0, k).map(p => ({
    lat: p.lat,
    lng: p.lng,
  }));

  let clusters: typeof data[] = [];

  for (let i = 0; i < 10; i++) {
    clusters = Array.from({ length: k }, () => []);
    data.forEach(p => {
      let min = Infinity;
      let idx = 0;
      centroids.forEach((c, i) => {
        const d = Math.hypot(p.lat - c.lat, p.lng - c.lng);
        if (d < min) {
          min = d;
          idx = i;
        }
      });
      clusters[idx].push(p);
    });

    centroids = clusters.map((c, i) => {
      if (!c.length) return centroids[i];
      const sum = c.reduce(
        (a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }),
        { lat: 0, lng: 0 }
      );
      return { lat: sum.lat / c.length, lng: sum.lng / c.length };
    });
  }

  const scored = clusters
    .map(c => {
      if (!c.length) return null;
      const total = c.reduce((s, p) => s + p.amount, 0);
      const best = c.reduce((a, b) =>
        a.amount > b.amount ? a : b
      );
      return { lat: best.lat, lng: best.lng, revenue: total };
    })
    .filter(Boolean) as any[];

  scored.sort((a, b) => b.revenue - a.revenue);

  return [
    { ...scored[0], tier: 'RAMAI', color: '#10b981', label: '🔥 RAMAI' },
    {
      ...scored[Math.floor(scored.length / 2)],
      tier: 'BIASA',
      color: '#3b82f6',
      label: '⚖️ BIASA',
    },
    {
      ...scored[scored.length - 1],
      tier: 'SEPI',
      color: '#6b7280',
      label: '🧊 SEPI',
    },
  ];
};

/* =========================
   MAIN SCREEN
========================= */

export default function SalesMapScreen() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState('');

  const [mode, setMode] =
    useState<'today' | 'week' | 'month' | 'date'>('today');
  const [pickedDate, setPickedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Default state layer
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);

  /* ===== REALTIME LISTENER ===== */
  useEffect(() => {
    const unsub = listenAllTransactions(data => {
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ===== FILTER LOGIC ===== */
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter(t => {
      if (!t.timestamp?.seconds) return false;
      const d = new Date(t.timestamp.seconds * 1000);

      if (mode === 'today') {
        return d.toDateString() === now.toDateString();
      }

      if (mode === 'week') {
        const w = new Date(now);
        w.setDate(now.getDate() - 7);
        return d >= w;
      }

      if (mode === 'month') {
        const m = new Date(now);
        m.setMonth(now.getMonth() - 1);
        return d >= m;
      }

      if (mode === 'date') {
        return d.toDateString() === pickedDate.toDateString();
      }

      return true;
    });
  }, [transactions, mode, pickedDate]);

  /* ===== MAP GENERATION ===== */
  const generateMap = useCallback(() => {
    const valid = filteredTransactions.filter(
      t =>
        t.location &&
        isValidCoordinate(
          t.location.latitude,
          t.location.longitude
        )
    );

    const markers = valid.map(t => ({
      lat: t.location.latitude,
      lng: t.location.longitude,
      amount: t.totalAmount,
    }));

    // Heatmap intensity
    const heat = valid
      .map(
        t =>
          `[${t.location.latitude},${t.location.longitude},${(t.totalAmount || 1000) / 40000}]`
      )
      .join(',');

    const clean = filterOutliers(
      valid.map(t => ({
        lat: t.location.latitude,
        lng: t.location.longitude,
        amount: t.totalAmount || 1000,
      }))
    );

    const tiers = calculateTieredClusters(clean);
    
    // Default center ke Bandung jika data kosong
    const center = tiers[0] || {
      lat: -6.9175,
      lng: 107.6191,
    };

    setHtml(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  body { margin: 0; padding: 0; }
  #map { height: 100vh; width: 100vw; }
  
  /* --- MODERN RED PIN STYLE --- */
  .red-pin {
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    background: #ef4444; /* Merah Modern */
    position: absolute;
    transform: rotate(-45deg);
    left: 50%;
    top: 50%;
    margin: -15px 0 0 -15px;
    box-shadow: -2px 3px 5px rgba(0,0,0,0.3); /* Shadow agar timbul */
    border: 1px solid #b91c1c;
  }
  
  /* Titik Putih di Tengah Pin */
  .red-pin::after {
    content: '';
    width: 10px;
    height: 10px;
    margin: 8px 0 0 10px; /* Posisi tengah */
    background: #fff;
    position: absolute;
    border-radius: 50%;
    transform: rotate(45deg); /* Counter rotate agar bulat sempurna visualnya */
  }

  /* --- ANALYSIS PULSE (Sama seperti sebelumnya tapi dihaluskan) --- */
  .pulse-marker {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pulse-core {
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
    position: relative;
    z-index: 2;
  }
  .pulse-ring {
    position: absolute;
    width: 100%; height: 100%;
    border-radius: 50%;
    animation: pulsate 2s infinite;
    z-index: 1;
  }
  @keyframes pulsate {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>
<script>
  // Init Map
  const map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // 1. HEATMAP LAYER
  ${showHeatmap ? `L.heatLayer([${heat}], { radius: 35, blur: 25, maxZoom: 15 }).addTo(map);` : ''}

  // 2. MARKERS LAYER (Red Pins)
  ${showMarkers ? `
    const points = ${JSON.stringify(markers)};
    points.forEach(m => {
      // Menggunakan divIcon agar bisa custom CSS total
      const icon = L.divIcon({
        className: 'custom-div-icon', // Dummy class
        html: "<div class='red-pin'></div>",
        iconSize: [30, 42],
        iconAnchor: [15, 42] // Anchor di ujung bawah pin
      });
      
      L.marker([m.lat, m.lng], { icon: icon })
       .addTo(map)
       .bindPopup('<div style="text-align:center; font-weight:bold;">Rp ' + m.amount.toLocaleString('id-ID') + '</div>');
    });
  ` : ''}

  // 3. ANALYSIS LAYER (Pulse)
  ${showAnalysis ? `
    const tiers = ${JSON.stringify(tiers)};
    tiers.forEach(s => {
      const icon = L.divIcon({
        className: 'pulse-marker',
        html: \`
          <div class="pulse-core" style="background: \${s.color}"></div>
          <div class="pulse-ring" style="background: \${s.color}"></div>
        \`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([s.lat, s.lng], { icon: icon })
       .addTo(map)
       .bindPopup('<b style="color:'+s.color+'">' + s.label + '</b><br>Estimasi pendapatan tinggi');
    });
  ` : ''}
</script>
</body>
</html>
`);
  }, [filteredTransactions, showHeatmap, showMarkers, showAnalysis]);

  useEffect(() => {
    if (filteredTransactions.length > 0 || !loading) {
        generateMap();
    }
  }, [generateMap, loading]);

  /* =========================
     COMPONENTS UI
  ========================= */

  const FilterPill = ({
    label,
    active,
    onPress,
    icon,
    color
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    icon: any;
    color: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-center px-4 py-3 mx-1 rounded-full transition-all ${
        active 
          ? 'bg-white shadow-sm border border-gray-100' 
          : 'bg-transparent'
      }`}
      style={active ? { elevation: 2 } : {}}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? color : '#9ca3af'}
      />
      {active && (
        <Text className="ml-2 text-xs font-bold text-gray-800">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );

  const TimeButton = ({
    label,
    value,
  }: {
    label: string;
    value: typeof mode;
  }) => {
    const active = mode === value;
    return (
      <TouchableOpacity
        onPress={() => {
          setMode(value);
          if (value === 'date') setShowPicker(true);
        }}
        className={`px-4 py-1.5 mr-2 rounded-full border ${
          active
            ? 'bg-gray-800 border-gray-800'
            : 'bg-white border-gray-200'
        }`}
      >
        <Text
          className={`text-xs font-medium ${
            active ? 'text-white' : 'text-gray-600'
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* HEADER CONTROLS */}
      <View className="absolute top-12 left-5 right-5 z-20 flex-row items-center justify-between pointer-events-box-none">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white items-center justify-center rounded-full shadow border border-gray-100"
        >
          <Ionicons name="arrow-back" size={20} color="#1f2937" />
        </TouchableOpacity>

        <View className="flex-1 ml-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            <TimeButton label="Hari Ini" value="today" />
            <TimeButton label="Minggu" value="week" />
            <TimeButton label="Bulan" value="month" />
            <TimeButton label="Tanggal" value="date" />
          </ScrollView>
        </View>
      </View>

      {/* MAP VIEW */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-4 text-xs font-medium text-gray-400">
            Memuat Peta...
          </Text>
        </View>
      ) : (
        <WebView 
            originWhitelist={['*']} 
            source={{ html }} 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        />
      )}

      {/* MODERN BOTTOM FLOATING BAR */}
      <View className="absolute bottom-8 w-full items-center z-20">
        <View className="flex-row bg-gray-50/90 p-1.5 rounded-full shadow-lg border border-gray-200 backdrop-blur-md">
          <FilterPill
            label="Heatmap"
            active={showHeatmap}
            onPress={() => setShowHeatmap(!showHeatmap)}
            icon="flame"
            color="#ef4444"
          />
          <FilterPill
            label="Lokasi"
            active={showMarkers}
            onPress={() => setShowMarkers(!showMarkers)}
            icon="location"
            color="#2563eb"
          />
          <FilterPill
            label="Analisis"
            active={showAnalysis}
            onPress={() => setShowAnalysis(!showAnalysis)}
            icon="analytics"
            color="#10b981"
          />
        </View>
      </View>

      {/* DATE PICKER */}
      {showPicker && (
        <DateTimePicker
          value={pickedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, d) => {
            setShowPicker(false);
            if (d) setPickedDate(d);
          }}
        />
      )}
    </View>
  );
}