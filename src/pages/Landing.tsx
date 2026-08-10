import { Mark } from '../components/icons/Mark';
import { BorderGlow } from '../components/BorderGlow';

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="landing-shell">
      <BorderGlow borderRadius={28} glowRadius={44} edgeSensitivity={30}>
        <div className="landing-content">
          <Mark className="landing-mark" aria-hidden="true" />
          <h1 className="landing-wordmark">reflow</h1>
          <p className="landing-tagline">your day doesn't fall apart — it reflows.</p>
          <p className="landing-sub">
            one ranked list for today. new things land where they belong, not at the bottom.
          </p>
          <button className="landing-cta" onClick={onGetStarted}>
            sign in
          </button>
        </div>
      </BorderGlow>
    </div>
  );
}
