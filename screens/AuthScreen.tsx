import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import supabase from '../supabase';

// ─── Colors ─────────────────────────────────────────────────────────────

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

// ─── Input Component ─────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChangeText,
  secure,
  keyboardType = 'default',
  editable = true,
}: any) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.inputWrap}>
      <Text style={s.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        style={[
          s.input,
          focused && { borderColor: C.green },
        ]}
        placeholderTextColor={C.textMute}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
      />
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'client' | 'runner'>('client');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const e = email.trim();
    const p = password.trim();

    if (!e || !p) {
      return Alert.alert('Missing fields', 'Enter email and password');
    }

    if (p.length < 6) {
      return Alert.alert('Weak password', 'Minimum 6 characters');
    }

    try {
      setLoading(true);

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: e,
          password: p,
        });

        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: e,
          password: p,
          options: { data: { role } },
        });

        if (error) throw error;

        if (!data.session) {
          Alert.alert(
            'Check your email',
            'Confirm your email before logging in'
          );
          setMode('login');
          return;
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ───────────────── */}
      <View style={s.header}>
        <Text style={s.logo}>ERS</Text>
        <Text style={s.tagline}>
          Send errands. Get things done.
        </Text>
      </View>

      {/* ── Mode Switch ─────────── */}
      <View style={s.switchRow}>
        <TouchableOpacity
          style={[
            s.switchBtn,
            mode === 'login' && s.switchActive,
          ]}
          onPress={() => setMode('login')}
        >
          <Text style={s.switchText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.switchBtn,
            mode === 'signup' && s.switchActive,
          ]}
          onPress={() => setMode('signup')}
        >
          <Text style={s.switchText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* ── Card ───────────────── */}
      <View style={s.card}>
        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secure
          editable={!loading}
        />

        {/* Role Selector */}
        {mode === 'signup' && (
          <View style={s.roleRow}>
            {['client', 'runner'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  s.roleBtn,
                  role === r && s.roleActive,
                ]}
                onPress={() => setRole(r as any)}
              >
                <Text style={s.roleText}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, loading && { opacity: 0.6 }]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.ctaText}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Footer ─────────────── */}
      <Text style={s.footer}>
  Secure authentication powered by Wanky
</Text>
<Text style={s.subFooter}>
  ERS Platform
</Text>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 20,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logo: {
    color: C.textPri,
    fontSize: 34,
    fontWeight: '800',
  },

  tagline: {
    color: C.textSec,
    marginTop: 6,
  },

  switchRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 10,
    marginBottom: 20,
  },

  switchBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },

  switchActive: {
    backgroundColor: C.green,
    borderRadius: 10,
  },

  switchText: {
    color: 'white',
    fontWeight: '600',
  },

  card: {
    backgroundColor: C.card,
    padding: 20,
    borderRadius: 14,
  },

  inputWrap: {
    marginBottom: 15,
  },

  label: {
    color: C.textSec,
    marginBottom: 6,
    fontSize: 12,
  },

  input: {
    backgroundColor: C.bg,
    color: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },

  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },

  roleActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },

  roleText: {
    color: 'white',
    fontWeight: '600',
  },

  cta: {
    backgroundColor: C.green,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  ctaText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },

  footer: {
    textAlign: 'center',
    color: C.textMute,
    marginTop: 20,
    fontSize: 12,
  },

  subFooter: {
    textAlign: 'center',
    color: C.textMute,
    marginTop: 5,
    fontSize: 10,
  },
});