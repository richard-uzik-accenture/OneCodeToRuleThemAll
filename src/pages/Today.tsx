import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useCompareInsertion } from '../hooks/useCompareInsertion';
import { TaskList } from '../components/TaskList';
import { AddTaskFab } from '../components/AddTaskFab';
import { CompareDuel } from '../components/CompareDuel';

export function Today() {
  const {
    tasks, loading, completeTask, dropTask,
    reorderTasks, commitReorder, insertTaskAtIndex,
  } = useTasks();
  const { signOut } = useAuth();
  const { pendingTitle, candidate, active, progress, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  if (loading) return null;

  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="today-shell">
      <aside className="today-rail">
        <span className="wordmark">reflow</span>
        <div className="day-meta">
          <span className="date">{today.toLowerCase()}</span>
          <span className="count">{tasks.length} today</span>
        </div>
        <div className="rail-spacer" />
        <button className="rail-action">start my day</button>
        <button className="rail-signout" onClick={signOut}>sign out</button>
      </aside>

      <header className="today-header-mobile">
        <span className="wordmark">reflow</span>
        <div className="header-right"><span className="count-chip">{tasks.length} today</span></div>
      </header>

      <main className="today-main">
        <h1 className="list-heading">today</h1>
        <p className="list-sub">{tasks.length} thing{tasks.length === 1 ? '' : 's'}, in order.</p>
        <TaskList
          tasks={tasks}
          onComplete={completeTask}
          onDrop={dropTask}
          onReorder={reorderTasks}
          onReorderCommit={commitReorder}
          dimmed={active}
        />
      </main>

      {active && candidate && pendingTitle && (
        <CompareDuel candidate={candidate} newTaskTitle={pendingTitle} progress={progress} onDecide={decide} />
      )}
      <AddTaskFab onAdd={begin} disabled={active} />
    </div>
  );
}
