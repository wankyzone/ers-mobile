import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import ClientScreen from './screens/ClientScreen';
import RunnerScreen from './screens/RunnerScreen';
import WalletScreen from './screens/WalletScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function MainApp({ user, setUser }: any) {
  const [tab, setTab] = useState<'client' | 'runner' | 'wallet' | 'profile'>('client');

  const renderScreen = () => {
    switch (tab) {
      case 'client':
        return <ClientScreen user={user} />;
      case 'runner':
        return <RunnerScreen user={user} />;
      case 'wallet':
        return <WalletScreen user={user} setTab={setTab} />;
      case 'profile':
        return <ProfileScreen setUser={setUser} setTab={setTab} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>

      {/* GLOBAL NAV */}
      <View style={styles.nav}>
        <Tab label="Client" active={tab === 'client'} onPress={() => setTab('client')} />
        <Tab label="Runner" active={tab === 'runner'} onPress={() => setTab('runner')} />
        <Tab label="Wallet" active={tab === 'wallet'} onPress={() => setTab('wallet')} />
        <Tab label="Profile" active={tab === 'profile'} onPress={() => setTab('profile')} />
      </View>
    </View>
  );
}

function Tab({ label, onPress, active }: any) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={[styles.navText, active && { color: '#22c55e' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#020617',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#0f172a'
  },
  navText: {
    color: '#64748b',
    fontWeight: 'bold'
  }
});