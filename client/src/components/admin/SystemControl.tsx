// client/src/components/admin/SystemControl.tsx
import React, { useState, useEffect } from "react";
import {
  CogIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import ApiService from "../../services/api";
import toast from "react-hot-toast";

const SystemControl: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState({
    iotSimulator: false,
    mlService: false,
    database: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await ApiService.getSystemStats();
      if (response.success) {
        setSystemStatus(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching system status:", error);
    }
  };

  const toggleService = async (service: string) => {
    setLoading(true);
    try {
      // Mock implementation - in real app this would call the API
      toast.success(`${service} toggled successfully`);
      fetchSystemStatus();
    } catch (error: any) {
      toast.error(`Error toggling ${service}`);
    } finally {
      setLoading(false);
    }
  };

  const restartSystem = async () => {
    setLoading(true);
    try {
      // Mock implementation - in real app this would call the API
      toast.success("System restarted successfully");
      fetchSystemStatus();
    } catch (error: any) {
      toast.error("Error restarting system");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                System Control
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage system services and components
              </p>
            </div>
            <button
              onClick={restartSystem}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Restart System
            </button>
          </div>
        </div>
      </div>

      {/* Services Control */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* IoT Simulator */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    IoT Simulator
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {systemStatus.iotSimulator ? "Running" : "Stopped"}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-5">
              <button
                onClick={() => toggleService("iotSimulator")}
                disabled={loading}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                  systemStatus.iotSimulator
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
              >
                {systemStatus.iotSimulator ? (
                  <>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ML Service */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    ML Service
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {systemStatus.mlService ? "Running" : "Stopped"}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-5">
              <button
                onClick={() => toggleService("mlService")}
                disabled={loading}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                  systemStatus.mlService
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
              >
                {systemStatus.mlService ? (
                  <>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Database
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {systemStatus.database ? "Connected" : "Disconnected"}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-5">
              <button
                onClick={() => toggleService("database")}
                disabled={loading}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                  systemStatus.database
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
              >
                {systemStatus.database ? (
                  <>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemControl;
