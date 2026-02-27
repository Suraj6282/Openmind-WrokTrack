import api from './api';

export const getPayrollHistory = async () => {
  const response = await api.get('/payroll/history');
  return response.data;
};

export const generateSalarySlip = async (payrollId) => {
  const response = await api.post(`/payroll/${payrollId}/generate-slip`);
  return response.data;
};

export const lockPayroll = async (payrollId) => {
  const response = await api.post(`/payroll/${payrollId}/lock`);
  return response.data;
};

export const getSalarySlips = async () => {
  const response = await api.get('/payroll/slips');
  return response.data;
};

export const getSalarySlipById = async (slipId) => {
  const response = await api.get(`/payroll/slip/${slipId}`);
  return response.data;
};

export const downloadSalarySlip = async (slipId) => {
  const response = await api.get(`/payroll/slip/${slipId}/download`, {
    responseType: 'blob'
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `salary-slip-${slipId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

export const calculatePayroll = async (month, year) => {
  const response = await api.post('/payroll/calculate', { month, year });
  return response.data;
};