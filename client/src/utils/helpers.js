import { format, differenceInDays, parseISO } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  return format(parseISO(date), formatStr);
};

export const formatTime = (date, formatStr = 'hh:mm a') => {
  if (!date) return '';
  return format(parseISO(date), formatStr);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateDaysBetween = (startDate, endDate) => {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
};

export const getDeviceId = async () => {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;
  
  const deviceId = btoa(
    JSON.stringify({
      userAgent: navigatorInfo.userAgent,
      language: navigatorInfo.language,
      platform: navigatorInfo.platform,
      screenWidth: screenInfo.width,
      screenHeight: screenInfo.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  );
  
  return deviceId;
};

export const getIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return '0.0.0.0';
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};