import { useState } from 'react';
import { createPortal } from 'react-dom';
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
import { TaskModal } from '../components/TaskModal';
import { SignOut } from '../components/icons/SignOut';
import type { Task } from '../lib/tasks';

export function Today() {
  const {
    tasks, loading, error, dismissError, addTask, completeTask, editTask, dropTask,
    reorderTasks, commitReorder, insertTaskAtIndex, keepLeftover,
  } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { signOut } = useAuth();
  const { pendingTitle, candidate, active, placedAt, progress, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  const morning = useMorningFlow({ tasks, keepLeftover, dropTask, addTask });
  const rollover = useRolloverPrompt(tasks);

  if (loading) return null;

  const keptCount = tasks.filter((t) => t.last_triaged_on === new Date().toISOString().slice(0, 10)).length;
  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
    {createPortal(
      <AnimatePresence>
        {morning.active && (
          <motion.div
            className="flow-mount"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.22, ease: 'easeIn' } }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )}

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
        <div className="header-right">
          <span className="count-chip">{tasks.length} today</span>
          <button className="header-signout" aria-label="sign out" onClick={signOut}>
            <SignOut width={20} height={20} />
          </button>
        </div>
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
          onEdit={setEditingTask}
          dimmed={active}
        />
      </main>

    </div>

    <AnimatePresence>
      {editingTask && (
        <TaskModal
          mode="edit"
          initial={{ title: editingTask.title }}
          onSubmit={(values) => {
            editTask(editingTask.id, values);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </AnimatePresence>

    {/* Fixed-position overlays are portaled to body so they escape the page
        transition's transform on .screen-frame — a transformed ancestor turns
        position:fixed into position:absolute, which would misplace them. */}
    {createPortal(
      <>
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
      </>,
      document.body,
    )}
    </>
  );
}
