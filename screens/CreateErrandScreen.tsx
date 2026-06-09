import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { createErrand, type ApiError } from '../src/services/api';

// ─── Currency ─────────────────────────────────

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
});

// ─── Props ────────────────────────────────────

interface Props {
  onDone: () => void;
}

// ─── Screen ───────────────────────────────────

export default function CreateErrandScreen({ onDone }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [budget, setBudget] = useState('');

  const [loading, setLoading] = useState(false);

  // ─── Derived ───────────────────────────────

  const parsedBudget = useMemo(() => Number(budget), [budget]);

  const formattedBudget = useMemo(() => {
    if (!parsedBudget || parsedBudget <= 0) return '₦0';
    return ngn.format(parsedBudget);
  }, [parsedBudget]);

  const isValid =
    title.trim() &&
    pickup.trim() &&
    delivery.trim() &&
    parsedBudget > 0;

  // ─── Submit ───────────────────────────────

  const handleCreate = async () => {
    if (!isValid) {
      return Alert.alert('Invalid input', 'Please fill all required fields correctly.');
    }

    try {
      setLoading(true);

      await createErrand({
        title: title.trim(),
        description: description.trim(),
        pickup_location: pickup.trim(),
        delivery_location: delivery.trim(),
        budget: parsedBudget,
      });

      onDone();
    } catch (err) {
      Alert.alert('Error', (err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ───────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.container}>

        <ScrollView showsVerticalScrollIndicator={false}>

          <Text style={s.title}>Create Errand</Text>

          {/* ── Preview Card (Fintech touch) ── */}
          <View style={s.preview}>
            <Text style={s.previewTitle}>
              {title || 'Your errand title'}
            </Text>

            <Text style={s.previewRoute}>
              {pickup || 'Pickup'} → {delivery || 'Delivery'}
            </Text>

            <Text style={s.previewAmount}>
              {formattedBudget}
            </Text>
          </View>

          {/* ── Form ── */}

          <Input label="Title" value={title} onChange={setTitle} />
          <Input label="Description" value={description} onChange={setDescription} multiline />

          <Input label="Pickup Location" value={pickup} onChange={setPickup} />
          <Input label="Delivery Location" value={delivery} onChange={setDelivery} />

          <Input
            label="Budget (₦)"
            value={budget}
            onChange={setBudget}
            keyboardType="numeric"
          />

        </ScrollView>

        {/* ── Sticky CTA ── */}
        <View style={s.bottom}>
          <TouchableOpacity
            style={[
              s.button,
              (!isValid || loading) && s.disabled
            ]}
            onPress={handleCreate}
            disabled={!isValid || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.buttonText}>Post Errand</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onDone}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Input Component ─────────────────────────

function Input({
  label,
  value,
  onChange,
  keyboardType = 'default',
  multiline = false,
}: any) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChange}
        style={[s.input, multiline && s.multiline]}
        placeholderTextColor="#475569"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },

  preview: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },

  previewTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },

  previewRoute: {
    color: '#94a3b8',
    marginTop: 4,
  },

  previewAmount: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 6,
  },

  field: { marginBottom: 14 },

  label: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: 12,
    borderRadius: 10,
  },

  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },

  bottom: {
    paddingTop: 10,
  },

  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },

  cancel: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
});