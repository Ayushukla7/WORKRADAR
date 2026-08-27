import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('workradar_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('workradar_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token and verify user session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('workradar_token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('workradar_user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.error('[AuthContext] Session verification failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('workradar_token', userToken);
        localStorage.setItem('workradar_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const signup = async (formData) => {
    try {
      const response = await api.post('/auth/register', formData);
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('workradar_token', userToken);
        localStorage.setItem('workradar_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('workradar_token');
    localStorage.removeItem('workradar_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isManager: user?.role === 'MANAGER',
        isEmployee: user?.role === 'EMPLOYEE',
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
