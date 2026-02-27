import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, FileText, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { applyLeave } from '../../services/leave';
import toast from 'react-hot-toast';

const leaveSchema = z.object({
  type: z.enum(['paid', 'unpaid', 'sick']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Please provide a detailed reason'),
  halfDay: z.boolean().optional()
});

const LeaveApplication = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(leaveSchema)
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await applyLeave(data);
      toast.success('Leave application submitted successfully');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Apply for Leave</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Leave Type</label>
          <select
            {...register('type')}
            className="input-field"
          >
            <option value="paid">Paid Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="sick">Sick Leave</option>
          </select>
          {errors.type && (
            <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              {...register('startDate')}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.startDate && (
              <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              {...register('endDate')}
              className="input-field"
              min={startDate}
            />
            {errors.endDate && (
              <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {startDate && endDate && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Total days: {calculateDays()} day(s)
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea
            {...register('reason')}
            rows="4"
            className="input-field"
            placeholder="Please provide detailed reason for leave..."
          ></textarea>
          {errors.reason && (
            <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('halfDay')}
            id="halfDay"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="halfDay" className="text-sm">
            Half day leave
          </label>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Submit Application
        </Button>
      </form>
    </div>
  );
};

export default LeaveApplication;