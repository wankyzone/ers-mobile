import { useAuth } from './src/context/AuthContext';
import AuthScreen from './screens/AuthScreen';
import MainApp from './MainApp';

export default function AppShell() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  return user ? <MainApp /> : <AuthScreen />;
}