import api from './api';

// Get attendance report
export const getAttendanceReport = async (dateRange) => {
  const response = await api.get('/reports/attendance', { params: dateRange });
  return response.data;
};

// Get payroll report
export const getPayrollReport = async (dateRange) => {
  const response = await api.get('/reports/payroll', { params: dateRange });
  return response.data;
};

// Get leave report
export const getLeaveReport = async (dateRange) => {
  const response = await api.get('/reports/leave', { params: dateRange });
  return response.data;
};

// Get summary report
export const getSummaryReport = async (dateRange) => {
  const response = await api.get('/reports/summary', { params: dateRange });
  return response.data;
};

// Export attendance report
export const exportAttendanceReport = async (dateRange, format = 'pdf') => {
  const response = await api.get('/reports/export/attendance', {
    params: { ...dateRange, format },
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `attendance-report-${new Date().toISOString()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

// Export payroll report
export const exportPayrollReport = async (dateRange, format = 'pdf') => {
  const response = await api.get('/reports/export/payroll', {
    params: { ...dateRange, format },
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `payroll-report-${new Date().toISOString()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

// Export leave report
export const exportLeaveReport = async (dateRange, format = 'pdf') => {
  const response = await api.get('/reports/export/leave', {
    params: { ...dateRange, format },
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `leave-report-${new Date().toISOString()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

// Generate custom report
export const generateCustomReport = async (config) => {
  const response = await api.post('/reports/custom', config);
  return response.data;
};

// Schedule report
export const scheduleReport = async (schedule) => {
  const response = await api.post('/reports/schedule', schedule);
  return response.data;
};

// Get scheduled reports
export const getScheduledReports = async () => {
  const response = await api.get('/reports/scheduled');
  return response.data;
};

// Delete scheduled report
export const deleteScheduledReport = async (id) => {
  const response = await api.delete(`/reports/scheduled/${id}`);
  return response.data;
};