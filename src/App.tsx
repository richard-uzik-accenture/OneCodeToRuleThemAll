import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';

function App() {
  const { session, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return null;

  if (!session) {
    return showAuth ? <Auth onBack={() => setShowAuth(false)} /> : <Landing onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <p>signed in as {session.user.email}</p>
      <button onClick={signOut}>sign out</button>
    </div>
  );
}

export default App;
