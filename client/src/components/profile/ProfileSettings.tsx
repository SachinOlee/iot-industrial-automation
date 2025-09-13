// client/src/components/profile/ProfileSettings.tsx
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import {
  UserCircleIcon,
  CameraIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

// Validation schemas
const personalInfoSchema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'At least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'At least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number'),
  jobTitle: yup.string().max(100, 'Job title too long'),
  department: yup.string().max(100, 'Department name too long'),
  location: yup.string().max(100, 'Location too long'),
  bio: yup.string().max(500, 'Bio too long'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

interface ProfileSettings {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    department: string;
    location: string;
    bio: string;
  };
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
    maintenanceAlerts: boolean;
    criticalAlerts: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'team' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLastSeen: boolean;
    allowDataCollection: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    temperatureUnit: 'celsius' | 'fahrenheit';
    theme: 'light' | 'dark' | 'auto';
    dashboardLayout: 'compact' | 'detailed' | 'grid';
    autoRefresh: boolean;
    refreshInterval: number;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
    deviceTracking: boolean;
  };
}

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [profileImage, setProfileImage] = useState<string>(user?.profileImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data
  const [settings, setSettings] = useState<ProfileSettings>({
    personalInfo: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      jobTitle: user?.jobTitle || '',
      department: user?.department || '',
      location: user?.location || '',
      bio: user?.bio || '',
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      maintenanceAlerts: true,
      criticalAlerts: true,
      dailyReports: false,
      weeklyReports: true,
      systemUpdates: true,
    },
    privacy: {
      profileVisibility: 'team',
      showEmail: false,
      showPhone: false,
      showLastSeen: true,
      allowDataCollection: true,
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      temperatureUnit: 'celsius',
      theme: 'light',
      dashboardLayout: 'detailed',
      autoRefresh: true,
      refreshInterval: 30,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
      deviceTracking: true,
    },
  });

  // Form hooks
  const personalInfoForm = useForm({
    resolver: yupResolver(personalInfoSchema),
    defaultValues: settings.personalInfo,
  });

  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'preferences', name: 'Preferences', icon: GlobeAltIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'password', name: 'Password', icon: EyeIcon },
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profileImage', file);

      // Here you would upload to your backend
      // const response = await ApiService.uploadProfileImage(formData);
      
      // For demo purposes, create a preview URL
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      
      toast.success('Profile image updated successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePersonalInfoSubmit = async (data: any) => {
    try {
      // await ApiService.updateProfile(data);
      setSettings(prev => ({ ...prev, personalInfo: data }));
      toast.success('Personal information updated successfully!');
    } catch (error) {
      toast.error('Failed to update personal information');
    }
  };

  const handlePasswordSubmit = async (data: any) => {
    try {
      // await ApiService.changePassword(data);
      passwordForm.reset();
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleNotificationToggle = (key: keyof ProfileSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
    toast.success('Notification preferences updated');
  };

  const handlePrivacyChange = (key: keyof ProfileSettings['privacy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handlePreferenceChange = (key: keyof ProfileSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleSecurityToggle = (key: keyof ProfileSettings['security']) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: typeof prev.security[key] === 'boolean' ? !prev.security[key] : prev.security[key]
      }
    }));
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Profile Image Section */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
              <UserCircleIcon className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
          <p className="text-sm text-gray-500">
            JPG, GIF or PNG. Max size of 5MB.
          </p>
          {isUploading && (
            <p className="text-sm text-blue-600">Uploading...</p>
          )}
        </div>
      </div>

      {/* Personal Information Form */}
      <form onSubmit={personalInfoForm.handleSubmit(handlePersonalInfoSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              {...personalInfoForm.register('firstName')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {personalInfoForm.formState.errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {personalInfoForm.formState.errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              {...personalInfoForm.register('lastName')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {personalInfoForm.formState.errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {personalInfoForm.formState.errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              {...personalInfoForm.register('email')}
              type="email"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {personalInfoForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {personalInfoForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              {...personalInfoForm.register('phone')}
              type="tel"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {personalInfoForm.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {personalInfoForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              {...personalInfoForm.register('jobTitle')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Industrial Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              {...personalInfoForm.register('department')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Manufacturing"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            {...personalInfoForm.register('location')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., New York, USA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            {...personalInfoForm.register('bio')}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell us about yourself..."
          />
          <p className="mt-1 text-sm text-gray-500">
            Brief description for your profile. Maximum 500 characters.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Alert Notifications</h3>
        <p className="text-sm text-gray-500">
          Configure how you want to receive maintenance and system alerts.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'maintenanceAlerts', label: 'Maintenance Alerts', desc: 'Get notified about scheduled maintenance' },
          { key: 'criticalAlerts', label: 'Critical Alerts', desc: 'Immediate notifications for critical issues' },
          { key: 'emailAlerts', label: 'Email Notifications', desc: 'Receive alerts via email' },
          { key: 'smsAlerts', label: 'SMS Notifications', desc: 'Receive alerts via SMS' },
          { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">{label}</div>
              <div className="text-sm text-gray-500">{desc}</div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.notifications[key as keyof ProfileSettings['notifications']]
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`}
              onClick={() => handleNotificationToggle(key as keyof ProfileSettings['notifications'])}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.notifications[key as keyof ProfileSettings['notifications']]
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Report Notifications</h3>
        <div className="mt-4 space-y-4">
          {[
            { key: 'dailyReports', label: 'Daily Reports', desc: 'Daily system performance reports' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Weekly analytics and insights' },
            { key: 'systemUpdates', label: 'System Updates', desc: 'Notifications about system updates' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{desc}</div>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.notifications[key as keyof ProfileSettings['notifications']]
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
                onClick={() => handleNotificationToggle(key as keyof ProfileSettings['notifications'])}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifications[key as keyof ProfileSettings['notifications']]
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
        <p className="text-sm text-gray-500">
          Control who can see your information and how your data is used.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Profile Visibility
          </label>
          <select
            value={settings.privacy.profileVisibility}
            onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="public">Public - Anyone can see your profile</option>
            <option value="team">Team Only - Only team members can see your profile</option>
            <option value="private">Private - Only you can see your profile</option>
          </select>
        </div>

        <div className="space-y-4">
          {[
            { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email on your profile' },
            { key: 'showPhone', label: 'Show Phone Number', desc: 'Display your phone number on your profile' },
            { key: 'showLastSeen', label: 'Show Last Seen', desc: 'Display when you were last active' },
            { key: 'allowDataCollection', label: 'Allow Data Collection', desc: 'Help improve our services with usage data' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{desc}</div>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.privacy[key as keyof ProfileSettings['privacy']]
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
                onClick={() => handlePrivacyChange(key as keyof ProfileSettings['privacy'], !settings.privacy[key as keyof ProfileSettings['privacy']])}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.privacy[key as keyof ProfileSettings['privacy']]
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Display Preferences</h3>
        <p className="text-sm text-gray-500">
          Customize how the application looks and behaves for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={settings.preferences.language}
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={settings.preferences.timezone}
            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Shanghai">Shanghai</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date Format</label>
          <select
            value={settings.preferences.dateFormat}
            onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="MM/dd/yyyy">MM/dd/yyyy (US)</option>
            <option value="dd/MM/yyyy">dd/MM/yyyy (EU)</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd (ISO)</option>
            <option value="MMM dd, yyyy">MMM dd, yyyy (Long)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Temperature Unit</label>
          <select
            value={settings.preferences.temperatureUnit}
            onChange={(e) => handlePreferenceChange('temperatureUnit', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="celsius">Celsius (°C)</option>
            <option value="fahrenheit">Fahrenheit (°F)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <select
            value={settings.preferences.theme}
            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dashboard Layout</label>
          <select
            value={settings.preferences.dashboardLayout}
            onChange={(e) => handlePreferenceChange('dashboardLayout', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="compact">Compact</option>
            <option value="detailed">Detailed</option>
            <option value="grid">Grid View</option>
          </select>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Auto-refresh Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Auto-refresh Dashboard</div>
              <div className="text-sm text-gray-500">Automatically refresh dashboard data</div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.preferences.autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              onClick={() => handlePreferenceChange('autoRefresh', !settings.preferences.autoRefresh)}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.preferences.autoRefresh ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings.preferences.autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Refresh Interval (seconds)
              </label>
              <select
                value={settings.preferences.refreshInterval}
                onChange={(e) => handlePreferenceChange('refreshInterval', parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        <p className="text-sm text-gray-500">
          Manage your account security and login preferences.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <div className="font-medium text-yellow-800">Two-Factor Authentication</div>
              <div className="text-sm text-yellow-700">
                {settings.security.twoFactorEnabled ? 
                  'Two-factor authentication is enabled' : 
                  'Enhance your account security by enabling two-factor authentication'
                }
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSecurityToggle('twoFactorEnabled')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              settings.security.twoFactorEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {settings.security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Session Timeout (minutes)
          </label>
          <select
            value={settings.security.sessionTimeout}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
            }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
            <option value={-1}>Never</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Automatically log out after period of inactivity
          </p>
        </div>

        <div className="space-y-4">
          {[
            { key: 'loginNotifications', label: 'Login Notifications', desc: 'Get notified of new login attempts' },
            { key: 'deviceTracking', label: 'Device Tracking', desc: 'Track devices that access your account' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{desc}</div>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.security[key as keyof ProfileSettings['security']]
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
                onClick={() => handleSecurityToggle(key as keyof ProfileSettings['security'])}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.security[key as keyof ProfileSettings['security']]
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Active Sessions</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Current Session</div>
                  <div className="text-xs text-gray-500">Chrome on Windows • Active now</div>
                </div>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Current</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Mobile Device</div>
                  <div className="text-xs text-gray-500">Safari on iOS • 2 hours ago</div>
                </div>
              </div>
              <button className="text-xs text-red-600 hover:text-red-800">Revoke</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPassword = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <p className="text-sm text-gray-500">
          Ensure your account is using a strong, unique password.
        </p>
      </div>

      <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            {...passwordForm.register('currentPassword')}
            type="password"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {passwordForm.formState.errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">
              {String(passwordForm.formState.errors.currentPassword.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            {...passwordForm.register('newPassword')}
            type="password"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {passwordForm.formState.errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">
              {String(passwordForm.formState.errors.newPassword.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            {...passwordForm.register('confirmPassword')}
            type="password"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {String(passwordForm.formState.errors.confirmPassword.message)}
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains uppercase and lowercase letters</li>
            <li>• Contains at least one number</li>
            <li>• Contains at least one special character (@$!%*?&)</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => passwordForm.reset()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Password
          </button>
        </div>
      </form>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Password History</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <div>Last changed: March 15, 2024</div>
          <div>Password strength: <span className="text-green-600 font-medium">Strong</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && renderPersonalInfo()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'privacy' && renderPrivacy()}
          {activeTab === 'preferences' && renderPreferences()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'password' && renderPassword()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

