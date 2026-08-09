interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: 24 }}>
      <div style={{ maxWidth: 360 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--petrol)' }}>
          reflow
        </h1>
        <p style={{ color: 'var(--graphite)', fontFamily: 'var(--font-body)' }}>
          your day doesn't fall apart — it reflows.
        </p>
        <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
          one ranked list for today. new things land where they belong, not at the bottom.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            marginTop: 16,
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--petrol)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          sign in
        </button>
      </div>
    </div>
  );
}
