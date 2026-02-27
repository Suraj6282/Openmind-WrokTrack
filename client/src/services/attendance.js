import api from './api';

export const checkIn = async (data) => {
  const response = await api.post('/attendance/check-in', data);
  return response.data;
};

export const checkOut = async (data) => {
  const response = await api.post('/attendance/check-out', data);
  return response.data;
};

export const startBreak = async (data) => {
  const response = await api.post('/attendance/break/start', data);
  return response.data;
};

export const endBreak = async (data) => {
  const response = await api.post('/attendance/break/end', data);
  return response.data;
};

export const getTodayAttendance = async () => {
  const response = await api.get('/attendance/today');
  return response.data;
};

export const getAttendanceHistory = async (params) => {
  const response = await api.get('/attendance/history', { params });
  return response.data;
};

export const getMonthlyAttendance = async (month, year) => {
  const response = await api.get(`/attendance/monthly/${year}/${month}`);
  return response.data;
};

export const verifyAttendance = async (id) => {
  const response = await api.post(`/attendance/${id}/verify`);
  return response.data;
};