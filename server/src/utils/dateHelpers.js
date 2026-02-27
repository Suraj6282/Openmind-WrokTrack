const { 
  format, 
  differenceInDays, 
  differenceInHours,
  differenceInMinutes,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isWithinInterval,
  parseISO
} = require('date-fns');

// Format date
exports.formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return null;
  return format(new Date(date), formatStr);
};

// Format time
exports.formatTime = (date, formatStr = 'HH:mm:ss') => {
  if (!date) return null;
  return format(new Date(date), formatStr);
};

// Calculate days between dates
exports.daysBetween = (startDate, endDate) => {
  return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
};

// Calculate hours between dates
exports.hoursBetween = (startDate, endDate) => {
  return differenceInHours(new Date(endDate), new Date(startDate));
};

// Calculate minutes between dates
exports.minutesBetween = (startDate, endDate) => {
  return differenceInMinutes(new Date(endDate), new Date(startDate));
};

// Get month range
exports.getMonthRange = (year, month) => {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
};

// Get working days in month (excluding weekends)
exports.getWorkingDaysInMonth = (year, month, includeWeekends = false) => {
  const { start, end } = exports.getMonthRange(year, month);
  const days = eachDayOfInterval({ start, end });
  
  if (includeWeekends) {
    return days.length;
  }
  
  return days.filter(day => !isWeekend(day)).length;
};

// Check if date is within range
exports.isWithinRange = (date, startDate, endDate) => {
  return isWithinInterval(new Date(date), {
    start: new Date(startDate),
    end: new Date(endDate)
  });
};

// Parse date safely
exports.parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return parseISO(dateStr);
  } catch {
    return null;
  }
};

// Get relative time string
exports.getRelativeTime = (date) => {
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, new Date(date));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return format(new Date(date), 'MMM dd, yyyy');
};

// Get fiscal year
exports.getFiscalYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Fiscal year starts from April (month 3)
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Get financial year range
exports.getFiscalYearRange = (fiscalYear) => {
  const [startYear, endYear] = fiscalYear.split('-').map(Number);
  return {
    start: new Date(startYear, 3, 1), // April 1st
    end: new Date(endYear, 2, 31)     // March 31st
  };
};

// Add business days
exports.addBusinessDays = (date, days) => {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      addedDays++;
    }
  }
  
  return result;
};