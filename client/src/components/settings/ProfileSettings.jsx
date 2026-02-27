import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  MapPin,
  Briefcase,
  Calendar
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../common/Button';
import Card from '../common/Card';
import { updateProfile, uploadAvatar } from '../../services/users';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional()
});

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: user
  });

  useEffect(() => {
    if (user) {
      reset(user);
      setAvatar(user.avatar);
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const updatedUser = await updateProfile(data);
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const avatarUrl = await uploadAvatar(formData);
      setAvatar(avatarUrl);
      updateUser({ ...user, avatar: avatarUrl });
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profile Settings</h2>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={loading}
          icon={Save}
        >
          Save Changes
        </Button>
      </div>

      {/* Avatar Section */}
      <Card>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={user?.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-600">
                  {user?.name?.charAt(0)}
                </span>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingImage}
              />
            </label>
            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">Employee ID: {user?.employeeId}</p>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Personal Information</span>
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className="input-field"
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
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  {...register('address')}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    {...register('city')}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    {...register('state')}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    {...register('country')}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <input
                    {...register('zipCode')}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-medium flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Emergency Contact</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact Name
                  </label>
                  <input
                    {...register('emergencyContact')}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact Phone
                  </label>
                  <input
                    {...register('emergencyPhone')}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Info (Read-only) */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-3">Employment Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium">{user?.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <p className="font-medium">{user?.position || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Join Date</p>
                <p className="font-medium">
                  {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shift</p>
                <p className="font-medium">{user?.shift?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSettings;