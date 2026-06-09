import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CreatePinScreen({ setTab }: any) {
  const [pin, setPin] = useState('');

  const handleCreate = async () => {
    if (pin.length !== 4) {
      return Alert.alert('PIN must be 4 digits');
    }

    await fetch(`${BASE_URL}/pin/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    Alert.alert('PIN Created');
    setTab('wallet');
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Create Withdrawal PIN</Text>

      <TextInput
        secureTextEntry
        keyboardType="numeric"
        maxLength={4}
        style={s.input}
        onChangeText={setPin}
      />

      <TouchableOpacity style={s.btn} onPress={handleCreate}>
        <Text style={s.text}>Set PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  title: { color: 'white', fontSize: 22, marginBottom: 20 },
  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: 16,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 10,
  },
  btn: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  text: { color: 'white', textAlign: 'center' },
});