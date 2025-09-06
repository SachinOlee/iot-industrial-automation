#!/usr/bin/env python3
"""
MQTT Client for IoT Simulator
"""

import paho.mqtt.client as mqtt
from config import MQTT_BROKER, MQTT_PORT

class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
        self.client.loop_start()

    def publish(self, topic, message):
        """Publish message to topic"""
        self.client.publish(topic, message)

    def disconnect(self):
        """Disconnect from broker"""
        self.client.loop_stop()
        self.client.disconnect()