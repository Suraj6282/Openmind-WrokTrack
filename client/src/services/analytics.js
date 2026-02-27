import api from './api';

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

// Get attendance trends
export const getAttendanceTrends = async (period = 'month') => {
  const response = await api.get('/analytics/attendance-trends', { params: { period } });
  return response.data;
};

// Get payroll summary
export const getPayrollSummary = async (year, month) => {
  const response = await api.get('/analytics/payroll-summary', { params: { year, month } });
  return response.data;
};

// Get leave analytics
export const getLeaveAnalytics = async (year) => {
  const response = await api.get('/analytics/leave-analytics', { params: { year } });
  return response.data;
};

// Get department performance
export const getDepartmentPerformance = async () => {
  const response = await api.get('/analytics/department-performance');
  return response.data;
};

// Get employee ranking
export const getEmployeeRanking = async (criteria = 'attendance') => {
  const response = await api.get('/analytics/employee-ranking', { params: { criteria } });
  return response.data;
};

// Get my stats (for employee)
export const getMyStats = async () => {
  const response = await api.get('/analytics/my-stats');
  return response.data;
};

// Get my trends
export const getMyTrends = async (period = 'month') => {
  const response = await api.get('/analytics/my-trends', { params: { period } });
  return response.data;
};

// Get recent attendance
export const getRecentAttendance = async (limit = 10) => {
  const response = await api.get('/analytics/recent-attendance', { params: { limit } });
  return response.data;
};

// Get recent activity
export const getRecentActivity = async (limit = 10) => {
  const response = await api.get('/analytics/recent-activity', { params: { limit } });
  return response.data;
};

// Get audit summary
export const getAuditSummary = async (days = 7) => {
  const response = await api.get('/analytics/audit-summary', { params: { days } });
  return response.data;
};

// Export analytics data
export const exportAnalytics = async (type, format = 'csv', dateRange) => {
  const response = await api.get('/analytics/export', {
    params: { type, format, ...dateRange },
    responseType: 'blob'
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `analytics-${type}-${new Date().toISOString()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};