import api from './api';

export const applyLeave = async (data) => {
  const response = await api.post('/leave/apply', data);
  return response.data;
};

export const getLeaveBalance = async () => {
  const response = await api.get('/leave/balance');
  return response.data;
};

export const getLeaveHistory = async () => {
  const response = await api.get('/leave/history');
  return response.data;
};

export const approveLeave = async (id) => {
  const response = await api.put(`/leave/${id}/approve`);
  return response.data;
};

export const rejectLeave = async (id, reason) => {
  const response = await api.put(`/leave/${id}/reject`, { reason });
  return response.data;
};

export const getPendingLeaves = async () => {
  const response = await api.get('/leave/pending');
  return response.data;
};