import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  MapPin,
  Award,
  Users
} from 'lucide-react';
import Button from '../common/Button';
import { createEmployee, updateEmployee } from '../../services/users';
import { getDepartments, getShifts } from '../../services/settings';
import toast from 'react-hot-toast';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().optional(),
  shift: z.string().optional(),
  position: z.string().optional(),
  joinDate: z.string().optional(),
  basicSalary: z.number().min(0, 'Salary must be positive'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  isActive: z.boolean().default(true)
});

const EmployeeModal = ({ employee, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      isActive: true,
      basicSalary: 0
    }
  });

  useEffect(() => {
    fetchData();
    if (employee) {
      // Populate form with employee data
      Object.keys(employee).forEach(key => {
        setValue(key, employee[key]);
      });
    }
  }, [employee, setValue]);

  const fetchData = async () => {
    try {
      const [depts, shiftsData] = await Promise.all([
        getDepartments(),
        getShifts()
      ]);
      setDepartments(depts);
      setShifts(shiftsData);
    } catch (error) {
      toast.error('Failed to load departments and shifts');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (employee) {
        await updateEmployee(employee._id, data);
        toast.success('Employee updated successfully');
      } else {
        await createEmployee(data);
        toast.success('Employee created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'address', label: 'Address', icon: MapPin }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-3 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    className="input-field"
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="input-field"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    className="input-field"
                    placeholder="+91 9876543210"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('employeeId')}
                    className="input-field"
                    placeholder="EMP001"
                  />
                  {errors.employeeId && (
                    <p className="text-sm text-red-600 mt-1">{errors.employeeId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    {...register('dob')}
                    type="date"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gender
                  </label>
                  <select {...register('gender')} className="input-field">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    {...register('emergencyContact')}
                    className="input-field"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Emergency Phone
                  </label>
                  <input
                    {...register('emergencyPhone')}
                    className="input-field"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Employment Tab */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department
                  </label>
                  <select {...register('department')} className="input-field">
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Shift
                  </label>
                  <select {...register('shift')} className="input-field">
                    <option value="">Select Shift</option>
                    {shifts.map(shift => (
                      <option key={shift._id} value={shift._id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Position
                  </label>
                  <input
                    {...register('position')}
                    className="input-field"
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Join Date
                  </label>
                  <input
                    {...register('joinDate')}
                    type="date"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Basic Salary (₹)
                  </label>
                  <input
                    {...register('basicSalary', { valueAsNumber: true })}
                    type="number"
                    className="input-field"
                    placeholder="50000"
                  />
                  {errors.basicSalary && (
                    <p className="text-sm text-red-600 mt-1">{errors.basicSalary.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Employment Type
                  </label>
                  <select {...register('employmentType')} className="input-field">
                    <option value="fulltime">Full Time</option>
                    <option value="parttime">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    id="isActive"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm">
                    Active Employee
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Name
                  </label>
                  <input
                    {...register('bankName')}
                    className="input-field"
                    placeholder="State Bank of India"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Account Number
                  </label>
                  <input
                    {...register('bankAccount')}
                    className="input-field"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    IFSC Code
                  </label>
                  <input
                    {...register('ifscCode')}
                    className="input-field"
                    placeholder="SBIN0001234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    PAN Number
                  </label>
                  <input
                    {...register('panNumber')}
                    className="input-field"
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aadhar Number
                  </label>
                  <input
                    {...register('aadharNumber')}
                    className="input-field"
                    placeholder="1234 5678 9012"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    PF Number
                  </label>
                  <input
                    {...register('pfNumber')}
                    className="input-field"
                    placeholder="PF/123456/789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    UAN Number
                  </label>
                  <input
                    {...register('uanNumber')}
                    className="input-field"
                    placeholder="123456789012"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address
                  </label>
                  <textarea
                    {...register('address')}
                    rows="3"
                    className="input-field"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      City
                    </label>
                    <input
                      {...register('city')}
                      className="input-field"
                      placeholder="Mumbai"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State
                    </label>
                    <input
                      {...register('state')}
                      className="input-field"
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Country
                    </label>
                    <input
                      {...register('country')}
                      className="input-field"
                      placeholder="India"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Zip Code
                    </label>
                    <input
                      {...register('zipCode')}
                      className="input-field"
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {employee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EmployeeModal;