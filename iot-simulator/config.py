# config.py
"""
Configuration file for IoT Sensor Simulator
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MQTT Configuration
MQTT_BROKER = os.getenv('MQTT_BROKER', 'localhost')
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
MQTT_USERNAME = os.getenv('MQTT_USERNAME', '')
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', '')
MQTT_TOPIC = os.getenv('MQTT_TOPIC', 'iot/sensor/data')
MQTT_CLIENT_ID = os.getenv('MQTT_CLIENT_ID', 'iot_simulator')

# API Configuration for direct backend communication
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000/api')
API_USERNAME = os.getenv('API_USERNAME', 'user@iot.com')
API_PASSWORD = os.getenv('API_PASSWORD', 'User@123456')

# Machine Configuration
MACHINE_ID = os.getenv('MACHINE_ID', 'MACHINE-SIM-001')
MACHINE_IDS = [
    'MACHINE-SIM-001',
    'MACHINE-SIM-002', 
    'MACHINE-SIM-003',
    'MACHINE-SIM-004',
    'MACHINE-SIM-005'
]

# Sensor Configuration
SENSOR_TYPES = [
    'temperature',
    'pressure', 
    'vibration',
    'humidity'
]

# Additional sensors for industrial automation
INDUSTRIAL_SENSORS = [
    'motor_speed',
    'voltage', 
    'heat',
    'working_period'
]

# Simulation Settings
SIMULATION_INTERVAL = int(os.getenv('SIMULATION_INTERVAL', 10))  # seconds
MAX_MACHINES = int(os.getenv('MAX_MACHINES', 3))
ENABLE_ANOMALIES = os.getenv('ENABLE_ANOMALIES', 'true').lower() == 'true'
ANOMALY_PROBABILITY = float(os.getenv('ANOMALY_PROBABILITY', 0.05))  # 5% chance

# Communication Mode
USE_MQTT = os.getenv('USE_MQTT', 'false').lower() == 'true'
USE_API = os.getenv('USE_API', 'true').lower() == 'true'

# Sensor Value Ranges and Thresholds
SENSOR_RANGES = {
    'temperature': {
        'min': 20, 'max': 95, 'normal_max': 80, 
        'unit': '°C', 'noise': 0.5
    },
    'pressure': {
        'min': 900, 'max': 1100, 'normal_max': 1050, 
        'unit': 'hPa', 'noise': 2.0
    },
    'vibration': {
        'min': 0, 'max': 15, 'normal_max': 8, 
        'unit': 'mm/s', 'noise': 0.1
    },
    'humidity': {
        'min': 20, 'max': 95, 'normal_max': 85, 
        'unit': '%', 'noise': 1.0
    },
    'motor_speed': {
        'min': 0, 'max': 3500, 'normal_max': 3000, 
        'unit': 'RPM', 'noise': 10
    },
    'voltage': {
        'min': 180, 'max': 260, 'normal_max': 245, 
        'unit': 'V', 'noise': 1.0
    },
    'heat': {
        'min': 40, 'max': 160, 'normal_max': 130, 
        'unit': 'units', 'noise': 2.0
    },
    'working_period': {
        'min': 0, 'max': 24, 'normal_max': 16, 
        'unit': 'hours', 'noise': 0.1
    }
}

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'iot_simulator.log')
