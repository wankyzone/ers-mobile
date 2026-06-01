import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking
} from 'react-native';
import supabase from '../supabase';


const API = "http://100.115.92.197:3000/errands";

export default function WalletScreen({ user, setTab }: any) {
  const [wallet, setWallet] = useState<any>({
    balance: 0,
    available_balance: 0
  });

  const [amount, setAmount] = useState('');
  const [recipientCode, setRecipientCode] = useState('');

  const fetchWallet = async () => {
  try {
    const res = await fetch(`http://100.115.92.197:3000/errands/wallet`, {
      headers: {
        'x-user-id': user?.id
      }
    });

    const data = await res.json();

    if (!data) {
  console.log("⚠️ NO WALLET DATA");
  return;
}

    setWallet(data);
  } catch (e) {
    console.log("WALLET FETCH ERROR:", e);
  }
};

  useEffect(() => {
  const interval = setInterval(() => {
    fetchWallet();
  }, 3000); // poll every 3s

  return () => clearInterval(interval);
}, []);

  /* ================= ADD MONEY ================= */
  const addMoney = async () => {
  const res = await fetch(`${API}/paystack/initialize`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: user.email,
      amount: Number(amount),
      user_id: user.id
    })
  });

  const data = await res.json();

  if (!data.status) return alert("Init failed");

  const url = data.data.authorization_url;
  const ref = data.data.reference;

  // open payment
  await Linking.openURL(url);

  // ⚠️ AFTER PAYMENT (fallback polling)
  setTimeout(async () => {
    await fetch(`${API}/paystack/verify/${ref}`);
    fetchWallet();
  }, 5000);
};

  /* ================= WITHDRAW ================= */
  const withdraw = async () => {
    try {
      const res = await fetch(`${API}/paystack/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(amount),
          recipient_code: recipientCode,
          user_id: user.id
        })
      });

      const data = await res.json();

      if (data.error) return alert(data.error);

      if (!user) return null;

      alert("Withdrawal started");
      fetchWallet();

    } catch {
      alert("Withdraw failed");
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Wallet</Text>

      <Text style={styles.amount}>₦{wallet.balance}</Text>

      {/* ===== ADD MONEY ===== */}
      <View style={styles.card}>
        <Text style={styles.label}>Add Money</Text>

        <TextInput
          placeholder="Amount"
          placeholderTextColor="#94a3b8"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={addMoney}>
          <Text style={styles.text}>Fund Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* ===== WITHDRAW ===== */}
      <View style={styles.card}>
        <Text style={styles.label}>Withdraw</Text>

        <TextInput
          placeholder="Amount"
          placeholderTextColor="#94a3b8"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />

        <TextInput
          placeholder="Recipient Code"
          placeholderTextColor="#94a3b8"
          value={recipientCode}
          onChangeText={setRecipientCode}
          style={styles.input}
        />

        <TouchableOpacity style={styles.buttonDanger} onPress={withdraw}>
          <Text style={styles.text}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* ===== ANALYTICS ===== */}
      <View style={styles.card}>
        <Text style={styles.label}>Analytics</Text>

        <Text style={styles.text}>
          Total Earned: ₦{wallet.available_balance}
        </Text>

        <Text style={styles.text}>
          Total Deposited: ₦{wallet.balance}
        </Text>
      </View>

      {/* NAVIGATION */}
      <TouchableOpacity onPress={() => setTab('transactions')}>
        <Text style={styles.link}>View Transactions →</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setTab('client')}>
        <Text style={styles.link}>← Back</Text>
      </TouchableOpacity>

    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20
  },
  title: {
    color: 'white',
    fontSize: 24
  },
  amount: {
    color: 'white',
    fontSize: 30,
    marginVertical: 20
  },
  card: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10
  },
  label: {
    color: '#94a3b8',
    marginBottom: 10
  },
  input: {
    backgroundColor: '#020617',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  },
  link: {
    color: '#22c55e',
    marginTop: 15
  }
});