import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/context/AuthContext';
import { getClientErrands, confirmErrand } from '../src/services/api';
import TrackingMap from '../src/components/TrackingMap';
import { useSocket } from '../src/hooks/useSocket';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export default function ClientScreen() {
  const { user } = useAuth();

  const socketRef = useSocket(API_URL);

  const [errands, setErrands] = useState<any[]>([]);
  const [runnerLocation, setRunnerLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ─── FETCH ─────────────────

  useEffect(() => {
    console.log('USER:', user);

    if (!user?.id) {
      console.warn('User not ready, skipping API call');
      return;
    }

    (async () => {
      try {
        const data = await getClientErrands();
        setErrands(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ─── ACTIVE ERRAND ─────────────────

  const activeErrand = useMemo(
    () => errands.find((e) => e.status === 'accepted'),
    [errands]
  );

  // ─── SOCKET TRACKING ─────────────────

  useEffect(() => {
    if (!activeErrand) return;

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join:errand', activeErrand.id);

    const handler = (data: any) => {
      setRunnerLocation({
        latitude: data.lat,
        longitude: data.lng,
      });
    };

    socket.on('location:update', handler);

    return () => {
      socket.off('location:update', handler);
    };
  }, [activeErrand]);

  // ─── CONFIRM ─────────────────

  const handleConfirm = async (id: string) => {
    console.log('USER:', user);

    if (!user?.id) {
      console.warn('User not ready, skipping API call');
      return;
    }

    const updated = await confirmErrand(id);

    setErrands((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  // ─── UI ─────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
        <ActivityIndicator color="#22c55e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.header}>My Errands</Text>

      {activeErrand && (
        <>
          <TrackingMap runnerLocation={runnerLocation} />

          <TouchableOpacity
            style={styles.btn}
            onPress={() => handleConfirm(activeErrand.id)}
          >
            <Text style={{ color: 'white' }}>Confirm Delivery</Text>
          </TouchableOpacity>
        </>
      )}

      <FlatList
        data={errands}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
            No errands yet
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={{ color: 'white' }}>{item.title}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  header: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  listContent: { paddingBottom: 24 },
  card: {
    backgroundColor: '#0f172a',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: '#22c55e',
    padding: 12,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
