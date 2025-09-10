# mqtt_client.py
"""
MQTT Client for IoT Sensor Simulator
"""
import json
import logging
import time
import paho.mqtt.client as mqtt
from config import *

class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        self.connected = False
        self.logger = self.setup_logging()
        self.setup_callbacks()
        self.connect_to_broker()
        
    def setup_logging(self):
        """Setup logging for MQTT client"""
        logger = logging.getLogger('MQTTClient')
        logger.setLevel(getattr(logging, LOG_LEVEL))
        
        # Create handler if not exists
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
        
    def setup_callbacks(self):
        """Setup MQTT client callbacks"""
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.client.on_publish = self.on_publish
        
        # Setup authentication if provided
        if MQTT_USERNAME and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            
    def on_connect(self, client, userdata, flags, rc):
        """Callback for when client connects to MQTT broker"""
        if rc == 0:
            self.connected = True
            self.logger.info(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            # Subscribe to command topics if needed
            self.client.subscribe(f"iot/command/{MQTT_CLIENT_ID}")
        else:
            self.connected = False
            error_messages = {
                1: "Connection refused - incorrect protocol version",
                2: "Connection refused - invalid client identifier",
                3: "Connection refused - server unavailable",
                4: "Connection refused - bad username or password",
                5: "Connection refused - not authorised"
            }
            error_msg = error_messages.get(rc, f"Connection failed with code {rc}")
            self.logger.error(f"❌ MQTT connection failed: {error_msg}")
            
    def on_disconnect(self, client, userdata, rc):
        """Callback for when client disconnects from MQTT broker"""
        self.connected = False
        if rc != 0:
            self.logger.warning("🔄 Unexpected MQTT disconnection. Attempting to reconnect...")
            self.reconnect()
        else:
            self.logger.info("📱 Disconnected from MQTT broker")
            
    def on_message(self, client, userdata, msg):
        """Callback for when a message is received"""
        try:
            topic = msg.topic
            message = json.loads(msg.payload.decode())
            self.logger.info(f"📨 Received message on {topic}: {message}")
            
            # Handle commands if needed
            if "command" in topic:
                self.handle_command(message)
                
        except json.JSONDecodeError:
            self.logger.error(f"❌ Failed to decode message: {msg.payload}")
            
    def on_publish(self, client, userdata, mid):
        """Callback for when a message is published"""
        self.logger.debug(f"📤 Message published with ID: {mid}")
        
    def handle_command(self, command):
        """Handle incoming MQTT commands"""
        cmd_type = command.get('type')
        if cmd_type == 'stop_simulation':
            self.logger.info("🛑 Received stop command via MQTT")
            # You can implement command handling here
        elif cmd_type == 'change_interval':
            new_interval = command.get('interval', SIMULATION_INTERVAL)
            self.logger.info(f"⏱️ Received interval change command: {new_interval}s")
            
    def connect_to_broker(self):
        """Connect to MQTT broker"""
        try:
            self.logger.info(f"🔄 Connecting to MQTT broker {MQTT_BROKER}:{MQTT_PORT}...")
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.client.loop_start()
            
            # Wait for connection
            retry_count = 0
            while not self.connected and retry_count < 10:
                time.sleep(1)
                retry_count += 1
                
            if not self.connected:
                self.logger.error("❌ Failed to connect to MQTT broker within timeout")
                
        except Exception as e:
            self.logger.error(f"❌ Error connecting to MQTT broker: {e}")
            
    def reconnect(self):
        """Reconnect to MQTT broker"""
        try:
            self.client.reconnect()
        except Exception as e:
            self.logger.error(f"❌ Failed to reconnect: {e}")
            
    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
        self.logger.info("🔌 MQTT client disconnected")
        
    def publish(self, topic, message):
        """Publish message to MQTT topic"""
        if not self.connected:
            self.logger.warning("⚠️ Not connected to MQTT broker, cannot publish")
            return False
            
        try:
            result = self.client.publish(topic, message, qos=1)
            if result.rc == 0:
                return True
            else:
                self.logger.error(f"❌ Failed to publish message, return code: {result.rc}")
                return False
        except Exception as e:
            self.logger.error(f"❌ Error publishing message: {e}")
            return False

# api_client.py
"""
API Client for direct communication with IoT Industrial Automation backend
"""
import requests
import json
import logging
import time
from datetime import datetime
from config import *

class APIClient:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.session = requests.Session()
        self.token = None
        self.authenticated = False
        self.logger = self.setup_logging()
        
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'IoT-Simulator/1.0'
        })
        
        # Attempt to authenticate
        if API_USERNAME and API_PASSWORD:
            self.authenticate()
            
    def setup_logging(self):
        """Setup logging for API client"""
        logger = logging.getLogger('APIClient')
        logger.setLevel(getattr(logging, LOG_LEVEL))
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
        
    def authenticate(self):
        """Authenticate with the backend API"""
        try:
            self.logger.info(f"🔐 Authenticating with API: {self.base_url}")
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    'email': API_USERNAME,
                    'password': API_PASSWORD
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.token = data.get('token')
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.token}'
                    })
                    self.authenticated = True
                    self.logger.info("✅ Successfully authenticated with API")
                    return True
                else:
                    self.logger.error(f"❌ Authentication failed: {data.get('message')}")
            else:
                self.logger.error(f"❌ Authentication failed: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"❌ Network error during authentication: {e}")
        except Exception as e:
            self.logger.error(f"❌ Authentication error: {e}")
            
        self.authenticated = False
        return False
        
    def send_sensor_data(self, sensor_data):
        """Send sensor data to the backend API"""
        if not self.authenticated:
            self.logger.warning("⚠️ Not authenticated, attempting to authenticate...")
            if not self.authenticate():
                return False
                
        try:
            # Convert sensor data to API format
            api_data = {
                'machineId': sensor_data['machine_id'],
                'motorSpeed': sensor_data.get('motor_speed', 0),
                'voltage': sensor_data.get('voltage', 220),
                'temperature': sensor_data.get('temperature', 25),
                'heat': sensor_data.get('heat', 100),
                'workingStatus': sensor_data.get('working_status', True),
                'workingPeriod': sensor_data.get('working_period', 8)
            }
            
            response = self.session.post(
                f"{self.base_url}/sensor/data",
                json=api_data,
                timeout=10
            )
            
            if response.status_code == 201:
                self.logger.debug(f"📊 Sensor data sent successfully for {api_data['machineId']}")
                return True
            elif response.status_code == 401:
                # Token expired, try to re-authenticate
                self.logger.warning("🔄 Token expired, re-authenticating...")
                self.authenticated = False
                return self.send_sensor_data(sensor_data)  # Retry once
            else:
                self.logger.error(f"❌ Failed to send sensor data: HTTP {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            self.logger.error("⏱️ Timeout sending sensor data")
            return False
        except requests.exceptions.RequestException as e:
            self.logger.error(f"❌ Network error sending sensor data: {e}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Error sending sensor data: {e}")
            return False
            
    def get_machine_status(self, machine_id=None):
        """Get machine status from API"""
        if not self.authenticated:
            return None
            
        try:
            url = f"{self.base_url}/sensor/latest"
            if machine_id:
                url += f"?machineId={machine_id}"
                
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            else:
                self.logger.error(f"❌ Failed to get machine status: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            self.logger.error(f"❌ Error getting machine status: {e}")
            return None
            
    def get_maintenance_alerts(self):
        """Get maintenance alerts from API"""
        if not self.authenticated:
            return []
            
        try:
            response = self.session.get(
                f"{self.base_url}/sensor/alerts?resolved=false",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            else:
                self.logger.error(f"❌ Failed to get alerts: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"❌ Error getting alerts: {e}")
            return []
            
    def health_check(self) -> bool:
        """
        Check API health by making a GET request to the health endpoint.

        Returns:
            bool: True if API is healthy (status 200), False otherwise.
        """
        if not self.base_url:
            self.logger.error("❌ Base URL is not configured")
            return False

        health_url = f"{self.base_url.rstrip('/')}/health"
        try:
            response = self.session.get(health_url, timeout=5)
            if response.status_code == 200:
                self.logger.debug("✅ API health check passed")
                return True
            else:
                self.logger.warning(f"⚠️ API health check failed with status: {response.status_code}")
                return False
        except requests.exceptions.Timeout:
            self.logger.error("⏱️ Timeout occurred while checking API health")
            return False
        except requests.exceptions.ConnectionError:
            self.logger.error("🔌 Connection error while checking API health")
            return False
        except requests.exceptions.RequestException as e:
            self.logger.error(f"❌ Request error checking API health: {e}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Unexpected error checking API health: {e}")
            return False