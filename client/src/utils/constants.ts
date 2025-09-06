// client/src/utils/constants.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export const ALERT_TYPE_LABELS = {
  temperature: 'Temperature',
  vibration: 'Vibration',
  wear: 'Wear',
  failure_prediction: 'Failure Prediction',
  maintenance_due: 'Maintenance Due'
};

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;