import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { listActiveTasks, type Task } from './lib/tasks';

function App() {
  const { session, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (session) listActiveTasks().then(setTasks);
  }, [session]);

  if (loading) return null;

  if (!session) {
    return showAuth ? <Auth onBack={() => setShowAuth(false)} /> : <Landing onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <p>signed in as {session.user.email}</p>
      <button onClick={signOut}>sign out</button>
      <pre>{JSON.stringify(tasks, null, 2)}</pre>
    </div>
  );
}

export default App;
