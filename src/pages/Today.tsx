import { AnimatePresence, motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useCompareInsertion } from '../hooks/useCompareInsertion';
import { useMorningFlow } from '../hooks/useMorningFlow';
import { useRolloverPrompt } from '../hooks/useRolloverPrompt';
import { TaskList } from '../components/TaskList';
import { AddTaskFab } from '../components/AddTaskFab';
import { CompareDuel } from '../components/CompareDuel';
import { MorningFlow } from '../components/MorningFlow';

export function Today() {
  const {
    tasks, loading, error, dismissError, addTask, completeTask, dropTask,
    reorderTasks, commitReorder, insertTaskAtIndex, keepLeftover,
  } = useTasks();
  const { signOut } = useAuth();
  const { pendingTitle, candidate, active, placedAt, progress, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  const morning = useMorningFlow({ tasks, keepLeftover, dropTask, addTask });
  const rollover = useRolloverPrompt(tasks);

  if (loading) return null;

  if (morning.active) {
    const keptCount = tasks.filter((t) => t.last_triaged_on === new Date().toISOString().slice(0, 10)).length;
    return (
      <MorningFlow
        step={morning.step as 'leftover' | 'braindump' | 'merge'}
        currentLeftover={morning.currentLeftover}
        remaining={morning.remaining}
        tasks={tasks}
        keptCount={keptCount}
        onResolveLeftover={morning.resolveLeftover}
        onAddBrainDumpTask={morning.addBrainDumpTask}
        onFinishBrainDump={morning.finishBrainDump}
        onComplete={completeTask}
        onDrop={dropTask}
        onReorder={reorderTasks}
        onReorderCommit={commitReorder}
        onFinishMerge={morning.finishMerge}
        onClose={morning.close}
      />
    );
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="today-shell">
      <aside className="today-rail">
        <span className="wordmark">reflow</span>
        <div className="day-meta">
          <span className="date">{today.toLowerCase()}</span>
          <span className="count">{tasks.length} today</span>
        </div>
        {tasks.length > 0 && (
          <div className="rail-glance">
            <span className="rail-glance-label">up next</span>
            <span className="rail-glance-task">{tasks[0].title}</span>
          </div>
        )}
        <div className="rail-spacer" />
        <button className="rail-action" onClick={morning.start}>start my day</button>
        <button className="rail-signout" onClick={signOut}>sign out</button>
      </aside>

      <header className="today-header-mobile">
        <span className="wordmark">reflow</span>
        <div className="header-right"><span className="count-chip">{tasks.length} today</span></div>
      </header>

      <main className="today-main">
        <div aria-live="polite" className="visually-hidden">{error}</div>
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 18 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span>{error}</span>
              <button className="error-dismiss" onClick={dismissError}>dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>
        {rollover.hasLeftovers && !rollover.dismissed && (
          <div className="rollover-banner">
            <button className="rollover-prompt" onClick={morning.start}>
              still open from before — start my day?
            </button>
            <button className="rollover-dismiss" onClick={rollover.dismiss}>not now</button>
          </div>
        )}
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
      <AnimatePresence>
        {placedAt && (
          <motion.div
            className="placed-confirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="placed-confirmation-card"
              initial={{ scale: 0.9, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            >
              placed as #{placedAt.index + 1} today
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AddTaskFab onAdd={begin} disabled={active} />
    </div>
  );
}
