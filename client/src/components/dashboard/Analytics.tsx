// client/src/components/dashboard/Analytics.tsx
import React, { useState, useEffect } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import useSensorData from '../../hooks/useSensorData';
import ApiService from '../../services/api';

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { analytics, latestData } = useSensorData();

  useEffect(() => {
    fetchAnalyticsData();
  }, [period, selectedMachine]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get historical data for charts
      const endDate = new Date();
      const startDate = subDays(endDate, period === '24h' ? 1 : period === '7d' ? 7 : 30);
      
      const response = await ApiService.getSensorData({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        machineId: selectedMachine || undefined,
        limit: period === '24h' ? 48 : period === '7d' ? 168 : 720, // Hourly data
      });

      if (response.success) {
        // Group data by time intervals
        const groupedData = groupDataByInterval(response.data, period);
        setAnalyticsData(groupedData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupDataByInterval = (data: any[], period: string) => {
    const grouped: { [key: string]: any } = {};

    data.forEach((item) => {
      const date = new Date(item.timestamp);
      let key: string;

      if (period === '24h') {
        key = format(date, 'HH:mm');
      } else if (period === '7d') {
        key = format(date, 'MM/dd HH:00');
      } else {
        key = format(date, 'MM/dd');
      }

      if (!grouped[key]) {
        grouped[key] = {
          time: key,
          temperature: [],
          voltage: [],
          motorSpeed: [],
          heat: [],
          workingStatus: [],
        };
      }

      grouped[key].temperature.push(item.temperature);
      grouped[key].voltage.push(item.voltage);
      grouped[key].motorSpeed.push(item.motorSpeed);
      grouped[key].heat.push(item.heat);
      grouped[key].workingStatus.push(item.workingStatus ? 1 : 0);
    });

    // Calculate averages
    return Object.values(grouped).map((group: any) => ({
      time: group.time,
      temperature: group.temperature.reduce((a: number, b: number) => a + b, 0) / group.temperature.length,
      voltage: group.voltage.reduce((a: number, b: number) => a + b, 0) / group.voltage.length,
      motorSpeed: group.motorSpeed.reduce((a: number, b: number) => a + b, 0) / group.motorSpeed.length,
      heat: group.heat.reduce((a: number, b: number) => a + b, 0) / group.heat.length,
      uptime: (group.workingStatus.reduce((a: number, b: number) => a + b, 0) / group.workingStatus.length) * 100,
    }));
  };

  const uniqueMachines = Array.from(
    new Set(latestData.map((data) => data.machineId))
  ).sort();

  const machineStatusData = latestData.map((data) => ({
    name: data.machineId,
    status: data.workingStatus ? 1 : 0,
    temperature: data.temperature,
    voltage: data.voltage,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze trends and patterns in your sensor data.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as '24h' | '7d' | '30d')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Machine
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Machines</option>
                {uniqueMachines.map((machineId) => (
                  <option key={machineId} value={machineId}>
                    {machineId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Temperature
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.avgTemperature?.toFixed(1)}°C
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Voltage
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.avgVoltage?.toFixed(1)}V
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Motor Speed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.avgMotorSpeed?.toFixed(0)} RPM
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      System Uptime
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.uptime?.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Trend */}
        <div className="bg-white p-6 shadow sm:rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Temperature Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) : value}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}V`, 'Voltage']}
                />
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Motor Speed Trend */}
        <div className="bg-white p-6 shadow sm:rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Motor Speed Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) : value}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)} RPM`, 'Motor Speed']}
                />
                <Line
                  type="monotone"
                  dataKey="motorSpeed"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Status */}
        <div className="bg-white p-6 shadow sm:rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Current Machine Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="status" fill="#3b82f6" name="Status (Online = 1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;