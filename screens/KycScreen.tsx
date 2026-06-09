import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { useAuth } from '../src/context/AuthContext';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ─────────────────────────

interface KycForm {
  full_name: string;
  phone: string;
  bvn: string;
  bank_code: string;
  bank_name: string; // ✅ NEW
  account_number: string;
  account_name: string;
}

interface Props {
  setTab: (tab: string) => void;
}

// ─── Debounce Hook ─────────────────

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

// ─── Screen ───────────────────────

export default function KycScreen({ setTab }: Props) {
  const { user } = useAuth();

  const [form, setForm] = useState<KycForm>({
    full_name: '',
    phone: '',
    bvn: '',
    bank_code: '',
    bank_name: '', // ✅ NEW
    account_number: '',
    account_name: '',
  });

  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const debouncedAccount = useDebounce(form.account_number, 700);

  // ─── Reset account when bank changes ──
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      account_name: '',
    }));
  }, [form.bank_code]);

  // ─── Resolve Account ─────────────────

  useEffect(() => {
    const resolve = async () => {
      if (debouncedAccount.length !== 10 || !form.bank_code) return;

      try {
        setResolving(true);
        setResolveError('');

        const res = await fetch(`${BASE_URL}/paystack/resolve-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_number: debouncedAccount,
            bank_code: form.bank_code,
          }),
        });

        const data = await res.json();

        if (data.status) {
          setForm(prev => ({
            ...prev,
            account_name: data.data.account_name,
          }));
        } else {
          setResolveError('Invalid account details');
        }
      } catch {
        setResolveError('Could not verify account');
      } finally {
        setResolving(false);
      }
    };

    resolve();
  }, [debouncedAccount, form.bank_code]);

  // ─── Validation ─────────────────

  const isValid = useMemo(() => {
    return (
      form.full_name.trim() &&
      form.phone.trim() &&
      form.bvn.trim() &&
      form.bank_code.trim() &&
      form.bank_name.trim() && // ✅ REQUIRED
      form.account_number.trim() &&
      form.account_name.trim()
    );
  }, [form]);

  // ─── SAVE BANK (LOCAL MOCK) ─────────────────

  const saveBankAccount = async () => {
    console.log('💾 Saving bank:', {
      bank_name: form.bank_name,
      bank_code: form.bank_code,
      account_number: form.account_number,
      account_name: form.account_name,
    });

    // Later:
    // await fetch('/bank-accounts', ...)
  };

  // ─── Submit ─────────────────────

  const handleSubmit = async () => {
    if (!user?.id) {
      return Alert.alert('Error', 'User not authenticated');
    }

    if (!isValid) {
      return Alert.alert('Incomplete', 'Please complete all fields');
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/kyc/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // ✅ SAVE BANK AFTER SUCCESS
      await saveBankAccount();

      Alert.alert('KYC Complete ✅', 'Your account is now verified');

      setTab('wallet');

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ─────────────────────────

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Verify Your Identity</Text>
      <Text style={s.subtitle}>
        Required for withdrawals & higher limits
      </Text>

      {/* Personal Info */}
      <Section title="Personal Information">
        <Input label="Full Name" value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })} />

        <Input label="Phone Number" value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad" />

        <Input label="BVN" value={form.bvn}
          onChange={(v) => setForm({ ...form, bvn: v })}
          keyboardType="numeric" />
      </Section>

      {/* Bank Info */}
      <Section title="Bank Details">

        {/* BANK SELECTOR */}
        <TouchableOpacity
          style={s.input}
          onPress={() =>
            setTab('select-bank')
          }
        >
          <Text style={{ color: form.bank_name ? 'white' : '#475569' }}>
            {form.bank_name || 'Select Bank'}
          </Text>
        </TouchableOpacity>

        <Input label="Account Number" value={form.account_number}
          onChange={(v) => setForm({ ...form, account_number: v })}
          keyboardType="numeric" />

        {/* Account Resolution */}
        <View style={s.accountBox}>
          {resolving ? (
            <ActivityIndicator color="#22c55e" />
          ) : form.account_name ? (
            <Text style={s.accountName}>✅ {form.account_name}</Text>
          ) : resolveError ? (
            <Text style={s.error}>❌ {resolveError}</Text>
          ) : (
            <Text style={s.placeholder}>
              Account name will appear here
            </Text>
          )}
        </View>
      </Section>

      {/* CTA */}
      <TouchableOpacity
        style={[s.button, (!isValid || loading) && s.disabled]}
        onPress={handleSubmit}
        disabled={!isValid || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.buttonText}>Verify Identity</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Components ─────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}

function Input({ label, value, onChange, keyboardType = 'default' }: InputProps) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(v: string) => onChange(v)}
        style={s.input}
        placeholderTextColor="#475569"
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ─── Styles ─────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },

  title: { color: 'white', fontSize: 26, fontWeight: '700' },

  subtitle: { color: '#94a3b8', marginBottom: 20 },

  section: { marginBottom: 20 },

  sectionTitle: { color: '#64748b', marginBottom: 10, fontWeight: '600' },

  field: { marginBottom: 12 },

  label: { color: '#94a3b8', marginBottom: 4, fontSize: 12 },

  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },

  accountBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },

  accountName: { color: '#22c55e', fontWeight: '600' },

  error: { color: '#ef4444' },

  placeholder: { color: '#475569' },

  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  disabled: { opacity: 0.5 },

  buttonText: { color: 'white', fontWeight: '700' },
});