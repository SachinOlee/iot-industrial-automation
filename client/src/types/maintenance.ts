// client/src/types/maintenance.ts
export interface MaintenanceAlert {
  _id: string;
  userId: string;
  machineId: string;
  alertType: 'temperature' | 'vibration' | 'wear' | 'failure_prediction' | 'maintenance_due';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  predictedFailureDate?: Date;
  confidence?: number;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
