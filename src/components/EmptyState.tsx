interface EmptyStateProps {
  headline: string;
  supportingText?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ headline, supportingText, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state-headline">{headline}</p>
      {supportingText && <p className="empty-state-support">{supportingText}</p>}
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
