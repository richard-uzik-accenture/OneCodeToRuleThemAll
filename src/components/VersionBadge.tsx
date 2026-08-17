const version = import.meta.env.VITE_APP_VERSION;
const commit = import.meta.env.VITE_APP_COMMIT;

export function VersionBadge() {
  if (!version) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--safe-bottom) + 4px)',
        right: 'calc(var(--safe-right) + 6px)',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--dusk)',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      v{version}{commit ? ` · ${commit}` : ''}
    </div>
  );
}
