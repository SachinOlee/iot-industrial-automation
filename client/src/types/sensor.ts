// client/src/types/sensor.ts
export interface SensorData {
  _id: string;
  userId: string;
  machineId: string;
  motorSpeed: number;
  voltage: number;
  temperature: number;
  heat: number;
  workingStatus: boolean;
  workingPeriod: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorAnalytics {
  avgMotorSpeed: number;
  maxMotorSpeed: number;
  minMotorSpeed: number;
  avgVoltage: number;
  maxVoltage: number;
  minVoltage: number;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  avgHeat: number;
  maxHeat: number;
  minHeat: number;
  totalWorkingPeriod: number;
  totalReadings: number;
  uptime: number;
}