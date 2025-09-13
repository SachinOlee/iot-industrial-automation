# Enhanced sensor_simulator.py
#!/usr/bin/env python3
"""
Enhanced IoT Sensor Simulator
Simulates realistic industrial sensor data with trends, anomalies, and machine states
"""

import time
import random
import json
import sys
import signal
import threading
import logging
from datetime import datetime, timedelta
from config import *
from mqtt_client import MQTTClient, APIClient

class SensorSimulator:
    def __init__(self):
        self.mqtt_client = None
        self.api_client = None
        self.running = False
        self.machine_states = {}
        
        # Setup logging
        self.setup_logging()
        
        # Initialize clients based on configuration
        self.setup_clients()
        
        # Initialize machine states
        self.initialize_machine_states()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=getattr(logging, LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(LOG_FILE),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('SensorSimulator')
        
    def setup_clients(self):
        """Initialize MQTT and API clients based on configuration"""
        if USE_MQTT:
            self.logger.info("🔄 Initializing MQTT client...")
            self.mqtt_client = MQTTClient()
            
        if USE_API:
            self.logger.info("🔄 Initializing API client...")
            self.api_client = APIClient()
            
        if not USE_MQTT and not USE_API:
            self.logger.warning("⚠️ No communication method enabled! Enable MQTT or API in config.")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.logger.info("🛑 Received shutdown signal, stopping simulation...")
        self.stop()
        sys.exit(0)
    
    def initialize_machine_states(self):
        """Initialize realistic machine states"""
        for i, machine_id in enumerate(MACHINE_IDS[:MAX_MACHINES]):
            # Create realistic baseline values for each machine
            base_temp = random.uniform(45, 65)  # Different baseline temperatures
            base_voltage = random.uniform(215, 235)  # Slightly different voltage levels
            
            self.machine_states[machine_id] = {
                'temperature': base_temp,
                'pressure': random.uniform(980, 1020),
                'vibration': random.uniform(1, 3),
                'humidity': random.uniform(45, 65),
                'motor_speed': random.uniform(1800, 2200),
                'voltage': base_voltage,
                'heat': random.uniform(80, 120),
                'working_period': random.uniform(6, 10),
                'working_status': True,
                'last_maintenance': datetime.now() - timedelta(days=random.randint(1, 90)),
                'anomaly_trend': 0,  # Tracks anomaly development
                'degradation_factor': random.uniform(0.98, 1.02)  # Simulates machine wear
            }
            
        self.logger.info(f"🏭 Initialized {len(self.machine_states)} machine states")
    
    def generate_sensor_data(self, sensor_type):
        """Generate random sensor data based on type (legacy method)"""
        sensor_config = SENSOR_RANGES.get(sensor_type, SENSOR_RANGES['temperature'])
        return round(random.uniform(sensor_config['min'], sensor_config['max']), 2)
    
    def generate_realistic_value(self, machine_id, sensor_type):
        """Generate realistic sensor values with trends and machine-specific characteristics"""
        if machine_id not in self.machine_states:
            return self.generate_sensor_data(sensor_type)
            
        machine = self.machine_states[machine_id]
        sensor_config = SENSOR_RANGES.get(sensor_type, {})
        
        # Get current value or initialize with random baseline
        current_value = machine.get(sensor_type, 
                                  random.uniform(sensor_config.get('min', 0), 
                                               sensor_config.get('max', 100)))
        
        # Calculate time-based degradation
        days_since_maintenance = (datetime.now() - machine['last_maintenance']).days
        degradation_factor = 1 + (days_since_maintenance * 0.001)  # Gradual increase over time
        
        # Add realistic drift and noise
        drift = random.uniform(-0.02, 0.02) * current_value  # 2% drift
        noise = random.uniform(-sensor_config.get('noise', 1), 
                              sensor_config.get('noise', 1))
        
        # Calculate new value
        new_value = current_value + drift + noise
        
        # Apply degradation for certain sensors
        if sensor_type in ['temperature', 'heat', 'vibration']:
            new_value *= degradation_factor
            
        # Handle anomalies
        if ENABLE_ANOMALIES and random.random() < ANOMALY_PROBABILITY:
            new_value = self.generate_anomaly(sensor_type, new_value, machine)
            
        # Ensure value stays within bounds
        new_value = max(sensor_config.get('min', 0), 
                       min(sensor_config.get('max', 100), new_value))
        
        # Update machine state
        machine[sensor_type] = new_value
        
        return round(new_value, 2)
    
    def generate_anomaly(self, sensor_type, normal_value, machine):
        """Generate anomalous values"""
        sensor_config = SENSOR_RANGES.get(sensor_type, {})
        
        # Increase anomaly trend
        machine['anomaly_trend'] = min(1.0, machine['anomaly_trend'] + 0.1)
        
        # Generate different types of anomalies
        anomaly_type = random.choice(['spike', 'drift', 'critical'])
        
        if anomaly_type == 'spike':
            # Sudden spike in value
            multiplier = random.uniform(1.2, 1.8)
            anomaly_value = normal_value * multiplier
        elif anomaly_type == 'drift':
            # Gradual drift towards critical values
            critical_value = sensor_config.get('normal_max', sensor_config.get('max', 100))
            anomaly_value = normal_value + (critical_value - normal_value) * 0.3
        else:  # critical
            # Critical value that should trigger alerts
            anomaly_value = random.uniform(
                sensor_config.get('normal_max', 80),
                sensor_config.get('max', 100)
            )
            
        self.logger.warning(f"⚠️ Anomaly generated for {sensor_type}: {anomaly_value:.2f}")
        return anomaly_value
    
    def add_sensor_noise(self, value, sensor_type):
        """Add realistic noise to sensor readings"""
        sensor_config = SENSOR_RANGES.get(sensor_type, {'noise': 0.5})
        noise = random.uniform(-sensor_config['noise'], sensor_config['noise'])
        return round(value + noise, 2)
    
    def simulate_sensor_drift(self, base_value, sensor_type):
        """Simulate gradual sensor drift over time"""
        drift_rates = {
            "temperature": 0.01,
            "pressure": 0.05,
            "vibration": 0.005,
            "humidity": 0.02,
            "motor_speed": 0.1,
            "voltage": 0.05,
            "heat": 0.02
        }
        
        drift = random.uniform(-drift_rates.get(sensor_type, 0.01), 
                              drift_rates.get(sensor_type, 0.01))
        return base_value + drift
    
    def create_sensor_payload(self, machine_id, sensor_type, value):
        """Create a complete sensor data payload"""
        sensor_config = SENSOR_RANGES.get(sensor_type, {})
        
        return {
            "sensor_type": sensor_type,
            "value": value,
            "timestamp": datetime.now().isoformat(),
            "machine_id": machine_id,
            "unit": sensor_config.get('unit', ''),
            "status": self.get_sensor_status(sensor_type, value),
            "quality": self.get_data_quality(),
            "location": f"Factory Floor - Station {machine_id.split('-')[-1]}"
        }
    
    def create_industrial_payload(self, machine_id):
        """Create complete industrial sensor payload for API"""
        machine = self.machine_states.get(machine_id, {})
        
        # Generate all required sensor values
        temperature = self.generate_realistic_value(machine_id, 'temperature')
        motor_speed = self.generate_realistic_value(machine_id, 'motor_speed')
        voltage = self.generate_realistic_value(machine_id, 'voltage')
        heat = self.generate_realistic_value(machine_id, 'heat')
        working_period = self.generate_realistic_value(machine_id, 'working_period')
        
        # Determine working status based on sensor values and random factors
        working_status = machine.get('working_status', True)
        if random.random() < 0.02:  # 2% chance of status change
            working_status = not working_status
            machine['working_status'] = working_status
            
        # If machine is not working, adjust some values
        if not working_status:
            motor_speed = 0
            voltage = random.uniform(0, 50)  # Standby voltage
            working_period = 0
            heat = temperature  # Heat equals ambient temperature when off
            
        return {
            'machine_id': machine_id,
            'motor_speed': motor_speed,
            'voltage': voltage,
            'temperature': temperature,
            'heat': heat,
            'working_status': working_status,
            'working_period': working_period,
            'timestamp': datetime.now().isoformat(),
            'additional_sensors': {
                'pressure': self.generate_realistic_value(machine_id, 'pressure'),
                'vibration': self.generate_realistic_value(machine_id, 'vibration'),
                'humidity': self.generate_realistic_value(machine_id, 'humidity')
            }
        }
    
    def get_unit(self, sensor_type):
        """Get the measurement unit for sensor type"""
        sensor_config = SENSOR_RANGES.get(sensor_type, {})
        return sensor_config.get('unit', '')
    
    def get_sensor_status(self, sensor_type, value):
        """Check if sensor value is within normal range"""
        sensor_config = SENSOR_RANGES.get(sensor_type, {})
        normal_max = sensor_config.get('normal_max', sensor_config.get('max', 100))
        
        if value > normal_max:
            return "critical"
        elif value > normal_max * 0.9:
            return "warning"
        else:
            return "normal"
    
    def get_data_quality(self):
        """Simulate data quality metrics"""
        return random.choice(["good", "good", "good", "fair", "excellent"])
    
    def is_value_normal(self, sensor_type, value):
        """Check if sensor value is within normal range (legacy method)"""
        sensor_config = SENSOR_RANGES.get(sensor_type, {})
        normal_max = sensor_config.get('normal_max', 100)
        return value <= normal_max
    
    def log_machine_status(self, machine_id, payload):
        """Log current machine status with visual indicators"""
        status_icon = "🟢" if payload['working_status'] else "🔴"
        temp_icon = "🔥" if payload['temperature'] > 80 else "🌡️"
        voltage_icon = "⚡" if payload['voltage'] < 200 or payload['voltage'] > 250 else "🔋"
        
        if payload['working_status']:
            self.logger.info(
                f"{status_icon} {machine_id} | "
                f"{temp_icon} {payload['temperature']:.1f}°C | "
                f"{voltage_icon} {payload['voltage']:.1f}V | "
                f"🔄 {payload['motor_speed']:.0f}RPM | "
                f"🔥 {payload['heat']:.1f} | "
                f"⏱️ {payload['working_period']:.1f}h"
            )
        else:
            self.logger.info(f"{status_icon} {machine_id} | OFFLINE")
    
    def simulate(self):
        """Main simulation loop"""
        self.running = True
        self.logger.info("🚀 Starting IoT sensor simulation...")
        self.logger.info(f"📊 Simulating {MAX_MACHINES} machines")
        self.logger.info(f"⏱️ Update interval: {SIMULATION_INTERVAL} seconds")
        self.logger.info(f"📡 MQTT enabled: {USE_MQTT}")
        self.logger.info(f"🌐 API enabled: {USE_API}")
        self.logger.info(f"⚠️ Anomalies enabled: {ENABLE_ANOMALIES}")
        self.logger.info("-" * 60)
        
        # Wait for connections if using MQTT
        if USE_MQTT and self.mqtt_client:
            retry_count = 0
            while not self.mqtt_client.connected and retry_count < 10:
                self.logger.info("⏳ Waiting for MQTT connection...")
                time.sleep(1)
                retry_count += 1
            
            if not self.mqtt_client.connected:
                self.logger.error("❌ Failed to connect to MQTT broker")
                if not USE_API:
                    self.logger.error("❌ No communication method available. Exiting.")
                    return
        
        # Check API health if using API
        if USE_API and self.api_client:
            if not self.api_client.health_check():
                self.logger.warning("⚠️ API health check failed")
            
        iteration_count = 0
        last_status_report = time.time()
        
        try:
            while self.running:
                # Simulation loop body - to be implemented
                pass
        except Exception as e:
            self.logger.error(f"Error in simulation: {e}")
        finally:
            self.logger.info("Simulation stopped")