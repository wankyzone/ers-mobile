import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { apiFetch } from '../src/config/api';
import { useAuth } from '../src/context/AuthContext';

interface Props {
  setTab: (tab: string) => void;
}

export default function OtpScreen({ setTab }: Props) {
  const { user } = useAuth();
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    console.log('USER:', user);

    if (!user?.id) {
      console.warn('User not ready, skipping API call');
      return;
    }

    if (!code) return Alert.alert('Enter OTP');

    try {
      setLoading(true);

      const { data, res } = await apiFetch('/otp/verify', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'x-role': user.role,
        },
        body: JSON.stringify({ code }),
      });

      if (!data) {
        Alert.alert('Error', 'Invalid server response');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message);
      }

      Alert.alert('Success', 'Device verified');
      setTab('wallet');

    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Enter OTP</Text>

      <TextInput
        value={code}
        onChangeText={(v: string) => setCode(v)}
        style={s.input}
        keyboardType="numeric"
        placeholder="6-digit code"
        placeholderTextColor="#475569"
      />

      <TouchableOpacity style={s.button} onPress={verify}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.text}>Verify</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
