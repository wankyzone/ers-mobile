// screens/ProfileScreen.tsx — FINAL MERGED VERSION

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
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
  getClientErrands,
  getTransactions,
  type ApiError,
  type Errand,
  type Transaction,
} from '../src/services/api';

// ─── Tokens ─────────────────────────

const C = {
  bg: '#020617',
  card: '#0f172a',
  border: '#1e293b',
  green: '#22c55e',
  red: '#ef4444',
  text: '#f1f5f9',
  sub: '#94a3b8',
};

// ─── Stats Logic ───────────────────

function computeStats(errands: Errand[], tx: Transaction[]) {
  const total = errands.length;
  const completed = errands.filter(e => e.status === 'confirmed').length;

  const earnings = tx
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    total,
    completed,
    rate: total ? `${Math.round((completed / total) * 100)}%` : '—',
    earnings: `₦${earnings.toLocaleString('en-NG')}`,
  };
}

// ─── Screen ───────────────────────

export default function ProfileScreen({ setTab }: any) {
  const { user, logout } = useAuth();
  const debugText = useApiDebugText();

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    rate: '—',
    earnings: '₦0',
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Fetch ─────────────────────

  const load = useCallback(async (refresh = false) => {
    console.log('USER:', user);

    if (!user?.id) {
      console.warn('User not ready, skipping API call');
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);

    const [errandsRes, txRes] = await Promise.allSettled([
      getClientErrands(),
      getTransactions(),
    ]);

    const errands =
      errandsRes.status === 'fulfilled' ? errandsRes.value : [];

    const tx =
      txRes.status === 'fulfilled' ? txRes.value : [];

    if (errandsRes.status === 'rejected' || txRes.status === 'rejected') {
      Alert.alert('Warning', 'Some stats failed to load.');
    }

    setStats(computeStats(errands, tx));

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ─── Logout (FULLY SAFE) ───────

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
          } catch {
            Alert.alert('Error', 'Logout failed');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  // ─── UI ─────────────────────────

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.green}
          />
        }
      >
        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.title}>Profile</Text>
        </View>

        {DEBUG_API && !!debugText && (
          <Text style={{ color: 'white', marginTop: 20 }}>
            {debugText}
          </Text>
        )}

      {/* PROFILE CARD */}
      <View style={s.profileCard}>
        <Text style={s.userId}>
          ****{user?.id?.slice(-8)}
        </Text>
        <Text style={s.role}>{user?.role}</Text>
      </View>

      {/* 💰 BALANCE CARD */}
      <View style={s.balanceCard}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.balance}>{stats.earnings}</Text>}
        <Text style={s.balanceLabel}>Total Earnings</Text>
      </View>

      {/* STATS */}
      <View style={s.statsRow}>
        <Stat label="Errands" value={stats.total} loading={loading} />
        <Stat label="Completed" value={stats.completed} loading={loading} />
        <Stat label="Rate" value={stats.rate} loading={loading} />
      </View>

      {/* QUICK ACTIONS */}
      <Section title="Quick Actions">
        <Menu label="Transactions" onPress={() => setTab('transactions')} />
        <Menu label="My Errands" onPress={() => setTab('client')} />
        <Menu label="Wallet" onPress={() => setTab('wallet')} />
      </Section>

      {/* SETTINGS */}
      <Section title="Settings">
        <Menu label="KYC Verification" onPress={() => setTab('kyc')} />
        <Menu label="Bank Accounts" onPress={() => setTab('select-bank')} />
      </Section>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[s.logout, loggingOut && s.disabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.logoutText}>Log Out</Text>}
      </TouchableOpacity>

        <Text style={s.version}>ERS v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Components ─────────────────

function Stat({ label, value, loading }: any) {
  return (
    <View style={s.stat}>
      {loading
        ? <ActivityIndicator color="#22c55e" />
        : <Text style={s.statValue}>{value}</Text>}
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Menu({ label, onPress }: any) {
  return (
    <TouchableOpacity style={s.menu} onPress={onPress}>
      <Text style={s.menuText}>{label}</Text>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ─────────────────────

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 20,
    paddingBottom: 32,
  },

  header: { marginBottom: 20 },

  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
  },

  profileCard: {
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  userId: { color: C.sub },
  role: { color: C.green, marginTop: 4 },

  balanceCard: {
    backgroundColor: C.green,
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: 'center',
  },

  balance: {
    fontSize: 28,
    fontWeight: '800',
    color: '#052e16',
  },

  balanceLabel: {
    color: '#052e16',
    marginTop: 5,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  stat: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
  },

  statValue: {
    color: 'white',
    fontWeight: '700',
  },

  statLabel: {
    color: C.sub,
    fontSize: 11,
  },

  section: { marginBottom: 20 },

  sectionTitle: {
    color: C.sub,
    marginBottom: 8,
  },

  menu: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  menuText: { color: 'white' },
  chevron: { color: C.sub },

  logout: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
  },

  disabled: { opacity: 0.5 },

  version: {
    textAlign: 'center',
    color: '#475569',
    marginTop: 20,
  },
});
