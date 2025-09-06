#!/usr/bin/env python3
"""
IoT Sensor Simulator
Simulates sensor data and publishes to MQTT broker
"""

import time
import random
import json
from datetime import datetime
from config import *
from mqtt_client import MQTTClient

class SensorSimulator:
    def __init__(self):
        self.mqtt_client = MQTTClient()
        self.running = False

    def generate_sensor_data(self, sensor_type):
        """Generate random sensor data based on type"""
        if sensor_type == "temperature":
            return round(random.uniform(20, 80), 2)
        elif sensor_type == "pressure":
            return round(random.uniform(900, 1100), 2)
        elif sensor_type == "vibration":
            return round(random.uniform(0, 10), 2)
        elif sensor_type == "humidity":
            return round(random.uniform(30, 90), 2)
        return 0

    def simulate(self):
        """Main simulation loop"""
        self.running = True
        print("Starting sensor simulation...")

        while self.running:
            for sensor_type in SENSOR_TYPES:
                data = {
                    "sensor_type": sensor_type,
                    "value": self.generate_sensor_data(sensor_type),
                    "timestamp": datetime.now().isoformat(),
                    "machine_id": "machine_001"
                }

                self.mqtt_client.publish(MQTT_TOPIC, json.dumps(data))
                print(f"Published {sensor_type}: {data['value']}")

            time.sleep(SIMULATION_INTERVAL)

    def stop(self):
        """Stop the simulation"""
        self.running = False
        self.mqtt_client.disconnect()

if __name__ == "__main__":
    simulator = SensorSimulator()
    try:
        simulator.simulate()
    except KeyboardInterrupt:
        simulator.stop()
        print("Simulation stopped")