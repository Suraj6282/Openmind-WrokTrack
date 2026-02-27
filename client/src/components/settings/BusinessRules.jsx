import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings, 
  Clock, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { getBusinessRules, updateBusinessRules } from '../../services/settings';
import toast from 'react-hot-toast';

const businessRulesSchema = z.object({
  attendance: z.object({
    graceTime: z.number().min(0, 'Grace time must be positive'),
    lateThreshold: z.number().min(1, 'Late threshold must be at least 1'),
    halfDayThreshold: z.number().min(1, 'Half day threshold must be at least 1'),
    overtimeThreshold: z.number().min(1, 'Overtime threshold must be at least 1'),
    allowEarlyCheckout: z.boolean(),
    requireGeoFence: z.boolean(),
    breakDuration: z.number().min(0, 'Break duration must be positive'),
    maxBreaksPerDay: z.number().min(0, 'Max breaks must be positive')
  }),
  
  leave: z.object({
    paidLeavesPerYear: z.number().min(0, 'Paid leaves must be positive'),
    sickLeavesPerYear: z.number().min(0, 'Sick leaves must be positive'),
    unpaidLeavesAllowed: z.boolean(),
    carryForwardLeaves: z.boolean(),
    maxCarryForward: z.number().min(0, 'Max carry forward must be positive'),
    minDaysBeforeApply: z.number().min(0, 'Minimum days must be positive'),
    maxConsecutiveLeaves: z.number().min(1, 'Max consecutive leaves must be at least 1'),
    requireApproval: z.boolean(),
    approvalLevels: z.number().min(1, 'Approval levels must be at least 1')
  }),
  
  payroll: z.object({
    overtimeRate: z.number().min(1, 'Overtime rate must be at least 1'),
    latePenalty: z.number().min(0, 'Late penalty must be positive'),
    halfDayPenalty: z.number().min(0, 'Half day penalty must be positive'),
    earlyCheckoutPenalty: z.number().min(0, 'Early checkout penalty must be positive'),
    smartLateRule: z.boolean(),
    latesForHalfDay: z.number().min(1, 'Lates for half day must be at least 1'),
    includeWeekends: z.boolean(),
    includeHolidays: z.boolean(),
    salaryLockAfterApproval: z.boolean(),
    autoGenerateSalary: z.boolean(),
    salaryGenerationDay: z.number().min(1).max(31)
  }),
  
  performance: z.object({
    enablePerformanceScore: z.boolean(),
    attendanceWeight: z.number().min(0).max(100),
    punctualityWeight: z.number().min(0).max(100),
    overtimeWeight: z.number().min(0).max(100),
    leaveUtilizationWeight: z.number().min(0).max(100),
    minimumScoreForBonus: z.number().min(0).max(100),
    enableRanking: z.boolean(),
    showPublicRanking: z.boolean()
  })
});

