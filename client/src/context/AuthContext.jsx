import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAuthTokens,
  setOnAuthFailed
} from '../api/client.js';
import * as authApi from '../api/auth.js';
import * as accountsApi from '../api/accounts.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logoutUser();
    } catch (e) {
      // ignore
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await accountsApi.getMe();
      if (data && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      // If fetching me fails with 401, client interceptor will attempt refresh
      throw err;
    }
  }, []);

  useEffect(() => {
    setOnAuthFailed(() => {
      setUser(null);
    });

    const initAuth = async () => {
      const storedRefreshToken = getRefreshToken();
      if (storedRefreshToken) {
        try {
          // Attempt to fetch current user profile (which will trigger token refresh if needed)
          await refreshUser();
        } catch (e) {
          clearAuthTokens();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = useCallback(async (phone, pin) => {
    const data = await authApi.loginUser(phone, pin);
    if (data.user) {
      setUser(data.user);
    } else {
      await refreshUser();
    }
    return data;
  }, [refreshUser]);

  const setAuthData = useCallback((userData, accessToken, refreshToken) => {
    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    if (userData) setUser(userData);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser,
    updateUser,
    setAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
