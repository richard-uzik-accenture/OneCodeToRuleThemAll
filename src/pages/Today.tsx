import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskList } from '../components/TaskList';
import { AddBar } from '../components/AddBar';

export function Today() {
  const { tasks, loading, addTask, completeTask, dropTask } = useTasks();
  const { signOut } = useAuth();

  if (loading) return null;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
        <span style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--violet)' }}>
          reflow
        </span>
        <button
          onClick={signOut}
          style={{ background: 'none', border: 'none', color: 'var(--dusk)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
        >
          sign out
        </button>
      </header>
      <TaskList tasks={tasks} onComplete={completeTask} onDrop={dropTask} />
      <AddBar onAdd={addTask} />
    </div>
  );
}
