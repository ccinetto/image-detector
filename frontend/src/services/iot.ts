import { mqtt, iot, auth } from 'aws-iot-device-sdk-v2';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const IDENTITY_POOL_ID = import.meta.env.VITE_IDENTITY_POOL_ID;
const IOT_ENDPOINT = import.meta.env.VITE_IOT_ENDPOINT;
const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';

export class IoTService {
  private connection: mqtt.MqttClientConnection | null = null;
  private listeners: Map<string, (event: string, data: any) => void> = new Map();

  async connect() {
    if (this.connection) return;

    console.log('[IoT] Connecting to IoT Core...');
    console.log('[IoT] Endpoint:', IOT_ENDPOINT);
    console.log('[IoT] Region:', REGION);

    const credentials = await fromCognitoIdentityPool({
      identityPoolId: IDENTITY_POOL_ID,
      clientConfig: { region: REGION },
    })();

    console.log('[IoT] Credentials obtained');

    const config = iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
      .with_clean_session(true)
      .with_client_id(`client-${Math.random().toString(36).substring(7)}`)
      .with_endpoint(IOT_ENDPOINT)
      .with_credentials(
        REGION,
        credentials.accessKeyId,
        credentials.secretAccessKey,
        credentials.sessionToken
      )
      .build();

    const client = new mqtt.MqttClient();
    this.connection = client.new_connection(config);

    try {
      await this.connection.connect();
      console.log('[IoT] Connected successfully');
    } catch (error) {
      console.error('[IoT] Connection failed:', error);
      throw error;
    }
  }

  async subscribe(gameId: string, callback: (event: string, data: any) => void) {
    if (!this.connection) await this.connect();

    const topic = `game/${gameId}`;
    
    await this.connection!.subscribe(
      topic,
      mqtt.QoS.AtLeastOnce,
      (topic, payload) => {
        const message = JSON.parse(new TextDecoder().decode(payload));
        console.log('[IoT] Event received:', message.event, message.data);
        callback(message.event, message.data);
      }
    );

    console.log('[IoT] Subscribed to topic:', topic);
    this.listeners.set(gameId, callback);
  }

  async unsubscribe(gameId: string) {
    if (!this.connection) return;

    const topic = `game/${gameId}`;
    await this.connection.unsubscribe(topic);
    this.listeners.delete(gameId);
  }

  async disconnect() {
    if (!this.connection) return;

    await this.connection.disconnect();
    this.connection = null;
    this.listeners.clear();
  }
}

export const iotService = new IoTService();
