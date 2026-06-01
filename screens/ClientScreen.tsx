import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet
} from 'react-native';

const API = "http://100.115.92.197:3000/errands";

type Errand = {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  client_id: string;
  assigned_runner_id?: string | null;
  escrow_status?: string;
};

export default function ClientScreen({ user }: any) {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  /* ================= FETCH ================= */
  const fetchErrands = async () => {
    try {
      const res = await fetch(API, {
        headers: {
          'x-user-id': user?.id,
          'x-role': 'client'
        }
      });

      const data = await res.json();
      setErrands(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("CLIENT FETCH ERROR:", err);
    }
  };

  /* 🔥 AUTO REFRESH */
  useEffect(() => {
    fetchErrands();

    const interval = setInterval(fetchErrands, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ================= ACTIONS ================= */

  const createErrand = async () => {
    if (!title || !price) return alert("Missing fields");

    await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': user?.id
      },
      body: JSON.stringify({
        title,
        description,
        price: Number(price)
      })
    });

    setTitle('');
    setDescription('');
    setPrice('');
    fetchErrands();
  };

  const confirm = async (id: string) => {
    await fetch(`${API}/${id}/confirm`, {
      method: 'POST',
      headers: {
        'x-client-id': user?.id
      }
    });

    fetchErrands();
  };

  /* ================= FILTERS ================= */

  const activeOrders = errands.filter(
    (e) => e.status !== 'confirmed'
  );

  const awaitingConfirmation = errands.filter(
    (e) => e.escrow_status === 'awaiting_confirmation'
  );

  const completedOrders = errands.filter(
    (e) => e.status === 'confirmed'
  );

  /* ================= CARD ================= */

  const renderCard = (e: Errand) => (
    <View key={e.id} style={styles.card}>
      <Text style={styles.text}>{e.title}</Text>
      <Text style={styles.sub}>{e.description}</Text>
      <Text style={styles.amount}>₦{e.price}</Text>

      {/* 🔥 STATUS */}
      <Text style={styles.status}>
        {e.status.toUpperCase()}
      </Text>

      {/* 🔥 CONFIRM BUTTON */}
      {e.escrow_status === 'awaiting_confirmation' && (
        <TouchableOpacity style={styles.button} onPress={() => confirm(e.id)}>
          <Text style={styles.text}>Confirm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = (text: string) => (
    <Text style={styles.empty}>{text}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client</Text>

      {/* CREATE */}
      <View style={styles.card}>
        <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input}/>
        <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input}/>
        <TextInput placeholder="Price" value={price} onChangeText={setPrice} style={styles.input}/>

        <TouchableOpacity style={styles.button} onPress={createErrand}>
          <Text style={styles.text}>Create Errand</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>

        {/* ACTIVE */}
        <Text style={styles.section}>Active Orders</Text>
        {activeOrders.length ? activeOrders.map(renderCard) : renderEmpty("No active orders")}

        {/* AWAITING */}
        <Text style={styles.section}>Awaiting Confirmation</Text>
        {awaitingConfirmation.length
          ? awaitingConfirmation.map(renderCard)
          : renderEmpty("Nothing to confirm yet")}

        {/* COMPLETED */}
        <Text style={styles.section}>Completed</Text>
        {completedOrders.length
          ? completedOrders.map(renderCard)
          : renderEmpty("No completed errands yet")}

      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  title: { color: 'white', fontSize: 24, marginBottom: 10 },

  section: {
    color: '#22c55e',
    marginTop: 15,
    fontWeight: 'bold'
  },

  card: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginVertical: 8
  },

  input: {
    backgroundColor: '#020617',
    color: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8
  },

  button: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },

  text: { color: 'white', fontWeight: 'bold' },
  sub: { color: '#94a3b8' },

  amount: {
    color: 'white',
    marginTop: 5,
    fontWeight: 'bold'
  },

  status: {
    marginTop: 6,
    color: '#22c55e',
    fontSize: 12,
    fontWeight: 'bold'
  },

  empty: {
    color: '#64748b',
    marginVertical: 5
  }
});