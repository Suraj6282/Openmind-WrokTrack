import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, MapPin, Clock, DollarSign } from 'lucide-react';
import Button from '../common/Button';
import { getCompanySettings, updateCompanySettings } from '../../services/settings';
import toast from 'react-hot-toast';

const settingsSchema = z.object({
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
  }),
  attendanceRules: z.object({
    graceTime: z.number().min(0),
    earlyCheckout: z.boolean(),
    halfDayThreshold: z.number().min(1),
    overtimeThreshold: z.number().min(1)
  }),
  payrollRules: z.object({
    overtimeRate: z.number().min(1),
    latePenalty: z.number().min(0)
  })
});

const CompanySettings = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(settingsSchema)
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settings = await getCompanySettings();
      reset(settings);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateCompanySettings(data);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Company Settings</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Basic Information</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                {...register('companyName')}
                className="input-field"
              />
              {errors.companyName && (
                <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Email</label>
              <input
                {...register('companyEmail')}
                type="email"
                className="input-field"
              />
              {errors.companyEmail && (
                <p className="text-sm text-red-600 mt-1">{errors.companyEmail.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Phone</label>
              <input
                {...register('companyPhone')}
                className="input-field"
              />
              {errors.companyPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.companyPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Address</label>
              <input
                {...register('companyAddress')}
                className="input-field"
              />
              {errors.companyAddress && (
                <p className="text-sm text-red-600 mt-1">{errors.companyAddress.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Geo-fence Settings</span>
          </h4>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                {...register('geoFence.enabled')}
                type="checkbox"
                id="geoFenceEnabled"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="geoFenceEnabled">Enable Geo-fence</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Radius (meters)</label>
                <input
                  {...register('geoFence.radius', { valueAsNumber: true })}
                  type="number"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <input
                  {...register('geoFence.companyLocation.lat', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <input
                  {...register('geoFence.companyLocation.lng', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Attendance Rules</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Grace Time (minutes)</label>
              <input
                {...register('attendanceRules.graceTime', { valueAsNumber: true })}
                type="number"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Half Day Threshold (hours)</label>
              <input
                {...register('attendanceRules.halfDayThreshold', { valueAsNumber: true })}
                type="number"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Overtime Threshold (hours)</label>
              <input
                {...register('attendanceRules.overtimeThreshold', { valueAsNumber: true })}
                type="number"
                className="input-field"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                {...register('attendanceRules.earlyCheckout')}
                type="checkbox"
                id="earlyCheckout"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="earlyCheckout">Allow Early Checkout</label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Payroll Rules</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Overtime Rate (x basic)</label>
              <input
                {...register('payrollRules.overtimeRate', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Late Penalty (₹)</label>
              <input
                {...register('payrollRules.latePenalty', { valueAsNumber: true })}
                type="number"
                className="input-field"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Save Settings
        </Button>
      </form>
    </div>
  );
};

export default CompanySettings;