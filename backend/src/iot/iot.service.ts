import { Injectable } from '@nestjs/common';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';

@Injectable()
export class IotService {
  private client: IoTDataPlaneClient;

  constructor() {
    this.client = new IoTDataPlaneClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
  }

  async publishGameEvent(gameId: string, event: string, data: any) {
    try {
      await this.client.send(
        new PublishCommand({
          topic: `game/${gameId}`,
          payload: Buffer.from(JSON.stringify({ event, data, timestamp: Date.now() })),
          qos: 0,
        }),
      );
    } catch (error) {
      console.error('Failed to publish IoT event:', error);
    }
  }
}
