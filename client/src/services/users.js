import api from './api';

// Get all users
export const getUsers = async (filters = {}) => {
  const response = await api.get('/users', { params: filters });
  return response.data;
};

// Get employees
export const getEmployees = async (filters = {}) => {
  const response = await api.get('/users/employees', { params: filters });
  return response.data;
};

// Get user by ID
export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Create user
export const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

// Update user
export const updateUser = async (id, data) => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Deactivate user
export const deactivateUser = async (id) => {
  const response = await api.post(`/users/${id}/deactivate`);
  return response.data;
};

// Activate user
export const activateUser = async (id) => {
  const response = await api.post(`/users/${id}/activate`);
  return response.data;
};

// Get users by department
export const getUsersByDepartment = async (departmentId) => {
  const response = await api.get(`/users/department/${departmentId}`);
  return response.data;
};

// Get profile
export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

// Update profile
export const updateProfile = async (data) => {
  const response = await api.patch('/users/profile', data);
  return response.data;
};

// Upload avatar
export const uploadAvatar = async (formData) => {
  const response = await api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Change user role
export const changeUserRole = async (id, role) => {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data;
};

// Assign department
export const assignDepartment = async (id, departmentId) => {
  const response = await api.patch(`/users/${id}/department`, { departmentId });
  return response.data;
};

// Assign shift
export const assignShift = async (id, shiftId) => {
  const response = await api.patch(`/users/${id}/shift`, { shiftId });
  return response.data;
};

// Get user statistics
export const getUserStats = async (id) => {
  const response = await api.get(`/users/${id}/stats`);
  return response.data;
};

// Get user attendance summary
export const getUserAttendanceSummary = async (id, year, month) => {
  const response = await api.get(`/users/${id}/attendance-summary`, {
    params: { year, month }
  });
  return response.data;
};

// Get user leave balance
export const getUserLeaveBalance = async (id) => {
  const response = await api.get(`/users/${id}/leave-balance`);
  return response.data;
};

// Bulk import users
export const bulkImportUsers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/users/bulk-import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Export users
export const exportUsers = async (format = 'csv') => {
  const response = await api.get('/users/export', {
    params: { format },
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `users-export-${new Date().toISOString()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

// Search users
export const searchUsers = async (query) => {
  const response = await api.get('/users/search', { params: { q: query } });
  return response.data;
};

// Aliases for employee-specific operations
export const createEmployee = createUser;
export const updateEmployee = updateUser;
export const deleteEmployee = deleteUser;