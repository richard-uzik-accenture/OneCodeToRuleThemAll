import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Today } from './pages/Today';

function App() {
  const { session, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return null;

  if (!session) {
    return showAuth ? <Auth onBack={() => setShowAuth(false)} /> : <Landing onGetStarted={() => setShowAuth(true)} />;
  }

  return <Today />;
}

export default App;
