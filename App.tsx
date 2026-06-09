import { AuthProvider } from './src/context/AuthContext';
import AppShell from './AppShell';
import 'react-native-get-random-values';

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}