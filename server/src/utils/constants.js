module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    EMPLOYEE: 'employee'
  },

  // Attendance status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HALF_DAY: 'half-day',
    HOLIDAY: 'holiday',
    LEAVE: 'leave'
  },

  // Leave types
  LEAVE_TYPES: {
    PAID: 'paid',
    UNPAID: 'unpaid',
    SICK: 'sick'
  },

  // Leave status
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // Payroll status
  PAYROLL_STATUS: {
    DRAFT: 'draft',
    CALCULATED: 'calculated',
    APPROVED: 'approved',
    LOCKED: 'locked',
    PAID: 'paid'
  },

  // Signature types
  SIGNATURE_TYPES: {
    EMPLOYEE: 'employee',
    ADMIN: 'admin'
  },

  // Notification types
  NOTIFICATION_TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    ATTENDANCE: 'attendance',
    LEAVE: 'leave',
    PAYROLL: 'payroll',
    SIGNATURE: 'signature',
    SYSTEM: 'system'
  },

  // Notification priorities
  NOTIFICATION_PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Audit actions
  AUDIT_ACTIONS: {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    CHECK_IN: 'CHECK_IN',
    CHECK_OUT: 'CHECK_OUT',
    BREAK_START: 'BREAK_START',
    BREAK_END: 'BREAK_END',
    APPLY_LEAVE: 'APPLY_LEAVE',
    APPROVE_LEAVE: 'APPROVE_LEAVE',
    REJECT_LEAVE: 'REJECT_LEAVE',
    CANCEL_LEAVE: 'CANCEL_LEAVE',
    CALCULATE_PAYROLL: 'CALCULATE_PAYROLL',
    GENERATE_SALARY_SLIP: 'GENERATE_SALARY_SLIP',
    LOCK_PAYROLL: 'LOCK_PAYROLL',
    ADD_SIGNATURE: 'ADD_SIGNATURE',
    VERIFY_SIGNATURE: 'VERIFY_SIGNATURE',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
    CREATE_EMPLOYEE: 'CREATE_EMPLOYEE',
    UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
    DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
    DEVICE_REGISTERED: 'DEVICE_REGISTERED',
    UNAUTHORIZED_DEVICE_ATTEMPT: 'UNAUTHORIZED_DEVICE_ATTEMPT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    PASSWORD_RESET: 'PASSWORD_RESET',
    PROFILE_UPDATE: 'PROFILE_UPDATE'
  },

  // Geo-fence defaults
  GEO_FENCE: {
    DEFAULT_RADIUS: 20, // meters
    MIN_RADIUS: 10,
    MAX_RADIUS: 1000
  },

  // Attendance rules defaults
  ATTENDANCE_RULES: {
    GRACE_TIME: 15, // minutes
    HALF_DAY_THRESHOLD: 4, // hours
    OVERTIME_THRESHOLD: 8, // hours
    MAX_BREAKS_PER_DAY: 2,
    MIN_BREAK_DURATION: 30, // minutes
    MAX_BREAK_DURATION: 60 // minutes
  },

  // Leave rules defaults
  LEAVE_RULES: {
    PAID_LEAVES_PER_YEAR: 12,
    SICK_LEAVES_PER_YEAR: 6,
    MAX_CONSECUTIVE_LEAVES: 15,
    MIN_DAYS_BEFORE_APPLY: 2,
    CARRY_FORWARD_LIMIT: 5
  },

  // Payroll rules defaults
  PAYROLL_RULES: {
    OVERTIME_RATE: 1.5,
    LATE_PENALTY: 100,
    LATES_FOR_HALF_DAY: 3,
    PF_PERCENTAGE: 12
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Date formats
  DATE_FORMATS: {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
    ISO: 'YYYY-MM-DD',
    ISO_TIME: 'YYYY-MM-DD HH:mm:ss',
    MONTH_YEAR: 'MMM YYYY',
    TIME: 'HH:mm'
  },

  // File upload limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
    MAX_FILES_PER_UPLOAD: 5
  },

  // Cache durations (in seconds)
  CACHE_DURATION: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400 // 24 hours
  },

  // Rate limits
  RATE_LIMITS: {
    API: { window: 15 * 60 * 1000, max: 100 }, // 15 minutes, 100 requests
    AUTH: { window: 60 * 60 * 1000, max: 5 }, // 1 hour, 5 attempts
    ATTENDANCE: { window: 60 * 1000, max: 10 } // 1 minute, 10 requests
  },

  // Business hours
  BUSINESS_HOURS: {
    START: '09:00',
    END: '18:00',
    WORKING_DAYS: [1, 2, 3, 4, 5] // Monday to Friday
  },

  // API endpoints
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    USERS: '/api/users',
    ATTENDANCE: '/api/attendance',
    LEAVE: '/api/leave',
    PAYROLL: '/api/payroll',
    SIGNATURE: '/api/signature',
    REPORTS: '/api/reports',
    SETTINGS: '/api/settings',
    ANALYTICS: '/api/analytics'
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Error messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'You are not authorized to perform this action',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_LOCKED: 'Account is locked. Please try again later',
    ACCOUNT_INACTIVE: 'Account is inactive. Please contact admin',
    TOKEN_EXPIRED: 'Your session has expired. Please login again',
    INVALID_TOKEN: 'Invalid token. Please login again',
    DEVICE_UNAUTHORIZED: 'Unauthorized device. Please use your registered device',
    VALIDATION_FAILED: 'Validation failed',
    RESOURCE_NOT_FOUND: 'Resource not found',
    DUPLICATE_ENTRY: 'Duplicate entry found',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later'
  }
};