import { useState } from 'react';
import AuthScreen from './screens/AuthScreen';
import MainApp from './MainApp';

export default function App() {
  const [user, setUser] = useState<any>(null);

  // 🔐 AUTH GATE
  if (!user) {
    return <AuthScreen setUser={setUser} />;
  }

  // 🚀 MAIN APP
  return <MainApp user={user} setUser={setUser} />;
}