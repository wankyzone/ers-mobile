// screens/RunnerScreen.tsx — FINTECH + MARKETPLACE UPGRADE

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/context/AuthContext';
import { DEBUG_API } from '../src/config/api';
import { useApiDebugText } from '../src/hooks/useApiDebugText';
import {
  acceptErrand,
  getOpenErrands,
  type ApiError,
  type Errand,
} from '../src/services/api';

// ─── Tokens ─────────────────────────

const C = {
  bg: '#020617',
  card: '#0f172a',
  border: '#1e293b',
  green: '#22c55e',
  red: '#ef4444',
  textPri: '#f1f5f9',
  textSec: '#94a3b8',
  textMute: '#475569',
};

// ─── Helpers ───────────────────────

function resolveAmount(errand: Errand): number {
  const b = Number(errand.budget);
  const p = Number(errand.price);

  if (!isNaN(b) && b > 0) return b;
  if (!isNaN(p) && p > 0) return p;
  return 0;
}

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
});

function formatNGN(v: number) {
  return ngn.format(v);
}

// ─── Card ──────────────────────────

interface CardProps {
  errand: Errand;
  onAccept: (id: string) => void;
  accepting: boolean;
}

const ErrandCard = React.memo(function ErrandCard({
  errand,
  onAccept,
  accepting,
}: CardProps) {
  const amount = resolveAmount(errand);

  return (
    <View style={card.wrapper}>
      <View style={card.body}>
        <Text style={card.title}>{errand.title}</Text>

        {(errand.pickup_location || errand.delivery_location) && (
          <View style={card.routeBox}>
            <Text style={card.routeText}>
              📍 {errand.pickup_location ?? '—'}
            </Text>
            <Text style={card.routeText}>
              🏁 {errand.delivery_location ?? '—'}
            </Text>
          </View>
        )}

        {!!errand.description && (
          <Text style={card.desc} numberOfLines={2}>
            {errand.description}
          </Text>
        )}

        <Text style={card.amount}>
          {amount > 0 ? formatNGN(amount) : 'Amount TBD'}
        </Text>
      </View>

      <TouchableOpacity
        style={[card.btn, accepting && card.disabled]}
        onPress={() => onAccept(errand.id)}
        disabled={accepting}
        activeOpacity={0.8}
      >
        {accepting
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={card.btnText}>Accept</Text>}
      </TouchableOpacity>
    </View>
  );
});

// ─── Screen ───────────────────────

export default function RunnerScreen() {
  const { user } = useAuth();
  const debugText = useApiDebugText();

  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptLock = useRef(false);

  // ─── Fetch ─────────────────────

  const fetchErrands = useCallback(
    async (opts: { refreshing?: boolean } = {}) => {
      console.log('USER:', user);

      if (!user?.id) {
        console.warn('User not ready, skipping API call');
        return;
      }

      try {
        opts.refreshing ? setRefreshing(true) : setLoading(true);
        setError(null);

        const data = await getOpenErrands();
        setErrands(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as ApiError)?.message ?? 'Failed to load errands');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchErrands();
  }, [fetchErrands]);

  // ─── Accept ─────────────────────

  const handleAccept = useCallback(
    (id: string) => {
      if (acceptLock.current) return;

      Alert.alert('Accept Errand', 'Take this job?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            console.log('USER:', user);

            if (!user?.id) {
              console.warn('User not ready, skipping API call');
              return;
            }

            acceptLock.current = true;
            setAcceptingId(id);

            const snapshot = errands;
            setErrands(prev => prev.filter(e => e.id !== id));

            try {
              await acceptErrand(id);
            } catch (err) {
              setErrands(snapshot);
              setError(
                (err as ApiError)?.message ?? 'Accept failed'
              );
            } finally {
              acceptLock.current = false;
              setAcceptingId(null);
            }
          },
        },
      ]);
    },
    [errands, user]
  );

  // ─── List ───────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Errand }) => (
      <ErrandCard
        errand={item}
        onAccept={handleAccept}
        accepting={acceptingId === item.id}
      />
    ),
    [handleAccept, acceptingId]
  );

  const empty = useMemo(() => (
    <View style={s.centered}>
      <Text style={s.emptyTitle}>No errands available</Text>
      <Text style={s.emptyHint}>Pull down to refresh</Text>
    </View>
  ), []);

  // ─── Render ─────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={C.green} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.title}>Available Errands</Text>

        <View style={s.headerRight}>
          <Text style={s.count}>{errands.length}</Text>

          <TouchableOpacity onPress={() => fetchErrands()}>
            <Text style={s.refresh}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={s.error}>{error}</Text>}

      {DEBUG_API && !!debugText && (
        <Text style={{ color: 'white', marginTop: 20 }}>
          {debugText}
        </Text>
      )}

      <FlatList
        data={errands}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        contentContainerStyle={
          errands.length === 0 ? s.fill : s.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchErrands({ refreshing: true })}
            tintColor={C.green}
          />
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  count: {
    color: C.green,
    fontWeight: '700',
    fontSize: 16,
  },

  refresh: {
    color: C.textSec,
    fontSize: 18,
  },

  title: {
    color: C.textPri,
    fontSize: 24,
    fontWeight: '700',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  list: { paddingBottom: 40 },
  fill: { flex: 1 },

  emptyTitle: {
    color: C.textSec,
    fontWeight: '600',
  },

  emptyHint: {
    color: C.textMute,
    marginTop: 6,
  },

  error: {
    backgroundColor: C.red,
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
  },
});

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    gap: 12,
  },

  body: { flex: 1 },

  title: {
    color: C.textPri,
    fontWeight: '700',
    fontSize: 15,
  },

  routeBox: { marginTop: 6 },
  routeText: {
    color: C.textSec,
    fontSize: 12,
  },

  desc: {
    color: C.textMute,
    fontSize: 12,
    marginTop: 4,
  },

  amount: {
    color: C.green,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 6,
  },

  btn: {
    backgroundColor: C.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'center',
  },

  disabled: { opacity: 0.5 },

  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
