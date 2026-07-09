import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthStatus, loginPin } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appName, setAppName] = useState("Thipirishetty's Vault");
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
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

  const login = async (pin) => {
    const { data } = await loginPin(pin);
    localStorage.setItem('token', data.data.token);
    setIsAuthenticated(true);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
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
