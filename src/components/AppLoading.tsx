import { Mark } from './icons/Mark';

/** Neutral loading screen while the initial auth check is in flight — shown before
 * we know whether to route to Today or Landing, so it must not imply either. */
export function AppLoading() {
  return (
    <div className="app-loading" aria-hidden="true">
      <Mark className="app-loading-mark" />
    </div>
  );
}
