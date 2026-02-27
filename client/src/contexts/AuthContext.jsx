import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getDeviceId } from '../utils/helpers';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && token) {
      fetchUser();
      isInitialMount.current = false;
    } else if (!token) {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      // Response format: { status, data: { user } }
      if (res.status === 'success' && res.data?.user) {
        setUser(res.data.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      // Only logout if it's an auth error, not network errors
      if (error.status === 'error' || error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const deviceId = await getDeviceId();
      const res = await api.post('/auth/login', {
        email,
        password,
        deviceId
      });

      // Response format: { status, token, data: { user } }
      console.log('Login response:', res);
      
      const token = res.token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error('No token or user data received from server');
      }

      // Set token first
      localStorage.setItem('token', token);
      setToken(token);
      // Then set user (this will make isAuthenticated true)
      setUser(user);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || error.error || 'Login failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};