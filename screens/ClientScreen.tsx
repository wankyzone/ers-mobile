import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import io from 'socket.io-client';

import { useAuth } from '../src/context/AuthContext';
import {
  getClientErrands,
  confirmErrand,
  type Errand,
} from '../src/services/api';

// ─── SAFE MAP IMPORT ─────────────────────────────

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
}

// ─── CONFIG ─────────────────────────────────────

const SOCKET_URL = 'http://100.115.92.197:3000';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
});

// ─── THEME ─────────────────────────────────────

const C = {
  bg: '#020617',
  card: '#0f172a',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#94a3b8',
};

// ─── HELPERS ───────────────────────────────────

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
});

const getAmount = (e: Errand) => e.budget ?? e.price ?? 0;

const getCoords = (location?: string | null) => {
  if (!location) return null;

  return {
    latitude: 6.5244 + Math.random() * 0.01,
    longitude: 3.3792 + Math.random() * 0.01,
  };
};

// ─── SCREEN ───────────────────────────────────

export default function ClientScreen() {
  const { user } = useAuth();

  const mapRef = useRef<any>(null);

  const [errands, setErrands] = useState<Errand[]>([]);
  const [runnerLocation, setRunnerLocation] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // ─── FETCH ─────────────────────────────────

  const fetchErrands = useCallback(async () => {
    try {
      const data = await getClientErrands();
      setErrands(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchErrands();
  }, []);

  // ─── ACTIVE ERRAND ─────────────────────────

  const activeErrand = useMemo(
    () => errands.find((e) => e.status === 'accepted'),
    [errands]
  );

  const pickupCoords = getCoords(activeErrand?.pickup_location);
  const deliveryCoords = getCoords(activeErrand?.delivery_location);

  // ─── SOCKET ───────────────────────────────

  useEffect(() => {
    if (!activeErrand) return;

    socket.emit('join:errand', activeErrand.id);

    const handler = (data: any) => {
      const loc = {
        latitude: data.lat,
        longitude: data.lng,
      };

      setRunnerLocation(loc);

      if (mapRef.current && Platform.OS !== 'web') {
        mapRef.current.animateToRegion({
          ...loc,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    };

    socket.on('location:update', handler);

    return () => {
      socket.off('location:update', handler);
    };
  }, [activeErrand]);

  // ─── CONFIRM ─────────────────────────────

  const handleConfirm = (id: string) => {
    Alert.alert('Confirm Delivery', 'Mark as completed?', [
      { text: 'Cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setConfirmingId(id);

            const updated = await confirmErrand(id);

            setErrands((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e))
            );
          } finally {
            setConfirmingId(null);
          }
        },
      },
    ]);
  };

  // ─── MAP ─────────────────────────────────

  const TrackingMap = () => {
    if (
      Platform.OS === 'web' ||
      !MapView ||
      !pickupCoords ||
      !deliveryCoords
    ) {
      return null;
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker coordinate={pickupCoords} title="Pickup" />

          <Marker
            coordinate={deliveryCoords}
            title="Delivery"
            pinColor="green"
          />

          {runnerLocation && (
            <Marker
              coordinate={runnerLocation}
              title="Runner"
              pinColor="blue"
            />
          )}

          <Polyline
            coordinates={[pickupCoords, deliveryCoords]}
            strokeColor="#22c55e"
            strokeWidth={3}
          />
        </MapView>
      </View>
    );
  };

  // ─── UI ─────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.green} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Errands</Text>

      {activeErrand && (
        <>
          <TrackingMap />

          <View style={styles.trackCard}>
            <Text style={styles.title}>{activeErrand.title}</Text>

            <Text style={styles.route}>
              📍 {activeErrand.pickup_location}
            </Text>

            <Text style={styles.route}>
              🏁 {activeErrand.delivery_location}
            </Text>

            <Text style={styles.amount}>
              {ngn.format(getAmount(activeErrand))}
            </Text>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => handleConfirm(activeErrand.id)}
            >
              {confirmingId === activeErrand.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Confirm Delivery</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <FlatList
        data={errands.filter((e) => e.status !== 'accepted')}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchErrands}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.route}>
              {item.pickup_location} → {item.delivery_location}
            </Text>
            <Text style={styles.amount}>
              {ngn.format(getAmount(item))}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// ─── STYLES ─────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 20 },

  header: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },

  trackCard: {
    backgroundColor: '#052e16',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: C.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  title: { color: 'white', fontWeight: 'bold' },

  route: { color: C.muted },

  amount: { color: C.green, marginTop: 5 },

  confirmBtn: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },

  btnText: { color: 'white', fontWeight: 'bold' },
});