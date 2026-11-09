import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { connect, MqttClient } from "mqtt";
import { LocationsService } from "./locations.service";

@Injectable()
export class MqttIngestService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("MQTT");
  private client?: MqttClient;

  constructor(private readonly svc: LocationsService) {}

  onModuleInit() {
    const url = process.env.MQTT_URL;
    if (!url) return this.log.log("MQTT desactivado (sin MQTT_URL)");

    this.client = connect(url, {
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS,
    });
    this.client.on("connect", () => {
      this.client!.subscribe("dogs/+/location", { qos: 1 });
      this.log.log("Suscrito a dogs/+/location");
    });
    this.client.on("error", (e) => this.log.warn(e.message));
    this.client.on("message", async (topic, payload) => {
      const deviceId = topic.split("/")[1]; // el id sale del topic, no del payload
      try {
        await this.svc.ingestRaw({
          ...JSON.parse(payload.toString()),
          deviceId,
        });
      } catch (e: any) {
        this.log.warn(`${topic}: ${e.message}`);
      }
    });
  }

  onModuleDestroy() {
    this.client?.end();
  }
}
