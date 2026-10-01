import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredToken = (): string | null => {
  try {
    const raw = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');
    if (!raw || raw === 'null' || raw === 'undefined') return null;
    return raw;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('successstory_user') || localStorage.getItem('storymap_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [loading, setLoading] = useState<boolean>(() => Boolean(getStoredToken() && !(localStorage.getItem('successstory_user') || localStorage.getItem('storymap_user'))));

  const fetchCurrentUser = async (authToken: string) => {
    let success = false;
    let authErrorStatus = false;

    for (const host of ['', 'http://localhost:5000', 'http://127.0.0.1:5000']) {
      try {
        const res = await fetch(`${host}/api/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data?.user) {
              setUser(prevUser => {
                if (prevUser && JSON.stringify(prevUser) === JSON.stringify(data.user)) {
                  return prevUser;
                }
                return data.user;
              });
              localStorage.setItem('successstory_user', JSON.stringify(data.user));
              success = true;
              break;
            }
          }
        } else if (res.status === 401 || res.status === 403) {
          authErrorStatus = true;
          break;
        }
      } catch (err) {
        // network error on this host, try next
      }
    }

    if (!success) {
      if (authErrorStatus) {
        localStorage.removeItem('successstory_token');
        localStorage.removeItem('successstory_user');
        localStorage.removeItem('storymap_token');
        localStorage.removeItem('storymap_user');
        setToken(null);
        setUser(null);
      } else {
        // Server unreachable: fallback to cached user if available
        const cachedUserStr = localStorage.getItem('successstory_user') || localStorage.getItem('storymap_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            setUser(prevUser => (prevUser && JSON.stringify(prevUser) === JSON.stringify(cachedUser)) ? prevUser : cachedUser);
          } catch (e) {
            setUser(null);
          }
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('successstory_token');
      localStorage.removeItem('successstory_user');
      localStorage.removeItem('storymap_token');
      localStorage.removeItem('storymap_user');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = React.useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('successstory_token', newToken);
    localStorage.setItem('successstory_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem('successstory_token');
    localStorage.removeItem('successstory_user');
    localStorage.removeItem('storymap_token');
    localStorage.removeItem('storymap_user');
    setToken(null);
    setUser(null);
    for (const host of ['', 'http://localhost:5000', 'http://127.0.0.1:5000']) {
      fetch(`${host}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    const stored = getStoredToken();
    if (stored) {
      await fetchCurrentUser(stored);
    }
  }, []);

  const updateUser = React.useCallback((updatedUser: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedUser };
      localStorage.setItem('successstory_user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const isAdmin = Boolean(user && user.role === 'ADMIN');
  const isAuthenticated = Boolean(user);

  const contextValue = React.useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    logout,
    refreshUser,
    updateUser
  }), [user, token, isAuthenticated, isAdmin, loading, login, logout, refreshUser, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
