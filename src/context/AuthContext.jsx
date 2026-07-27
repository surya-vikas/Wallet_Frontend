import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getAuthStatus, loginPin } from '../api/auth';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appName, setAppName] = useState("Thipirishetty's Vault");
  const [loading, setLoading] = useState(true);
  const sessionTimerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const expiresAt = token ? getTokenExpiryMs(token) : null;

      if (token && expiresAt && expiresAt > Date.now()) {
        setIsAuthenticated(true);
      } else if (token) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }

      const { data } = await getAuthStatus();
      setAppName(data.data.appName || "Thipirishetty's Vault");
    } catch {
      setAppName("Thipirishetty's Vault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (sessionTimerRef.current) {
      window.clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token) return undefined;

    const expiresAt = getTokenExpiryMs(token);
    if (!expiresAt) {
      logout();
      return undefined;
    }

    const delay = Math.max(expiresAt - Date.now(), 0);
    sessionTimerRef.current = window.setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, delay);

    return () => {
      if (sessionTimerRef.current) {
        window.clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [isAuthenticated, logout]);

  const login = async (pin) => {
    const { data } = await loginPin(pin);
    localStorage.setItem('token', data.data.token);
    setIsAuthenticated(true);
    return data.data;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, appName, loading, login, logout, checkStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
