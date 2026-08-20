const PLACEHOLDER_ROWS = 4;

export function TaskListSkeleton() {
  return (
    <div className="task-list" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
        <div key={i} className="task-row-skeleton" />
      ))}
    </div>
  );
}
