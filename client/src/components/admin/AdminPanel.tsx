// client/src/components/admin/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  CogIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import ApiService from '../../services/api';
import toast from 'react-hot-toast';

interface SystemStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSensorData: number;
    totalAlerts: number;
    unresolvedAlerts: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    uptime: string;
  };
  charts: {
    recentSensorData: any[];
    alertsBySeverity: any[];
    userActivityToday: number;
  };
  recent: {
    users: any[];
    alerts: any[];
    systemLogs: any[];
  };
}

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStats = async () => {
    try {
      setRefreshing(true);
      const response = await ApiService.getSystemStats();
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error('Failed to fetch system statistics');
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSystemStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  const adminCards = [
    {
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: UsersIcon,
      href: '/admin/users',
      stat: stats?.overview.totalUsers || 0,
      statLabel: 'Total Users',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      name: 'System Control',
      description: 'Monitor and control system settings',
      icon: CogIcon,
      href: '/admin/system',
      stat: stats?.overview.totalSensorData || 0,
      statLabel: 'Data Points',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      name: 'Alert Management',
      description: 'View and manage all system alerts',
      icon: ExclamationTriangleIcon,
      href: '/admin/alerts',
      stat: stats?.overview.unresolvedAlerts || 0,
      statLabel: 'Active Alerts',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
    },
    {
      name: 'Analytics Overview',
      description: 'System-wide analytics and reporting',
      icon: ChartBarIcon,
      href: '/analytics',
      stat: stats?.overview.activeUsers || 0,
      statLabel: 'Active Users',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
  ];

  const getHealthStatusColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-500">
                System administration and management dashboard
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* System Health Badge */}
              {stats?.overview.systemHealth && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(stats.overview.systemHealth)}`}>
                  {stats.overview.systemHealth === 'healthy' ? (
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 mr-1" />
                  )}
                  System {stats.overview.systemHealth}
                </div>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {/* System Uptime */}
          {stats?.overview.uptime && (
            <div className="mt-4 text-sm text-gray-600">
              System uptime: <span className="font-medium">{stats.overview.uptime}</span>
            </div>
          )}
        </div>
      </div>

      {/* System Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.overview.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.overview.activeUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CpuChipIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Sensor Data Points
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.overview.totalSensorData.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Alerts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.overview.totalAlerts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Alerts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.overview.unresolvedAlerts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Functions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {adminCards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{card.name}</h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{card.stat.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{card.statLabel}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Link
                  to={card.href}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${card.color} ${card.hoverColor} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Manage
                </Link>
                <Link
                  to={card.href}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Users
                </h3>
                <Link
                  to="/admin/users"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
              
              {stats.recent.users && stats.recent.users.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {stats.recent.users.slice(0, 5).map((user) => (
                    <li key={user._id} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'operator'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No recent users</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Alerts
                </h3>
                <Link
                  to="/admin/alerts"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
              
              {stats.recent.alerts && stats.recent.alerts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {stats.recent.alerts.slice(0, 5).map((alert) => (
                    <li key={alert._id} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {alert.message}
                          </p>
                          <p className="text-sm text-gray-500">
                            {alert.userId && `${alert.userId.firstName} ${alert.userId.lastName}`} • Machine: {alert.machineId}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No recent alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/users/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add New User
            </Link>
            <Link
              to="/admin/system/backup"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              System Backup
            </Link>
            <Link
              to="/admin/logs"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View System Logs
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              System Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;