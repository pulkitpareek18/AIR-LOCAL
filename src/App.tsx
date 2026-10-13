import { useEffect } from 'react';
import { AppContent } from './AppContent';

/** React composition root for AirLocal. The imperative transfer engine keeps its stable IDs. */
export function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return <AppContent />;
}
