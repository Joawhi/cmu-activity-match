import { AppProvider, useApp } from './context/AppProvider';
import { LoginScreen } from './components/LoginScreen';
import { AppShell } from './components/AppShell';
import './tailwind.css';

function AppContent() {
  const { currentUser, checkedStorage } = useApp();

  if (!checkedStorage) {
    return null;
  }

  return currentUser ? <AppShell /> : <LoginScreen />;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;