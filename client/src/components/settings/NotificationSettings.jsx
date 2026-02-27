import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Volume2,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { getNotificationSettings, updateNotificationSettings } from '../../services/settings';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState(null);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      email: {
        enabled: true,
        attendance: true,
        leave: true,
        payroll: true,
        signature: true,
        system: true
      },
      push: {
        enabled: true,
        attendance: true,
        leave: true,
        payroll: true,
        signature: true,
        system: false
      },
      sms: {
        enabled: false,
        attendance: false,
        leave: false,
        payroll: false,
        signature: false,
        system: false
      },
      inApp: {
        enabled: true,
        attendance: true,
        leave: true,
        payroll: true,
        signature: true,
        system: true
      },
      schedule: {
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        digest: {
          enabled: false,
          frequency: 'daily',
          time: '09:00'
        }
      },
      types: {
        info: true,
        success: true,
        warning: true,
        error: true
      }
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getNotificationSettings();
      setSettings(data?.data || data);
      // Populate form with data
      const settingsData = data?.data || data || {};
      Object.keys(settingsData).forEach(key => {
        if (typeof settingsData[key] === 'object') {
          Object.keys(settingsData[key]).forEach(subKey => {
            setValue(`${key}.${subKey}`, settingsData[key][subKey]);
          });
        } else {
          setValue(key, settingsData[key]);
        }
      });
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      // Don't show error, use default values
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateNotificationSettings(data);
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const emailEnabled = watch('email.enabled');
  const pushEnabled = watch('push.enabled');
  const smsEnabled = watch('sms.enabled');
  const quietHoursEnabled = watch('schedule.quietHours.enabled');

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
        <h2 className="text-xl font-semibold">Notification Settings</h2>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={loading}
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('email.enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {emailEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4"
            >
              {['attendance', 'leave', 'payroll', 'signature', 'system'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register(`email.${type}`)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </motion.div>
          )}
        </Card>

        {/* Push Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Push Notifications</h3>
                <p className="text-sm text-gray-500">Real-time alerts on your device</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('push.enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {pushEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4"
            >
              {['attendance', 'leave', 'payroll', 'signature', 'system'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register(`push.${type}`)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </motion.div>
          )}
        </Card>

        {/* SMS Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Critical alerts via SMS</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('sms.enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {smsEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4"
            >
              {['attendance', 'leave', 'payroll', 'signature', 'system'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register(`sms.${type}`)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </motion.div>
          )}
        </Card>

        {/* In-App Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">In-App Notifications</h3>
                <p className="text-sm text-gray-500">Notifications within the app</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('inApp.enabled')}
                className="sr-only peer"
                disabled
              />
              <div className="w-11 h-6 bg-primary-600 rounded-full peer dark:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <p className="text-sm text-gray-500 mb-2">In-app notifications are always enabled</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['attendance', 'leave', 'payroll', 'signature', 'system'].map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register(`inApp.${type}`)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  defaultChecked
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Schedule Settings */}
        <Card>
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Schedule Settings</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quiet Hours</p>
                <p className="text-sm text-gray-500">Mute notifications during specific hours</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('schedule.quietHours.enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {quietHoursEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-4 pl-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    {...register('schedule.quietHours.start')}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    {...register('schedule.quietHours.end')}
                    className="input-field"
                  />
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Digest</p>
                <p className="text-sm text-gray-500">Receive a summary of all notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('schedule.digest.enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {watch('schedule.digest.enabled') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-4 pl-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select {...register('schedule.digest.frequency')} className="input-field">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    {...register('schedule.digest.time')}
                    className="input-field"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Notification Types */}
        <Card>
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Notification Types</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['info', 'success', 'warning', 'error'].map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register(`types.${type}`)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Test Notification */}
        <Card>
          <h3 className="font-semibold mb-4">Test Notification</h3>
          <p className="text-sm text-gray-500 mb-4">
            Send a test notification to verify your settings
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success('Test notification sent!')}
          >
            Send Test Notification
          </Button>
        </Card>
      </form>
    </div>
  );
};

export default NotificationSettings;