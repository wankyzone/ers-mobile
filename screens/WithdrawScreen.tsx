import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { withdrawWithPin, type ApiError } from '../src/services/api';

interface Props {
  amount: number;
  setTab: (tab: string) => void;
}

export default function WithdrawScreen({ amount, setTab }: Props) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Handle Input ─────────────────────────

  const handlePress = (digit: string) => {
    if (pin.length >= 4) return;
    setPin((prev) => prev + digit);
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // ─── Submit ───────────────────────────────

  const handleSubmit = async () => {
    if (pin.length < 4) return;

    try {
      setLoading(true);

      const res: any = await withdrawWithPin(amount, pin);

      // 🔥 OTP FLOW
      if (res.requireOtp) {
        setTab('otp-screen');
        return;
      }

      Alert.alert('Success', res.message || 'Withdrawal successful');

      setTab('withdrawal-history');

    } catch (err) {
      Alert.alert(
        'Error',
        (err as ApiError)?.message || 'Withdraw failed'
      );
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  // ─── UI ───────────────────────────────────

  return (
    <View style={s.container}>
      <Text style={s.title}>Enter PIN</Text>
      <Text style={s.subtitle}>Authorize withdrawal</Text>

      {/* PIN DISPLAY */}
      <View style={s.pinRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[s.pinDot, pin[i] && s.pinFilled]}
          />
        ))}
      </View>

      {/* KEYPAD */}
      <View style={s.keypad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
          <TouchableOpacity
            key={i}
            style={s.key}
            onPress={() => {
              if (key === '⌫') handleDelete();
              else if (key) handlePress(key);
            }}
          >
            <Text style={s.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ACTION */}
      <TouchableOpacity
        style={[s.button, pin.length < 4 && s.disabled]}
        onPress={handleSubmit}
        disabled={pin.length < 4 || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.buttonText}>Confirm Withdrawal</Text>}
      </TouchableOpacity>

      {/* HISTORY LINK */}
      <TouchableOpacity onPress={() => setTab('withdrawal-history')}>
        <Text style={s.link}>View Withdrawal History →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
    justifyContent: 'center',
  },

  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },

  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 12,
  },

  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1e293b',
  },

  pinFilled: {
    backgroundColor: '#22c55e',
  },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  key: {
    width: '30%',
    padding: 20,
    alignItems: 'center',
  },

  keyText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },

  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: 'white',
    fontWeight: '700',
  },

  link: {
    color: '#22c55e',
    marginTop: 20,
    textAlign: 'center',
  },
});