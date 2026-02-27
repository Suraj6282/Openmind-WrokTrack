import { z } from 'zod';

// Employee validation schemas
export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().optional(),
  position: z.string().optional(),
  joinDate: z.string().optional(),
  basicSalary: z.number().min(0, 'Salary must be positive'),
  isActive: z.boolean().default(true)
});

// Leave validation schemas
export const leaveSchema = z.object({
  type: z.enum(['paid', 'unpaid', 'sick']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  halfDay: z.boolean().default(false)
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Attendance validation schemas
export const attendanceSchema = z.object({
  checkIn: z.object({
    time: z.string().datetime(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    deviceId: z.string()
  }),
  checkOut: z.object({
    time: z.string().datetime(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    deviceId: z.string()
  }).optional()
});

// Payroll validation schemas
export const payrollSettingsSchema = z.object({
  overtimeRate: z.number().min(1, 'Overtime rate must be at least 1'),
  latePenalty: z.number().min(0, 'Late penalty must be positive'),
  halfDayRule: z.string(),
  salaryLockAfterApproval: z.boolean().default(true)
});

// Company settings validation
export const companySettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyEmail: z.string().email('Invalid email'),
  companyPhone: z.string().min(10, 'Invalid phone number'),
  companyAddress: z.string().min(1, 'Address is required'),
  geoFence: z.object({
    enabled: z.boolean(),
    radius: z.number().min(10, 'Radius must be at least 10 meters'),
    companyLocation: z.object({
      lat: z.number(),
      lng: z.number()
    })
  })
});

// Signature validation
export const signatureSchema = z.object({
  employeeId: z.string(),
  payrollId: z.string(),
  signature: z.string().min(1, 'Signature is required'),
  deviceId: z.string(),
  ipAddress: z.string()
});