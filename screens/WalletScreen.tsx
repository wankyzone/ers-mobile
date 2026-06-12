import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/context/AuthContext';
import {
  withdrawWithPin,
  getUserBanks,
  type BankAccount,
  type ApiError,
} from '../src/services/api';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://100.115.92.197:3000';

// ─── Formatter ─────────────────────────────────

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
});

// ─── Screen ────────────────────────────────────

export default function WalletScreen({ setTab }: any) {
  const { user } = useAuth();

  const [wallet, setWallet] = useState({
    balance: 0,
    available_balance: 0,
  });

  const [amount, setAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pin, setPin] = useState('');

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const defaultBank = useMemo(
    () => banks.find((b) => b.is_default),
    [banks]
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch Wallet ───────────────────────────

  const fetchWallet = useCallback(
    async (opts: { refreshing?: boolean } = {}) => {
      if (!user?.id) return;

      try {
        opts.refreshing ? setRefreshing(true) : setLoading(true);
        setError(null);

        const res = await fetch(`${BASE_URL}/wallet`, {
          headers: {
            'x-user-id': user.id,
            'x-role': user.role,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message);

        setWallet({
          balance: Number(data.balance) || 0,
          available_balance: Number(data.available_balance) || 0,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  // ─── Fetch Banks ────────────────────────────

  const fetchBanks = async () => {
    try {
      const data = await getUserBanks();
      setBanks(data);
    } catch {}
  };

  useEffect(() => {
    fetchWallet();
    fetchBanks();

    const interval = setInterval(fetchWallet, 8000);
    return () => clearInterval(interval);
  }, [fetchWallet]);

  // ─── Add Money ─────────────────────────────

  const addMoney = async () => {
    if (!amount || Number(amount) <= 0) {
      return Alert.alert('Invalid amount');
    }

    try {
      setProcessing(true);

      const res = await fetch(`${BASE_URL}/paystack/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          amount: Number(amount),
          user_id: user?.id,
        }),
      });

      const data = await res.json();
      if (!data.status) throw new Error('Payment failed');

      await Linking.openURL(data.data.authorization_url);

      setTimeout(fetchWallet, 5000);

    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setProcessing(false);
      setAmount('');
    }
  };

  // ─── Withdraw (PIN + OTP FLOW) ─────────────

  const withdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      return Alert.alert('Invalid amount');
    }

    if (!defaultBank) {
      return Alert.alert('No default bank selected');
    }

    if (!pin || pin.length < 4) {
      return Alert.alert('Enter your PIN');
    }

    try {
      setProcessing(true);

      const res = await withdrawWithPin(
        Number(withdrawAmount),
        pin
      );

      // 🚨 OTP REQUIRED FLOW
      if ((res as any).requireOtp) {
        setTab('otp-screen');
        return;
      }

      Alert.alert('Success', res.message || 'Withdrawal started');
      fetchWallet();

    } catch (err) {
      Alert.alert(
        'Error',
        (err as ApiError)?.message || 'Withdraw failed'
      );
    } finally {
      setProcessing(false);
      setWithdrawAmount('');
      setPin('');
    }
  };

  // ─── Render ────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['top', 'left', 'right']}>
        <ActivityIndicator color="#22c55e" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWallet({ refreshing: true })}
            tintColor="#22c55e"
          />
        }
      >
        <Text style={s.title}>Wallet</Text>

      {/* Balance */}
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Available Balance</Text>
        <Text style={s.balanceAmount}>
          {ngn.format(wallet.balance)}
        </Text>
      </View>

      {/* Default Bank */}
      <View style={s.card}>
        <Text style={s.label}>Payout Account</Text>

        {defaultBank ? (
          <Text style={s.bank}>
            {defaultBank.bank_name} • {defaultBank.account_number}
          </Text>
        ) : (
          <Text style={s.error}>No default bank set</Text>
        )}

        <TouchableOpacity onPress={() => setTab('saved-banks')}>
          <Text style={s.link}>Manage Banks →</Text>
        </TouchableOpacity>
      </View>

      {/* Add Money */}
      <View style={s.card}>
        <Text style={s.label}>Fund Wallet</Text>

        <TextInput
          placeholder="Amount"
          placeholderTextColor="#94a3b8"
          value={amount}
          onChangeText={(v: string) => setAmount(v)}
          keyboardType="numeric"
          style={s.input}
        />

        <TouchableOpacity
          style={s.button}
          onPress={addMoney}
          disabled={processing}
        >
          {processing
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.text}>Fund</Text>}
        </TouchableOpacity>
      </View>

      {/* Withdraw */}
      <View style={s.card}>
        <Text style={s.label}>Withdraw</Text>

        <TextInput
          placeholder="Amount"
          placeholderTextColor="#94a3b8"
          value={withdrawAmount}
          onChangeText={(v: string) => setWithdrawAmount(v)}
          keyboardType="numeric"
          style={s.input}
        />

        <TextInput
          placeholder="PIN"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={pin}
          onChangeText={(v: string) => setPin(v)}
          style={s.input}
        />

        <TouchableOpacity
          style={s.buttonDanger}
          onPress={withdraw}
          disabled={processing}
        >
          {processing
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.text}>Withdraw</Text>}
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <TouchableOpacity onPress={() => setTab('transactions')}>
        <Text style={s.link}>View Transactions →</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },

  container: { flex: 1, backgroundColor: '#020617' },

  content: { padding: 20, paddingBottom: 32 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },

  balanceCard: {
    backgroundColor: '#22c55e',
    padding: 22,
    borderRadius: 16,
    marginBottom: 20,
  },

  balanceLabel: { color: '#052e16' },

  balanceAmount: {
    color: '#052e16',
    fontSize: 28,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  label: {
    color: '#94a3b8',
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#020617',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  button: {
    backgroundColor: '#22c55e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonDanger: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  text: { color: 'white', fontWeight: '700' },

  link: {
    color: '#22c55e',
    marginTop: 14,
  },

  bank: {
    color: 'white',
    fontWeight: '600',
  },

  error: {
    color: '#ef4444',
  },
});
