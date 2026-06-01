import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

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

export default function RunnerScreen({ user }: any) {
  const [errands, setErrands] = useState<Errand[]>([]);

  /* ================= FETCH ================= */
  const fetchErrands = async () => {
    try {
      const res = await fetch(API, {
        headers: {
          'x-user-id': user?.id,
          'x-role': 'runner'
        }
      });

      const data = await res.json();
      setErrands(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("RUNNER FETCH ERROR:", err);
    }
  };

  /* 🔥 AUTO REFRESH */
  useEffect(() => {
    fetchErrands();

    const interval = setInterval(fetchErrands, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ================= ACTIONS ================= */

  const accept = async (id: string) => {
    await fetch(`${API}/${id}/accept`, {
      method: 'POST',
      headers: {
        'x-runner-id': user?.id
      }
    });

    fetchErrands();
  };

  const complete = async (id: string) => {
    await fetch(`${API}/${id}/complete`, {
      method: 'POST',
      headers: {
        'x-runner-id': user?.id
      }
    });

    fetchErrands();
  };

  /* ================= FILTERS ================= */

  const availableJobs = errands.filter(
    (e) => e.status === 'created' && !e.assigned_runner_id
  );

  const myActiveJob = errands.filter(
    (e) =>
      e.assigned_runner_id === user.id &&
      e.status === 'accepted'
  );

  const completedJobs = errands.filter(
    (e) =>
      e.assigned_runner_id === user.id &&
      e.status === 'completed'
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

      {/* ACCEPT */}
      {e.status === 'created' && !e.assigned_runner_id && (
        <TouchableOpacity style={styles.button} onPress={() => accept(e.id)}>
          <Text style={styles.text}>Accept</Text>
        </TouchableOpacity>
      )}

      {/* COMPLETE */}
      {e.status === 'accepted' && e.assigned_runner_id === user?.id && (
        <TouchableOpacity style={styles.button} onPress={() => complete(e.id)}>
          <Text style={styles.text}>Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = (text: string) => (
    <Text style={styles.empty}>{text}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Runner</Text>

      <ScrollView>

        {/* AVAILABLE */}
        <Text style={styles.section}>Available Jobs</Text>
        {availableJobs.length
          ? availableJobs.map(renderCard)
          : renderEmpty("No jobs available")}

        {/* ACTIVE */}
        <Text style={styles.section}>My Active Job</Text>
        {myActiveJob.length
          ? myActiveJob.map(renderCard)
          : renderEmpty("No active job")}

        {/* COMPLETED */}
        <Text style={styles.section}>Completed Jobs</Text>
        {completedJobs.length
          ? completedJobs.map(renderCard)
          : renderEmpty("No completed jobs yet")}

      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  title: { color: 'white', fontSize: 24 },

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

  button: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center'
  },

  empty: {
    color: '#64748b',
    marginVertical: 5
  }
});