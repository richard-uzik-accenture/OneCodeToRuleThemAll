import type { Task } from '../lib/tasks';

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
}

export function TaskRow({ task, onComplete, onDrop }: TaskRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 14,
        background: 'var(--sand)',
        color: 'var(--graphite)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <button
        aria-label="mark settled"
        onClick={() => onComplete(task.id)}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `1.75px solid var(--stone)`,
          background: 'transparent',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      />
      <span style={{ flex: 1 }}>{task.title}</span>
      <button
        aria-label="let it go"
        onClick={() => onDrop(task.id)}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--silt)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        ×
      </button>
    </div>
  );
}
