import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './globals.css';

function DevCacheReset() {
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    let cancelled = false;

    const clearCaches = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
      } catch {
        // If cache cleanup fails, keep the app running and let the user refresh once.
      }
    };

    if (!cancelled) {
      clearCaches();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <DevCacheReset />
      <App />
    </AuthProvider>
  </BrowserRouter>
);
