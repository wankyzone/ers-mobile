import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet
} from 'react-native';

const API = "http://100.115.92.197:3000/errands";

export default function TransactionsScreen({ user, setTab }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchTransactions = async () => {
    const res = await fetch(`${API}/transactions/${user.id}`);
    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>

      <ScrollView>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.card}>
              <Text style={styles.type}>
                {tx.type.toUpperCase()}
              </Text>

              <Text style={styles.amount}>
                ₦{tx.amount}
              </Text>

              <Text style={styles.status}>
                {tx.status}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Text style={styles.back} onPress={() => setTab('wallet')}>
        ← Back
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10
  },
  empty: {
    color: '#94a3b8'
  },
  card: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginVertical: 6
  },
  type: {
    color: '#22c55e',
    fontWeight: 'bold'
  },
  amount: {
    color: 'white',
    fontSize: 18
  },
  status: {
    color: '#94a3b8'
  },
  back: {
    color: '#22c55e',
    marginTop: 20
  }
});