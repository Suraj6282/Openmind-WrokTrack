import api from './api';

export const saveSignature = async (data) => {
  const response = await api.post('/signature/save', data);
  return response.data;
};

export const getSignature = async (id) => {
  const response = await api.get(`/signature/${id}`);
  return response.data;
};

export const verifySignature = async (id) => {
  const response = await api.post(`/signature/${id}/verify`);
  return response.data;
};

export const getUserSignatures = async () => {
  const response = await api.get('/signature/user');
  return response.data;
};