const BusinessRules = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [rules, setRules] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(businessRulesSchema)
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await getBusinessRules();
      setRules(data);
      reset(data);
    } catch (error) {
      toast.error('Failed to load business rules');
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateBusinessRules(data);
      toast.success('Business rules updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update business rules');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'attendance', label: 'Attendance Rules', icon: Clock },
    { id: 'leave', label: 'Leave Rules', icon: Calendar },
    { id: 'payroll', label: 'Payroll Rules', icon: DollarSign },
    { id: 'performance', label: 'Performance Rules', icon: Settings }
  ];

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Business Rules Configuration</h2>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={loading}
          icon={Save}
        >
          Save All Changes
        </Button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Attendance Rules */}
        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <span>Attendance Configuration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Grace Time (minutes)
                  </label>
                  <input
                    type="number"
                    {...register('attendance.graceTime', { valueAsNumber: true })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Time allowed after shift start without being marked late
                  </p>
                  {errors.attendance?.graceTime && (
                    <p className="text-sm text-red-600 mt-1">{errors.attendance.graceTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Late Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    {...register('attendance.lateThreshold', { valueAsNumber: true })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minutes after grace time to be considered late
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Half Day Threshold (hours)
                  </label>
                  <input
                    type="number"
                    {...register('attendance.halfDayThreshold', { valueAsNumber: true })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum hours worked to avoid half day
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Overtime Threshold (hours)
                  </label>
                  <input
                    type="number"
                    {...register('attendance.overtimeThreshold', { valueAsNumber: true })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hours after which overtime starts counting
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    {...register('attendance.breakDuration', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Maximum Breaks Per Day
                  </label>
                  <input
                    type="number"
                    {...register('attendance.maxBreaksPerDay', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('attendance.allowEarlyCheckout')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Allow Early Checkout</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('attendance.requireGeoFence')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Require Geo-fence</span>
                  </label>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Smart Rules</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Smart late rule: 3 late arrivals = 1 half day deduction
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      This rule is automatically applied in payroll calculation
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Leave Rules */}
        {activeTab === 'leave' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>Leave Configuration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Paid Leaves Per Year
                  </label>
                  <input
                    type="number"
                    {...register('leave.paidLeavesPerYear', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sick Leaves Per Year
                  </label>
                  <input
                    type="number"
                    {...register('leave.sickLeavesPerYear', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Consecutive Leaves
                  </label>
                  <input
                    type="number"
                    {...register('leave.maxConsecutiveLeaves', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Minimum Days Before Apply
                  </label>
                  <input
                    type="number"
                    {...register('leave.minDaysBeforeApply', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Carry Forward Leaves
                  </label>
                  <input
                    type="number"
                    {...register('leave.maxCarryForward', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Approval Levels
                  </label>
                  <input
                    type="number"
                    {...register('leave.approvalLevels', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('leave.unpaidLeavesAllowed')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Allow Unpaid Leaves</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('leave.carryForwardLeaves')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Allow Carry Forward</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('leave.requireApproval')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Require Approval</span>
                  </label>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Payroll Rules */}
        {activeTab === 'payroll' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span>Payroll Configuration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Overtime Rate (x Basic)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('payroll.overtimeRate', { valueAsNumber: true })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Multiplier for overtime hours
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Late Penalty (₹)
                  </label>
                  <input
                    type="number"
                    {...register('payroll.latePenalty', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Half Day Penalty (₹)
                  </label>
                  <input
                    type="number"
                    {...register('payroll.halfDayPenalty', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Early Checkout Penalty (₹)
                  </label>
                  <input
                    type="number"
                    {...register('payroll.earlyCheckoutPenalty', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lates for Half Day
                  </label>
                  <input
                    type="number"
                    {...register('payroll.latesForHalfDay', { valueAsNumber: true })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of lates that count as one half day
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Salary Generation Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    {...register('payroll.salaryGenerationDay', { valueAsNumber: true })}
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('payroll.smartLateRule')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Enable Smart Late Rule</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('payroll.includeWeekends')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Include Weekends in Calculation</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('payroll.includeHolidays')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Include Holidays</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('payroll.salaryLockAfterApproval')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Lock Salary After Approval</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('payroll.autoGenerateSalary')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Auto Generate Salary</span>
                  </label>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Performance Rules */}
        {activeTab === 'performance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary-600" />
                <span>Performance Score Configuration</span>
              </h3>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('performance.enablePerformanceScore')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Enable Performance Score</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('performance.enableRanking')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Enable Employee Ranking</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('performance.showPublicRanking')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Show Public Ranking</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Attendance Weight (%)
                    </label>
                    <input
                      type="number"
                      {...register('performance.attendanceWeight', { valueAsNumber: true })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Punctuality Weight (%)
                    </label>
                    <input
                      type="number"
                      {...register('performance.punctualityWeight', { valueAsNumber: true })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Overtime Weight (%)
                    </label>
                    <input
                      type="number"
                      {...register('performance.overtimeWeight', { valueAsNumber: true })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Leave Utilization Weight (%)
                    </label>
                    <input
                      type="number"
                      {...register('performance.leaveUtilizationWeight', { valueAsNumber: true })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Minimum Score for Bonus
                    </label>
                    <input
                      type="number"
                      {...register('performance.minimumScoreForBonus', { valueAsNumber: true })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total weight must equal 100%. Current total:{' '}
                    {Object.values(watch('performance') || {}).reduce((sum, val) => 
                      typeof val === 'number' ? sum + val : sum, 0
                    )}%
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset(rules)}
          >
            Reset
          </Button>
          <Button
            type="submit"
            loading={loading}
            icon={Save}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessRules;