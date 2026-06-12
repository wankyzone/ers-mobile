import { AuthProvider } from './src/context/AuthContext';
import AppShell from './AppShell';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}