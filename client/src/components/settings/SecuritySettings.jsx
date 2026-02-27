import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Lock,
  Key,
  Shield,
  Smartphone,
  Fingerprint,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { updatePassword, enable2FA, disable2FA, getLoginHistory } from '../../services/auth';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const SecuritySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loginHistory, setLoginHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const handlePasswordChange = async (data) => {
    setLoading(true);
    try {
      await updatePassword(data.currentPassword, data.newPassword);
      toast.success('Password updated successfully');
      reset();
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const { qrCode } = await enable2FA();
      setQrCode(qrCode);
      setShowQR(true);
    } catch (error) {
      toast.error('Failed to enable 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await enable2FA(verificationCode);
      setTwoFAEnabled(true);
      setShowQR(false);
      toast.success('2FA enabled successfully');
    } catch (error) {
      toast.error('Invalid verification code');
    }
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable 2FA?')) {
      try {
        await disable2FA();
        setTwoFAEnabled(false);
        toast.success('2FA disabled');
      } catch (error) {
        toast.error('Failed to disable 2FA');
      }
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const history = await getLoginHistory();
      setLoginHistory(history);
      setShowHistory(true);
    } catch (error) {
      toast.error('Failed to load login history');
    }
  };

  const getDeviceIcon = (device) => {
    if (device.includes('Mobile')) return Smartphone;
    return Monitor;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Security Settings</h2>

      {/* Change Password */}
      <Card>
        <h3 className="font-semibold mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>Change Password</span>
        </h3>

        <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">
              Current Password
            </label>
            <input
              {...register('currentPassword')}
              type="password"
              className="input-field"
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              {...register('newPassword')}
              type="password"
              className="input-field"
            />
            {errors.newPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm New Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="input-field"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
          >
            Update Password
          </Button>
        </form>

        {/* Password Requirements */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium mb-2">Password Requirements:</p>
          <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
            <li className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>At least 8 characters long</span>
            </li>
            <li className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Contains uppercase and lowercase letters</span>
            </li>
            <li className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Contains at least one number</span>
            </li>
            <li className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Contains at least one special character</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          
          {twoFAEnabled ? (
            <Button
              variant="danger"
              onClick={handleDisable2FA}
            >
              Disable 2FA
            </Button>
          ) : (
            <Button
              onClick={handleEnable2FA}
            >
              Enable 2FA
            </Button>
          )}
        </div>

        {twoFAEnabled && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              2FA is enabled on your account
            </p>
          </div>
        )}

        {/* 2FA QR Code Modal */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <h4 className="font-medium mb-3">Scan QR Code</h4>
            <p className="text-sm text-gray-500 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="input-field"
              />
              <Button
                onClick={handleVerify2FA}
                className="w-full"
              >
                Verify and Enable
              </Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Active Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Active Sessions</h3>
              <p className="text-sm text-gray-500">Manage your active login sessions</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLoginHistory}
          >
            View All
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Current Session</p>
                <p className="text-xs text-gray-500">
                  {navigator.userAgent.substring(0, 50)}...
                </p>
              </div>
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Active Now
            </span>
          </div>
        </div>
      </Card>

      {/* Login History Modal */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Login History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {loginHistory.map((login, index) => {
                const Icon = getDeviceIcon(login.device);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{login.device}</p>
                        <p className="text-xs text-gray-500">
                          {login.location} • {login.ip}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(login.timestamp).toLocaleString()}
                      </p>
                      {login.success ? (
                        <span className="text-xs text-green-600">Successful</span>
                      ) : (
                        <span className="text-xs text-red-600">Failed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Device Binding */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <Fingerprint className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold">Device Binding</h3>
              <p className="text-sm text-gray-500">
                Your account is bound to your registered device
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Device ID</p>
            <p className="text-xs text-gray-500">{user?.deviceId || 'Not registered'}</p>
          </div>
        </div>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <h3 className="font-semibold mb-3 flex items-center space-x-2">
          <History className="w-5 h-5" />
          <span>Recent Security Alerts</span>
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">New login from Chrome on Windows</span>
            </div>
            <span className="text-xs text-gray-500">2 days ago</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Password changed successfully</span>
            </div>
            <span className="text-xs text-gray-500">1 week ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SecuritySettings;