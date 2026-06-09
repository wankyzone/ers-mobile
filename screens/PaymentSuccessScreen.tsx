import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// ─── Props ───────────────────────────────────────────────────────

interface Props {
  amount: number;
  reference?: string;
  onDone: () => void;
  onViewTransactions: () => void;
}

// ─── Formatter ───────────────────────────────────────────────────

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
});

// ─── Screen ──────────────────────────────────────────────────────

export default function PaymentSuccessScreen({
  amount,
  reference,
  onDone,
  onViewTransactions,
}: Props) {
  return (
    <View style={s.container}>

      {/* ✅ Success Icon */}
      <View style={s.iconWrapper}>
        <Text style={s.icon}>✓</Text>
      </View>

      {/* Title */}
      <Text style={s.title}>Payment Successful</Text>

      {/* Amount */}
      <Text style={s.amount}>{ngn.format(amount)}</Text>

      {/* Subtitle */}
      <Text style={s.subtitle}>
        Your wallet has been credited successfully.
      </Text>

      {/* Reference */}
      {!!reference && (
        <Text style={s.ref}>
          Ref: {reference.slice(0, 10)}...
        </Text>
      )}

      {/* Actions */}
      <View style={s.actions}>

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={onDone}
        >
          <Text style={s.primaryText}>Back to Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={onViewTransactions}
        >
          <Text style={s.secondaryText}>View Transactions</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  icon: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },

  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },

  amount: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },

  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 10,
  },

  ref: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 30,
  },

  actions: {
    width: '100%',
  },

  primaryBtn: {
    backgroundColor: '#22c55e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  primaryText: {
    color: 'white',
    fontWeight: '700',
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#22c55e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  secondaryText: {
    color: '#22c55e',
    fontWeight: '700',
  },
});