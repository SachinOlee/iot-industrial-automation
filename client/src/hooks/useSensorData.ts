// client/src/hooks/useSensorData.ts
import { useState, useEffect } from 'react';
import { SensorData, SensorAnalytics } from '../types/sensor';
import { MaintenanceAlert } from '../types/maintenance';
import ApiService from '../services/api';
import SocketService from '../services/socket';

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData[]>([]);
  const [analytics, setAnalytics] = useState<SensorAnalytics | null>(null);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestData();
    fetchAnalytics();
    fetchAlerts();

    // Set up socket listeners for real-time updates
    const socket = SocketService.getSocket();
    if (socket) {
      socket.on('sensor_update', (data: SensorData) => {
        setLatestData((prev) => {
          const filtered = prev.filter((item) => item.machineId !== data.machineId);
          return [data, ...filtered];
        });
      });

      socket.on('maintenance_alert', (alert: MaintenanceAlert) => {
        setAlerts((prev) => [alert, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('sensor_update');
        socket.off('maintenance_alert');
      }
    };
  }, []);

  const fetchSensorData = async (params?: {
    page?: number;
    limit?: number;
    machineId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setLoading(true);
      const response = await ApiService.getSensorData(params);
      if (response.success) {
        setSensorData(response.data);
      }
    } catch (error) {
      setError('Failed to fetch sensor data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestData = async () => {
    try {
      const response = await ApiService.getLatestSensorData();
      if (response.success) {
        setLatestData(response.data);
      }
    } catch (error) {
      setError('Failed to fetch latest sensor data');
    }
  };

  const fetchAnalytics = async (params?: {
    machineId?: string;
    period?: '24h' | '7d' | '30d';
  }) => {
    try {
      const response = await ApiService.getSensorAnalytics(params);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      setError('Failed to fetch analytics');
    }
  };

  const fetchAlerts = async (params?: {
    page?: number;
    limit?: number;
    resolved?: boolean;
    severity?: string;
  }) => {
    try {
      const response = await ApiService.getMaintenanceAlerts(params);
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (error) {
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const addSensorData = async (data: {
    machineId: string;
    motorSpeed: number;
    voltage: number;
    temperature: number;
    heat: number;
    workingStatus: boolean;
    workingPeriod: number;
  }) => {
    try {
      const response = await ApiService.addSensorData(data);
      if (response.success) {
        // Emit to socket for real-time updates
        SocketService.emitSensorData(response.data);
        return true;
      }
      return false;
    } catch (error) {
      setError('Failed to add sensor data');
      return false;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await ApiService.resolveAlert(alertId);
      if (response.success) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert._id === alertId
              ? { ...alert, isResolved: true, resolvedAt: new Date() }
              : alert
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      setError('Failed to resolve alert');
      return false;
    }
  };

  return {
    sensorData,
    latestData,
    analytics,
    alerts,
    loading,
    error,
    fetchSensorData,
    fetchLatestData,
    fetchAnalytics,
    fetchAlerts,
    addSensorData,
    resolveAlert,
  };
};

export default useSensorData; 