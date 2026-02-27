import api from './api';

// Company Settings
export const getCompanySettings = async () => {
  const response = await api.get('/settings/company');
  return response.data;
};

export const updateCompanySettings = async (data) => {
  const response = await api.put('/settings/company', data);
  return response.data;
};

// Business Rules
export const getBusinessRules = async () => {
  const response = await api.get('/settings/business-rules');
  return response.data;
};

export const updateBusinessRules = async (data) => {
  const response = await api.put('/settings/business-rules', data);
  return response.data;
};

// Notification Settings
export const getNotificationSettings = async () => {
  const response = await api.get('/settings/notifications');
  return response.data;
};

export const updateNotificationSettings = async (data) => {
  const response = await api.put('/settings/notifications', data);
  return response.data;
};

// Departments
export const getDepartments = async () => {
  const response = await api.get('/settings/departments');
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await api.post('/settings/departments', data);
  return response.data;
};

export const updateDepartment = async (id, data) => {
  const response = await api.put(`/settings/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(`/settings/departments/${id}`);
  return response.data;
};

// Shifts
export const getShifts = async () => {
  const response = await api.get('/settings/shifts');
  return response.data;
};

export const createShift = async (data) => {
  const response = await api.post('/settings/shifts', data);
  return response.data;
};

export const updateShift = async (id, data) => {
  const response = await api.put(`/settings/shifts/${id}`, data);
  return response.data;
};

export const deleteShift = async (id) => {
  const response = await api.delete(`/settings/shifts/${id}`);
  return response.data;
};

// Holidays
export const getHolidays = async (year) => {
  const response = await api.get('/settings/holidays', { params: { year } });
  return response.data;
};

export const addHoliday = async (data) => {
  const response = await api.post('/settings/holidays', data);
  return response.data;
};

export const updateHoliday = async (id, data) => {
  const response = await api.put(`/settings/holidays/${id}`, data);
  return response.data;
};

export const deleteHoliday = async (id) => {
  const response = await api.delete(`/settings/holidays/${id}`);
  return response.data;
};

// Roles & Permissions
export const getRoles = async () => {
  const response = await api.get('/settings/roles');
  return response.data;
};

export const createRole = async (data) => {
  const response = await api.post('/settings/roles', data);
  return response.data;
};

export const updateRole = async (id, data) => {
  const response = await api.put(`/settings/roles/${id}`, data);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await api.delete(`/settings/roles/${id}`);
  return response.data;
};

// Audit Logs
export const getAuditLogs = async (filters) => {
  const response = await api.get('/settings/audit-logs', { params: filters });
  return response.data;
};

export const getAuditLogStats = async () => {
  const response = await api.get('/settings/audit-logs/stats');
  return response.data;
};

// Backup & Restore
export const createBackup = async () => {
  const response = await api.post('/settings/backup');
  return response.data;
};

export const restoreBackup = async (file) => {
  const formData = new FormData();
  formData.append('backup', file);
  
  const response = await api.post('/settings/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getBackups = async () => {
  const response = await api.get('/settings/backups');
  return response.data;
};

export const deleteBackup = async (id) => {
  const response = await api.delete(`/settings/backups/${id}`);
  return response.data;
};

// System Settings
export const getSystemSettings = async () => {
  const response = await api.get('/settings/system');
  return response.data;
};

export const updateSystemSettings = async (data) => {
  const response = await api.put('/settings/system', data);
  return response.data;
};

// Email Settings
export const getEmailSettings = async () => {
  const response = await api.get('/settings/email');
  return response.data;
};

export const updateEmailSettings = async (data) => {
  const response = await api.put('/settings/email', data);
  return response.data;
};

export const testEmailSettings = async () => {
  const response = await api.post('/settings/email/test');
  return response.data;
};
