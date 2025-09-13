// client/src/components/dashboard/Analytics.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { format, subDays } from 'date-fns';
import useSensorData from '../../hooks/useSensorData';
import ApiService from '../../services/api';

const Analytics = () => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { analytics, latestData } = useSensorData();

  const fetchAnalyticsData = useCallback(async () => {
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
  }, [period, selectedMachine]);

 useEffect(() => {
   fetchAnalyticsData();
 }, [period, selectedMachine, fetchAnalyticsData]);

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
      temperature: group.temperature.length > 0 ? group.temperature.reduce((a: number, b: number) => a + b, 0) / group.temperature.length : 0,
      voltage: group.voltage.length > 0 ? group.voltage.reduce((a: number, b: number) => a + b, 0) / group.voltage.length : 0,
      motorSpeed: group.motorSpeed.length > 0 ? group.motorSpeed.reduce((a: number, b: number) => a + b, 0) / group.motorSpeed.length : 0,
      heat: group.heat.length > 0 ? group.heat.reduce((a: number, b: number) => a + b, 0) / group.heat.length : 0,
      uptime: group.workingStatus.length > 0 ? (group.workingStatus.reduce((a: number, b: number) => a + b, 0) / group.workingStatus.length) * 100 : 0,
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm shadow-xl sm:rounded-2xl border border-white/20">
        <div className="px-6 py-8 sm:p-8">
          <h1 className="text-3xl font-bold text-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-slate-600 text-lg">
            📊 Analyze trends and patterns in your IoT sensor data with interactive visualizations.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl sm:rounded-2xl border border-white/20">
        <div className="px-6 py-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center">
                ⏰ Time Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as '24h' | '7d' | '30d')}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-blue-300"
              >
                <option value="24h">📅 Last 24 Hours</option>
                <option value="7d">📊 Last 7 Days</option>
                <option value="30d">📈 Last 30 Days</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center">
                🏭 Machine Filter
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-blue-300"
              >
                <option value="">🌐 All Machines</option>
                {uniqueMachines.map((machineId) => (
                  <option key={machineId} value={machineId}>
                    ⚙️ {machineId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 overflow-hidden shadow-xl rounded-2xl border border-red-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-red-700 flex items-center">
                      🌡️ Average Temperature
                    </dt>
                    <dd className="text-3xl font-bold text-red-800 mt-2">
                      {analytics.avgTemperature?.toFixed(1)}°C
                    </dd>
                  </dl>
                </div>
                <div className="text-4xl opacity-20">🌡️</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 overflow-hidden shadow-xl rounded-2xl border border-yellow-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-yellow-700 flex items-center">
                      ⚡ Average Voltage
                    </dt>
                    <dd className="text-3xl font-bold text-yellow-800 mt-2">
                      {analytics.avgVoltage?.toFixed(1)}V
                    </dd>
                  </dl>
                </div>
                <div className="text-4xl opacity-20">⚡</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow-xl rounded-2xl border border-blue-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-blue-700 flex items-center">
                      ⚙️ Average Motor Speed
                    </dt>
                    <dd className="text-3xl font-bold text-blue-800 mt-2">
                      {analytics.avgMotorSpeed?.toFixed(0)} RPM
                    </dd>
                  </dl>
                </div>
                <div className="text-4xl opacity-20">⚙️</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow-xl rounded-2xl border border-green-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-green-700 flex items-center">
                      📈 System Uptime
                    </dt>
                    <dd className="text-3xl font-bold text-green-800 mt-2">
                      {analytics.uptime?.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
                <div className="text-4xl opacity-20">📈</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Temperature Trend */}
        <div className="bg-white/90 backdrop-blur-sm p-8 shadow-2xl sm:rounded-2xl border border-white/30 hover:shadow-3xl transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            <span className="text-3xl mr-3">🌡️</span>
            Temperature Trend Analysis
          </h3>
          <div className="h-72">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  formatter: (params: any) => {
                    const param = params[0];
                    return `${param.name}<br/>Temperature: ${param.value.toFixed(1)}°C`;
                  }
                },
                xAxis: {
                  type: 'category',
                  data: analyticsData.map(item => item.time),
                  axisLabel: {
                    rotate: 45,
                    fontSize: 12
                  }
                },
                yAxis: {
                  type: 'value',
                  name: 'Temperature (°C)',
                  nameTextStyle: {
                    fontSize: 12
                  }
                },
                series: [{
                  name: 'Temperature',
                  type: 'line',
                  data: analyticsData.map(item => item.temperature),
                  smooth: true,
                  symbol: 'circle',
                  symbolSize: 6,
                  lineStyle: {
                    color: '#ef4444',
                    width: 3
                  },
                  itemStyle: {
                    color: '#ef4444'
                  },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [{
                        offset: 0, color: 'rgba(239, 68, 68, 0.3)'
                      }, {
                        offset: 1, color: 'rgba(239, 68, 68, 0.1)'
                      }]
                    }
                  }
                }],
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '15%',
                  containLabel: true
                }
              }}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>

        {/* Motor Speed Trend */}
        <div className="bg-white/90 backdrop-blur-sm p-8 shadow-2xl sm:rounded-2xl border border-white/30 hover:shadow-3xl transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            <span className="text-3xl mr-3">⚙️</span>
            Motor Speed Performance
          </h3>
          <div className="h-72">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  formatter: (params: any) => {
                    const param = params[0];
                    return `${param.name}<br/>Motor Speed: ${param.value.toFixed(0)} RPM`;
                  }
                },
                xAxis: {
                  type: 'category',
                  data: analyticsData.map(item => item.time),
                  axisLabel: {
                    rotate: 45,
                    fontSize: 12
                  }
                },
                yAxis: {
                  type: 'value',
                  name: 'RPM',
                  nameTextStyle: {
                    fontSize: 12
                  }
                },
                series: [{
                  name: 'Motor Speed',
                  type: 'line',
                  data: analyticsData.map(item => item.motorSpeed),
                  smooth: true,
                  symbol: 'diamond',
                  symbolSize: 8,
                  lineStyle: {
                    color: '#8b5cf6',
                    width: 3
                  },
                  itemStyle: {
                    color: '#8b5cf6'
                  },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [{
                        offset: 0, color: 'rgba(139, 92, 246, 0.3)'
                      }, {
                        offset: 1, color: 'rgba(139, 92, 246, 0.1)'
                      }]
                    }
                  },
                  markPoint: {
                    data: [
                      {type: 'max', name: 'Max Speed'},
                      {type: 'min', name: 'Min Speed'}
                    ]
                  }
                }],
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '15%',
                  containLabel: true
                }
              }}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>

        {/* Machine Status */}
        <div className="bg-white/90 backdrop-blur-sm p-8 shadow-2xl sm:rounded-2xl border border-white/30 hover:shadow-3xl transition-all duration-300 lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
            <span className="text-3xl mr-3">🏭</span>
            Machine Status Overview
          </h3>
          <div className="h-72">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  formatter: (params: any) => {
                    const param = params[0];
                    const status = param.value === 1 ? 'Online' : 'Offline';
                    return `${param.name}<br/>Status: ${status}`;
                  }
                },
                xAxis: {
                  type: 'category',
                  data: machineStatusData.map(item => item.name),
                  axisLabel: {
                    rotate: 45,
                    fontSize: 12
                  }
                },
                yAxis: {
                  type: 'value',
                  name: 'Status',
                  nameTextStyle: {
                    fontSize: 12
                  },
                  max: 1,
                  min: 0
                },
                series: [{
                  name: 'Machine Status',
                  type: 'bar',
                  data: machineStatusData.map(item => ({
                    value: item.status,
                    itemStyle: {
                      color: item.status === 1 ? '#10b981' : '#ef4444'
                    }
                  })),
                  barWidth: '60%',
                  label: {
                    show: true,
                    position: 'top',
                    formatter: (params: any) => params.value === 1 ? 'ON' : 'OFF'
                  }
                }],
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '15%',
                  containLabel: true
                },
                legend: {
                  data: ['Online', 'Offline'],
                  top: 10
                }
              }}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;