import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateProfile: () => {}
});

const getStoredUser = () => {
  const raw = localStorage.getItem('apnabook_auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('apnabook_auth');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = (nextUser) => {
    localStorage.setItem('apnabook_auth', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('apnabook_auth');
    setUser(null);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updates };
      localStorage.setItem('apnabook_auth', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, updateProfile }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
