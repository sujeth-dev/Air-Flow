import { useAppStore, selectScreen } from './store';
import Landing from './screens/Landing';
import Studio from './screens/Studio';
import Gallery from './screens/Gallery';
import Settings from './screens/Settings';

/* ============================================================
 * App — top-level router.
 *
 * The Zustand store owns the current screen. Studio mounts the
 * camera + canvas, so it only mounts when the user actively
 * navigates there (no permission prompt on the landing page).
 * ========================================================== */

export default function App() {
  const screen = useAppStore(selectScreen);

  switch (screen) {
    case 'studio':
      return <Studio />;
    case 'gallery':
      return <Gallery />;
    case 'settings':
      return <Settings />;
    case 'landing':
    default:
      return <Landing />;
  }
}
