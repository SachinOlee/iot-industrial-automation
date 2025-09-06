// client/src/components/dashboard/Dashboard.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import useSensorData from '../../hooks/useSensorData';
import { useAuth } from '../../hooks/useAuth';
import {
  ExclamationTriangleIcon,
  CircuitBoardIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { SEVERITY_COLORS } from '../../utils/constants';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { latestData, analytics, alerts, loading, fetchLatestData, fetchAnalytics, fetchAlerts } =
    useSensorData();

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestData();
      fetchAnalytics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchLatestData, fetchAnalytics]);

  const unreadAlerts = alerts.filter((alert) => !alert.isResolved);
  const criticalAlerts = unreadAlerts.filter((alert) => alert.severity === 'critical');

  const stats = [
    {
      name: 'Active Machines',
      value: latestData.filter((data) => data.workingStatus).length,
      total: latestData.length,
      icon: CircuitBoardIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Average Temperature',
      value: analytics?.avgTemperature?.toFixed(1) || '0',
      unit: '°C',
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'System Uptime',
      value: `${analytics?.uptime?.toFixed(1) || '0'}%`,
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Active Alerts',
      value: unreadAlerts.length,
      critical: criticalAlerts.length,
      icon: ExclamationTriangleIcon,
      color: criticalAlerts.length > 0 ? 'text-red-600' : 'text-yellow-600',
      bgColor: criticalAlerts.length > 0 ? 'bg-red-100' : 'bg-yellow-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your industrial automation system.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                        {stat.unit && (
                          <span className="text-sm text-gray-500 ml-1">{stat.unit}</span>
                        )}
                        {stat.total && (
                          <span className="text-sm text-gray-500 ml-1">
                            / {stat.total}
                          </span>
                        )}
                      </div>
                      {stat.critical && stat.critical > 0 && (
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                          ({stat.critical} critical)
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Machine Status Overview
            </h3>
            <div className="mt-4 h-64">
              {latestData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="machineId" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="temperature" fill="#3B82F6" name="Temperature (°C)" />
                    <Bar dataKey="voltage" fill="#10B981" name="Voltage (V)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No sensor data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Motor Speed Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Motor Performance
            </h3>
            <div className="mt-4 h-64">
              {latestData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="machineId" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="motorSpeed"
                      stroke="#8B5CF6"
                      name="Motor Speed (RPM)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="workingPeriod"
                      stroke="#F59E0B"
                      name="Working Period (hrs)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No sensor data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts and Machine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Alerts
              </h3>
              <Link
                to="/alerts"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-6">
              {unreadAlerts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {unreadAlerts.slice(0, 5).map((alert) => (
                    <li key={alert._id} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            SEVERITY_COLORS[alert.severity]
                          }`}
                        >
                          {alert.severity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            Machine: {alert.machineId} •{' '}
                            {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No active alerts</p>
              )}
            </div>
          </div>
        </div>

        {/* Machine Status List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Machine Status
              </h3>
              <Link
                to="/sensors"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View details
              </Link>
            </div>
            <div className="mt-6">
              {latestData.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {latestData.slice(0, 5).map((data) => (
                    <li key={data._id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              data.workingStatus
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {data.workingStatus ? 'Online' : 'Offline'}
                          </div>
                          <p className="ml-3 text-sm font-medium text-gray-900">
                            {data.machineId}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {data.temperature}°C • {data.voltage}V
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No machine data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
