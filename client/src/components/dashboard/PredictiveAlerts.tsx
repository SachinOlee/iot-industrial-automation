// client/src/components/dashboard/PredictiveAlerts.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import useSensorData from '../../hooks/useSensorData';
import { MaintenanceAlert } from '../../types/maintenance';
import { SEVERITY_COLORS, ALERT_TYPE_LABELS } from '../../utils/constants';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PredictiveAlerts: React.FC = () => {
  const [filter, setFilter] = useState<{
    severity: string;
    resolved: string;
    alertType: string;
  }>({
    severity: '',
    resolved: '',
    alertType: '',
  });

  const { alerts, loading, resolveAlert, fetchAlerts } = useSensorData();

  const handleResolveAlert = async (alertId: string) => {
    const success = await resolveAlert(alertId);
    if (success) {
      toast.success('Alert resolved successfully');
      fetchAlerts();
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter.severity && alert.severity !== filter.severity) return false;
    if (filter.resolved === 'true' && !alert.isResolved) return false;
    if (filter.resolved === 'false' && alert.isResolved) return false;
    if (filter.alertType && alert.alertType !== filter.alertType) return false;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Alerts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage predictive maintenance alerts from your machines.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Severity
              </label>
              <select
                value={filter.severity}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, severity: e.target.value }))
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filter.resolved}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, resolved: e.target.value }))
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Alerts</option>
                <option value="false">Active</option>
                <option value="true">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Alert Type
              </label>
              <select
                value={filter.alertType}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, alertType: e.target.value }))
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                {Object.entries(ALERT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <li key={alert._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0 mr-4">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            SEVERITY_COLORS[alert.severity]
                          }`}
                        >
                          {alert.severity}
                        </div>
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.isResolved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {alert.isResolved ? 'Resolved' : 'Active'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.message}
                        </p>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          <span>Machine: {alert.machineId}</span>
                          <span>
                            Type: {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                          </span>
                          <span>
                            Created: {format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                          {alert.confidence && (
                            <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        {alert.predictedFailureDate && (
                          <div className="mt-1 text-sm text-red-600">
                            Predicted failure: {format(new Date(alert.predictedFailureDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {alert.isResolved && alert.resolvedAt && (
                          <div className="mt-1 text-sm text-green-600">
                            Resolved: {format(new Date(alert.resolvedAt), 'MMM dd, yyyy HH:mm')}
                            {alert.resolvedBy && (
                              <span className="ml-1">
                                by {alert.resolvedBy.firstName} {alert.resolvedBy.lastName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {!alert.isResolved && (
                      <button
                        onClick={() => handleResolveAlert(alert._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-center text-gray-500">
              No alerts found matching your filters
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PredictiveAlerts;