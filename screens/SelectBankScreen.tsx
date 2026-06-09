import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// ─── Types ─────────────────────────────

interface Bank {
  name: string;
  code: string;
}

interface Props {
  onSelect: (bank: Bank) => void;
  setTab: (tab: string) => void;
}

// ─── Static Bank List (can move to API later) ─────────────────────────────

const BANKS: Bank[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'GTBank', code: '058' },
  { name: 'First Bank', code: '011' },
  { name: 'UBA', code: '033' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank', code: '032' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Opay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Moniepoint', code: '50515' },
];

// ─── Screen ─────────────────────────────

export default function SelectBankScreen({ onSelect, setTab }: Props) {
  const [query, setQuery] = useState('');

  // 🔍 Filter banks
  const filteredBanks = useMemo(() => {
    if (!query.trim()) return BANKS;

    return BANKS.filter((bank) =>
      bank.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <View style={s.container}>
      {/* Header */}
      <Text style={s.title}>Select Bank</Text>

      {/* Search */}
      <TextInput
        placeholder="Search bank..."
        placeholderTextColor="#475569"
        value={query}
        onChangeText={(v: string) => setQuery(v)}
        style={s.search}
      />

      {/* List */}
      <FlatList
        data={filteredBanks}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.bankRow}
            onPress={() => {
              onSelect(item);
              setTab('kyc'); // 🔙 return to KYC
            }}
          >
            {/* Fake logo (circle) */}
            <View style={s.logo}>
              <Text style={s.logoText}>
                {item.name.charAt(0)}
              </Text>
            </View>

            {/* Bank name */}
            <Text style={s.bankName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Back */}
      <TouchableOpacity onPress={() => setTab('kyc')}>
        <Text style={s.back}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },

  search: {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 8,
  },

  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  logoText: {
    color: '#052e16',
    fontWeight: 'bold',
  },

  bankName: {
    color: 'white',
    fontSize: 15,
  },

  back: {
    color: '#22c55e',
    marginTop: 15,
  },
});