import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import supabase from '../supabase';

 export default function ProfileScreen({ setUser, setTab }: any) {

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity style={styles.buttonDanger} onPress={logout}>
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setTab('client')}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  title: { color: 'white', fontSize: 24 },

  buttonDanger: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 10,
    marginTop: 10
  },

  text: { color: 'white', textAlign: 'center' },

  back: {
    color: '#22c55e',
    marginTop: 20
  }
});