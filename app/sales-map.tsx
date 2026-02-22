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

// ✅ PERBAIKAN: Helper untuk extract tanggal dari berbagai format timestamp
const getDateFromTimestamp = (t: any): Date | null => {
  try {
    if (t.timestamp?.seconds) {
      return new Date(t.timestamp.seconds * 1000);
    }
    if (t.timestamp?.toDate && typeof t.timestamp.toDate === 'function') {
      return t.timestamp.toDate();
    }
    if (typeof t.timestamp === 'string') {
      return new Date(t.timestamp);
    }
    if (t.timestamp instanceof Date) {
      return t.timestamp;
    }
    if (typeof t.timestamp === 'number') {
      return new Date(t.timestamp);
    }
    if (t.date) {
      return new Date(t.date);
    }
    if (t.createdAt) {
      return getDateFromTimestamp({ timestamp: t.createdAt });
    }
    return null;
  } catch (err) {
    console.warn('Error parsing timestamp:', err, t);
    return null;
  }
};

// ✅ PERBAIKAN: Helper untuk extract lokasi dari berbagai format
const getLocationFromTransaction = (t: any): { latitude: number; longitude: number } | null => {
  try {
    // Format 1: location.latitude & location.longitude
    if (t.location?.latitude !== undefined && t.location?.longitude !== undefined) {
      return { 
        latitude: t.location.latitude, 
        longitude: t.location.longitude 
      };
    }
    
    // Format 2: location.lat & location.lng
    if (t.location?.lat !== undefined && t.location?.lng !== undefined) {
      return { 
        latitude: t.location.lat, 
        longitude: t.location.lng 
      };
    }
    
    // Format 3: coordinates array
    if (Array.isArray(t.location?.coordinates) && t.location.coordinates.length === 2) {
      return { 
        latitude: t.location.coordinates[1], 
        longitude: t.location.coordinates[0] 
      };
    }
    
    // Format 4: GeoPoint
    if (t.geopoint?.latitude !== undefined && t.geopoint?.longitude !== undefined) {
      return { 
        latitude: t.geopoint.latitude, 
        longitude: t.geopoint.longitude 
      };
    }
    
    // Format 5: Direct lat/lng
    if (t.lat !== undefined && t.lng !== undefined) {
      return { 
        latitude: t.lat, 
        longitude: t.lng 
      };
    }
    
    return null;
  } catch (err) {
    console.warn('Error parsing location:', err, t);
    return null;
  }
};

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
  const [debugInfo, setDebugInfo] = useState<string>('');

  const [mode, setMode] =
    useState<'today' | 'week' | 'month' | 'date'>('today');
  const [pickedDate, setPickedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  /* ===== REALTIME LISTENER ===== */
  useEffect(() => {
    const unsub = listenAllTransactions(data => {
      console.log('📥 Raw transactions received:', data.length);
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ===== FILTER LOGIC ===== */
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let debugMessages: string[] = [];

    const filtered = transactions.filter(t => {
      const d = getDateFromTimestamp(t);
      
      if (!d || isNaN(d.getTime())) {
        debugMessages.push(`❌ Invalid date: ${JSON.stringify(t.timestamp)}`);
        return false;
      }

      if (mode === 'today') {
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
          debugMessages.push(`✅ Today: ${d.toLocaleDateString()}`);
        }
        return isToday;
      }

      if (mode === 'week') {
        const w = new Date(now);
        w.setDate(now.getDate() - 7);
        const isWeek = d >= w;
        if (isWeek) {
          debugMessages.push(`✅ Week: ${d.toLocaleDateString()}`);
        }
        return isWeek;
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

    setDebugInfo(`Filtered: ${filtered.length}/${transactions.length}\n${debugMessages.slice(0, 5).join('\n')}`);
    return filtered;
  }, [transactions, mode, pickedDate]);

  /* ===== MAP GENERATION ===== */
  const generateMap = useCallback(() => {
    let debugSteps: string[] = [];

    // Step 1: Filter by location
    const withLocation = filteredTransactions.filter(t => {
      const loc = getLocationFromTransaction(t);
      if (!loc) {
        debugSteps.push(`❌ No location in: ${JSON.stringify(t).substring(0, 50)}`);
        return false;
      }
      return true;
    });
    debugSteps.push(`📍 With location: ${withLocation.length}/${filteredTransactions.length}`);

    // Step 2: Validate coordinates
    const valid = withLocation.filter(t => {
      const loc = getLocationFromTransaction(t)!;
      const isValid = isValidCoordinate(loc.latitude, loc.longitude);
      if (!isValid) {
        debugSteps.push(`❌ Invalid coord: Lat ${loc.latitude}, Lng ${loc.longitude}`);
      }
      return isValid;
    });
    debugSteps.push(`✅ Valid coords: ${valid.length}/${withLocation.length}`);

    setDebugInfo(prev => prev + '\n\nMap Generation:\n' + debugSteps.join('\n'));

    const markers = valid.map(t => {
      const loc = getLocationFromTransaction(t)!;
      return {
        lat: loc.latitude,
        lng: loc.longitude,
        amount: t.totalAmount,
      };
    });

    // ✅ PERBAIKAN: Heatmap gunakan data mentah (valid)
    const heat = valid
      .map(t => {
        const loc = getLocationFromTransaction(t)!;
        return `[${loc.latitude},${loc.longitude},${(t.totalAmount || 1000) / 40000}]`;
      })
      .join(',');

    // ✅ PERBAIKAN: Analisis gunakan data YANG SAMA (jangan filter outliers dulu)
    const rawMarkerData = valid.map(t => {
      const loc = getLocationFromTransaction(t)!;
      return {
        lat: loc.latitude,
        lng: loc.longitude,
        amount: t.totalAmount || 1000,
      };
    });

    // ✅ PERBAIKAN: Clustering langsung dari raw data (heatmap dan analisis sama)
    const tiers = calculateTieredClusters(rawMarkerData);
    
    const center = tiers[0] || {
      lat: -6.9175,
      lng: 107.6191,
    };

    // ✅ PERBAIKAN: Generate tier info untuk debug
    const tierInfo = tiers.map(t => 
      `${t.label}: Rp ${(t.revenue || 0).toLocaleString('id-ID')} (Lat: ${t.lat.toFixed(4)}, Lng: ${t.lng.toFixed(4)})`
    ).join('\n');

    setDebugInfo(prev => prev + `\n\nAnalisis Tier:\n${tierInfo}`);

    setHtml(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  body { margin: 0; padding: 0; }
  #map { height: 100vh; width: 100vw; }
  
  .red-pin {
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    background: #ef4444;
    position: absolute;
    transform: rotate(-45deg);
    left: 50%;
    top: 50%;
    margin: -15px 0 0 -15px;
    box-shadow: -2px 3px 5px rgba(0,0,0,0.3);
    border: 1px solid #b91c1c;
  }
  
  .red-pin::after {
    content: '';
    width: 10px;
    height: 10px;
    margin: 8px 0 0 10px;
    background: #fff;
    position: absolute;
    border-radius: 50%;
    transform: rotate(45deg);
  }

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
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"><\/script>
<script>
  const map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // 1. HEATMAP LAYER - DIPERLUAS
  ${showHeatmap && heat ? `
    L.heatLayer([${heat}], { 
      radius: 50,        // ✅ Diperbesar dari 35 menjadi 50
      blur: 40,          // ✅ Diperbesar dari 25 menjadi 40
      maxZoom: 13,       // ✅ Turun dari 15, jadi blur lebih luas
      minOpacity: 0.3,   // ✅ Tambahan: opacity minimum
      gradient: {0.4: '#3b82f6', 0.65: '#f59e0b', 1.0: '#ef4444'}
    }).addTo(map);
    console.log('🔥 Heatmap rendered with ${valid.length} points');
  ` : ''}

  // 2. MARKERS LAYER (Red Pins) - Optional, bisa dihide
  ${showMarkers ? `
    const points = ${JSON.stringify(markers)};
    console.log('🔴 Drawing', points.length, 'pins');
    points.forEach(m => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='red-pin'></div>",
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      
      L.marker([m.lat, m.lng], { icon: icon })
       .addTo(map)
       .bindPopup('<div style="text-align:center; font-weight:bold;">Rp ' + m.amount.toLocaleString('id-ID') + '</div>');
    });
  ` : ''}

  // 3. ANALYSIS LAYER (Pulse) - Menunjukkan AREA TERKONSENTRASI
  ${showAnalysis && tiers.length > 0 ? `
    const tiers = ${JSON.stringify(tiers)};
    console.log('📊 Rendering', tiers.length, 'tier analysis points');
    tiers.forEach(s => {
      const icon = L.divIcon({
        className: 'pulse-marker',
        html: \`
          <div class="pulse-core" style="background: \${s.color}"></div>
          <div class="pulse-ring" style="background: \${s.color}"></div>
        \`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker([s.lat, s.lng], { icon: icon })
       .addTo(map)
       .bindPopup(\`
         <div style="font-weight:bold; color:\${s.color};">\${s.label}</div>
         <div>Pendapatan: Rp \${s.revenue.toLocaleString('id-ID')}</div>
         <div style="font-size:12px; margin-top:5px;">Cluster: \${s.tier}</div>
       \`);
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
          <FilterPill
            label="Debug"
            active={showDebug}
            onPress={() => setShowDebug(!showDebug)}
            icon="bug"
            color="#f59e0b"
          />
        </View>
      </View>

      {/* DEBUG INFO */}
      {showDebug && (
        <View className="absolute top-32 right-5 bg-gray-800/90 px-3 py-2 rounded-lg z-20 max-w-xs">
          <Text className="text-white text-xs font-mono">
            {debugInfo}
          </Text>
        </View>
      )}

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