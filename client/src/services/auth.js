import api from './api';

export const login = async (email, password, deviceId) => {
  const response = await api.post('/auth/login', { email, password, deviceId });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
};

export const updatePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/password', { currentPassword, newPassword });
  return response.data;
};

export const enable2FA = async () => {
  const response = await api.post('/auth/2fa/enable');
  return response.data;
};

export const disable2FA = async () => {
  const response = await api.post('/auth/2fa/disable');
  return response.data;
};

export const getLoginHistory = async (limit = 10) => {
  const response = await api.get('/auth/login-history', { params: { limit } });
  return response.data;
};