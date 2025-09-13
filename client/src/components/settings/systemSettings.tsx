import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

// TypeScript interfaces
interface Machine {
  id: string;
  machineId: string;
  name: string;
  location: string;
  type: string;
  status: string;
  thresholds: {
    temperature: { warning: number; critical: number };
    voltage: { min: number; max: number };
    motorSpeed: { max: number };
  };
  lastMaintenance: Date;
  nextMaintenance: Date;
}

interface SystemConfig {
  dataRetention: number;
  backupFrequency: string;
  autoBackup: boolean;
  alertDelay: number;
  maxConcurrentAlerts: number;
  maintenanceWindow: {
    start: string;
    end: string;
    timezone: string;
  };
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpEmail: string;
  smtpPassword: string;
  fromName: string;
  testEmail: string;
}

interface SystemStats {
  totalMachines: number;
  activeMachines: number;
  totalAlerts: number;
  dataPoints: number;
  diskUsage: number;
  uptime: string;
  lastBackup: Date;
}

interface FormErrors {
  machineId?: string;
  name?: string;
  location?: string;
  type?: string;
}

interface FormData {
  machineId: string;
  name: string;
  location: string;
  type: string;
}

// Simple SVG Icons
interface IconProps {
  className?: string;
}

const Icons = {
  CircuitBoard: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  Bell: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 2.37A7.953 7.953 0 014 8c0 2.01.78 3.84 2.05 5.19L10 17h5l3.95-3.81A7.951 7.951 0 0120 8c0-1.85-.63-3.55-1.68-4.89L15 6.5 9 2.5 4.868 2.37z" />
    </svg>
  ),
  Cog: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Server: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  Envelope: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Wrench: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    </svg>
  ),
  Plus: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Pencil: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  X: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  CloudUpload: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Download: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Chart: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  CheckCircle: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ExclamationTriangle: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('machines');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    machineId: '',
    name: '',
    location: '',
    type: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [systemConfig, setSystemConfig] = useState({
    dataRetention: 90,
    backupFrequency: 'weekly',
    autoBackup: true,
    alertDelay: 5,
    maxConcurrentAlerts: 10,
    maintenanceWindow: {
      start: '02:00',
      end: '04:00',
      timezone: 'UTC',
    },
  });

  const [emailConfig, setEmailConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpEmail: '',
    smtpPassword: '',
    fromName: 'IoT Industrial Automation',
    testEmail: '',
  });

  const [systemStats, setSystemStats] = useState({
    totalMachines: 12,
    activeMachines: 10,
    totalAlerts: 245,
    dataPoints: 1250000,
    diskUsage: 65,
    uptime: '15 days',
    lastBackup: new Date(),
  });

  const tabs = [
    { id: 'machines', name: 'Machine Management', icon: Icons.CircuitBoard },
    { id: 'alerts', name: 'Alert Configuration', icon: Icons.Bell },
    { id: 'system', name: 'System Configuration', icon: Icons.Cog },
    { id: 'data', name: 'Data Management', icon: Icons.Server },
    { id: 'email', name: 'Email Settings', icon: Icons.Envelope },
    { id: 'maintenance', name: 'System Maintenance', icon: Icons.Wrench },
  ];

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await ApiService.getMachines();
      if (response.success) {
        setMachines(response.data.machines);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      toast.error('Failed to load machines');
    }
  };

  const validateForm = (data: FormData): FormErrors => {
    const errors: FormErrors = {};
    if (!data.machineId.trim()) errors.machineId = 'Machine ID is required';
    if (!data.name.trim()) errors.name = 'Machine name is required';
    if (!data.location.trim()) errors.location = 'Location is required';
    if (!data.type.trim()) errors.type = 'Machine type is required';
    return errors;
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (selectedMachine) {
        // Update existing machine
        await ApiService.updateMachine(selectedMachine.id, {
          machineId: formData.machineId,
          name: formData.name,
          location: formData.location,
          type: formData.type
        });
        toast.success('Machine updated successfully');
      } else {
        // Create new machine
        await ApiService.createMachine({
          machineId: formData.machineId,
          name: formData.name,
          location: formData.location,
          type: formData.type
        });
        toast.success('Machine added successfully');
      }

      // Refresh the machines list
      await fetchMachines();

      setSelectedMachine(null);
      setIsAddingMachine(false);
      setFormData({ machineId: '', name: '', location: '', type: '' });
      setFormErrors({});
    } catch (error) {
      console.error('Failed to save machine:', error);
      toast.error('Failed to save machine configuration');
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await ApiService.deleteMachine(machineId);
        toast.success('Machine deleted successfully');
        // Refresh the machines list
        await fetchMachines();
      } catch (error) {
        console.error('Failed to delete machine:', error);
        toast.error('Failed to delete machine');
      }
    }
  };

  const handleTestEmail = async () => {
    try {
      if (!emailConfig.testEmail) {
        toast.error('Please enter a test email address');
        return;
      }

      await ApiService.testEmailSettings(emailConfig.testEmail);
      toast.success(`Test email sent to ${emailConfig.testEmail}`);
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email');
    }
  };

  const handleBackupNow = async () => {
    try {
      await ApiService.createBackup();
      toast.success('Backup creation started successfully');
      // Refresh system stats to show updated backup time
      setTimeout(() => {
        setSystemStats(prev => ({ ...prev, lastBackup: new Date() }));
      }, 1000);
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all system logs?')) {
      try {
        await ApiService.clearSystemLogs();
        toast.success('System logs cleared successfully');
      } catch (error) {
        console.error('Failed to clear logs:', error);
        toast.error('Failed to clear logs');
      }
    }
  };

  const renderMachineManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Machine Configuration</h3>
          <p className="text-sm text-gray-500">
            Manage your industrial machines and configure alert thresholds.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAddingMachine(true);
            setSelectedMachine(null);
            setFormData({ machineId: '', name: '', location: '', type: '' });
            setFormErrors({});
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Icons.Plus className="h-4 w-4 mr-2" />
          Add Machine
        </button>
      </div>

      {/* Machine List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {machines.map((machine) => (
            <li key={machine.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-4 w-4 rounded-full ${
                      machine.status === 'active' ? 'bg-green-400' :
                      machine.status === 'maintenance' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {machine.name}
                      </div>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {machine.machineId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {machine.type} • {machine.location}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Last Maintenance: {machine.lastMaintenance.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMachine(machine);
                      setIsAddingMachine(true);
                      setFormData({
                        machineId: machine.machineId,
                        name: machine.name,
                        location: machine.location,
                        type: machine.type
                      });
                      setFormErrors({});
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Icons.Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMachine(machine.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Icons.Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add/Edit Machine Modal */}
      {isAddingMachine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedMachine ? 'Edit Machine' : 'Add New Machine'}
              </h3>
              <button
                onClick={() => setIsAddingMachine(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icons.X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Machine ID
                  </label>
                  <input
                    value={formData.machineId}
                    onChange={(e) => handleFormChange('machineId', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., MACHINE-003"
                  />
                  {formErrors.machineId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.machineId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Machine Name
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Production Line C"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Factory Floor 3"
                  />
                  {formErrors.location && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Machine Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="CNC Machine">CNC Machine</option>
                    <option value="Industrial Robot">Industrial Robot</option>
                    <option value="Conveyor System">Conveyor System</option>
                    <option value="Packaging Machine">Packaging Machine</option>
                    <option value="Quality Control">Quality Control</option>
                  </select>
                  {formErrors.type && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingMachine(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {selectedMachine ? 'Update' : 'Add'} Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlertConfiguration = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Alert Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure system-wide alert settings and notification rules.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Global Alert Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Global Alert Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Alert Delay (minutes)
              </label>
              <select
                value={systemConfig.alertDelay}
                onChange={(e) => setSystemConfig(prev => ({ 
                  ...prev, 
                  alertDelay: parseInt(e.target.value) 
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Immediate</option>
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Concurrent Alerts
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={systemConfig.maxConcurrentAlerts}
                onChange={(e) => setSystemConfig(prev => ({ 
                  ...prev, 
                  maxConcurrentAlerts: parseInt(e.target.value) 
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Alert Types Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Alert Types</h4>
          <div className="space-y-4">
            {[
              { key: 'temperature', label: 'Temperature Alerts', enabled: true },
              { key: 'voltage', label: 'Voltage Alerts', enabled: true },
              { key: 'vibration', label: 'Vibration Alerts', enabled: false },
              { key: 'maintenance', label: 'Maintenance Alerts', enabled: true },
              { key: 'system', label: 'System Alerts', enabled: true },
            ].map((alertType) => (
              <div key={alertType.key} className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">
                  {alertType.label}
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    alertType.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      alertType.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Alert Activity</h4>
        <div className="space-y-3">
          {[
            { type: 'Critical', message: 'MACHINE-001 temperature exceeded 85°C', time: '2 minutes ago', color: 'red' },
            { type: 'Warning', message: 'MACHINE-002 voltage fluctuation detected', time: '15 minutes ago', color: 'yellow' },
            { type: 'Info', message: 'MACHINE-003 scheduled maintenance reminder', time: '1 hour ago', color: 'blue' },
          ].map((alert, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`h-3 w-3 rounded-full ${
                alert.color === 'red' ? 'bg-red-400' : 
                alert.color === 'yellow' ? 'bg-yellow-400' : 'bg-blue-400'
              }`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{alert.message}</div>
                <div className="text-xs text-gray-500">{alert.time}</div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                alert.color === 'red' ? 'bg-red-100 text-red-800' :
                alert.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {alert.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemConfiguration = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure system-wide settings and operational parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Data Retention */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Data Retention</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sensor Data Retention (days)
              </label>
              <select
                value={systemConfig.dataRetention}
                onChange={(e) => setSystemConfig(prev => ({ 
                  ...prev, 
                  dataRetention: parseInt(e.target.value) 
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Older data will be automatically archived
              </p>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Backup Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Auto Backup</div>
                <div className="text-xs text-gray-500">Automatically backup system data</div>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  systemConfig.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                onClick={() => setSystemConfig(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    systemConfig.autoBackup ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {systemConfig.autoBackup && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Backup Frequency
                </label>
                <select
                  value={systemConfig.backupFrequency}
                  onChange={(e) => setSystemConfig(prev => ({ 
                    ...prev, 
                    backupFrequency: e.target.value
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Window */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Maintenance Window</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={systemConfig.maintenanceWindow.start}
                  onChange={(e) => setSystemConfig(prev => ({
                    ...prev,
                    maintenanceWindow: { ...prev.maintenanceWindow, start: e.target.value }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={systemConfig.maintenanceWindow.end}
                  onChange={(e) => setSystemConfig(prev => ({
                    ...prev,
                    maintenanceWindow: { ...prev.maintenanceWindow, end: e.target.value }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              System maintenance tasks will run during this time window
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">System Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Uptime</span>
              <span className="text-sm font-medium text-green-600">{systemStats.uptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Machines</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStats.activeMachines} / {systemStats.totalMachines}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Data Points</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStats.dataPoints.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disk Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${systemStats.diskUsage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{systemStats.diskUsage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
        <p className="text-sm text-gray-500">
          Manage system data, backups, and perform maintenance operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Backup Operations */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Backup Operations</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Last Backup</div>
                <div className="text-xs text-gray-500">
                  {systemStats.lastBackup.toLocaleDateString()} at {systemStats.lastBackup.toLocaleTimeString()}
                </div>
              </div>
              <Icons.CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleBackupNow}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Icons.CloudUpload className="h-4 w-4 mr-2" />
                Create Backup Now
              </button>
              
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Icons.Download className="h-4 w-4 mr-2" />
                Download Latest Backup
              </button>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Data Export</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Export Format</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="date"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              <Icons.Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Database Maintenance */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Database Maintenance</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Icons.Wrench className="h-4 w-4 mr-2" />
                Optimize Database
              </button>
              
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Icons.Chart className="h-4 w-4 mr-2" />
                Analyze Performance
              </button>
              
              <button 
                onClick={handleClearLogs}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Icons.Trash className="h-4 w-4 mr-2" />
                Clear System Logs
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <Icons.ExclamationTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <div className="text-sm text-yellow-800">
                    <p><strong>Warning:</strong> Database maintenance operations may temporarily affect system performance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Data Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Records</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStats.dataPoints.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Records</span>
              <span className="text-sm font-medium text-gray-900">12,450</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average/Hour</span>
              <span className="text-sm font-medium text-gray-900">520</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Size</span>
              <span className="text-sm font-medium text-gray-900">2.4 GB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure SMTP settings for system notifications and alerts.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SMTP Configuration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">SMTP Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  value={emailConfig.smtpHost}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={emailConfig.smtpPort}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="587"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailConfig.smtpEmail}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpEmail: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password / App Password
                </label>
                <input
                  type="password"
                  value={emailConfig.smtpPassword}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password or app password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From Name
                </label>
                <input
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="IoT Industrial Automation"
                />
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div className="bg-white shadow rounded-lg p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Email Templates</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Alert Email Template
                </label>
                <select className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="default">Default Template</option>
                  <option value="minimal">Minimal Template</option>
                  <option value="detailed">Detailed Template</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Report Email Template
                </label>
                <select className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="standard">Standard Report</option>
                  <option value="executive">Executive Summary</option>
                  <option value="technical">Technical Report</option>
                </select>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Icons.Pencil className="h-4 w-4 mr-2" />
                  Customize Templates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Test Email Configuration</h4>
          <div className="flex space-x-4">
            <input
              type="email"
              value={emailConfig.testEmail}
              onChange={(e) => setEmailConfig(prev => ({ ...prev, testEmail: e.target.value }))}
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email to send test message"
            />
            <button
              type="button"
              onClick={handleTestEmail}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Icons.Envelope className="h-4 w-4 mr-2" />
              Send Test
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setEmailConfig({
              smtpHost: 'smtp.gmail.com',
              smtpPort: 587,
              smtpEmail: '',
              smtpPassword: '',
              fromName: 'IoT Industrial Automation',
              testEmail: '',
            })}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => toast.success('Email configuration saved successfully')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemMaintenance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">System Maintenance</h3>
        <p className="text-sm text-gray-500">
          Perform system maintenance tasks and monitor system health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* System Health */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">System Health</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CPU Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">45%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">72%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network I/O</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">28%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Tasks */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Maintenance Tasks</h4>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Clear Temp Files</div>
                  <div className="text-xs text-gray-500">Free up disk space</div>
                </div>
                <Icons.Wrench className="h-4 w-4 text-gray-400" />
              </div>
            </button>
            
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Restart Services</div>
                  <div className="text-xs text-gray-500">Restart all system services</div>
                </div>
                <Icons.Wrench className="h-4 w-4 text-gray-400" />
              </div>
            </button>
            
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Update System</div>
                  <div className="text-xs text-gray-500">Check for updates</div>
                </div>
                <Icons.Wrench className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Scheduled Tasks */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Scheduled Tasks</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-green-900">Daily Backup</div>
                <div className="text-xs text-green-700">Next: Tonight at 2:00 AM</div>
              </div>
              <Icons.CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-blue-900">Log Rotation</div>
                <div className="text-xs text-blue-700">Next: Weekly on Sunday</div>
              </div>
              <Icons.CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-yellow-900">DB Optimization</div>
                <div className="text-xs text-yellow-700">Next: Monthly</div>
              </div>
              <Icons.ExclamationTriangle className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent System Logs</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[
            { level: 'INFO', message: 'System backup completed successfully', time: '10:30:15' },
            { level: 'WARN', message: 'High memory usage detected on server', time: '10:25:42' },
            { level: 'INFO', message: 'Database optimization started', time: '10:20:00' },
            { level: 'ERROR', message: 'Failed to connect to MACHINE-005', time: '10:15:33' },
            { level: 'INFO', message: 'New user registered: john.doe@company.com', time: '10:10:18' },
            { level: 'INFO', message: 'Email notification sent successfully', time: '10:05:44' },
          ].map((log, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm font-mono">
              <span className="text-gray-500">{log.time}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {log.level}
              </span>
              <span className="text-gray-700">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure and manage your IoT industrial automation system.
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
          {activeTab === 'machines' && renderMachineManagement()}
          {activeTab === 'alerts' && renderAlertConfiguration()}
          {activeTab === 'system' && renderSystemConfiguration()}
          {activeTab === 'data' && renderDataManagement()}
          {activeTab === 'email' && renderEmailSettings()}
          {activeTab === 'maintenance' && renderSystemMaintenance()}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;