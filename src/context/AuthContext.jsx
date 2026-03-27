import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getToken, setToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch current user from /me endpoint if token exists
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
          setError(null);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          setToken(null);
          setUser(null);
          setError('Failed to load user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
  };

  /**
   * Computed property to check if user is admin
   */
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
