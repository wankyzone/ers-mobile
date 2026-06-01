import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import supabase from '../supabase';

export default function AuthScreen({ setUser }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    const res = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (res.error) return alert(res.error.message);
    setUser(res.data.user);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ERS</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.text}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switch}>
          {isLogin ? 'Create account' : 'Already have account?'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 20 },
  title: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#0f172a', color: 'white', padding: 12, borderRadius: 10, marginBottom: 10 },
  button: { backgroundColor: '#22c55e', padding: 14, borderRadius: 10, alignItems: 'center' },
  text: { color: 'white', fontWeight: 'bold' },
  switch: { color: '#22c55e', marginTop: 10 }
});