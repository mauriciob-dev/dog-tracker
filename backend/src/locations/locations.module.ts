import { Module } from "@nestjs/common";
import { LocationsController } from "./locations.controller";
import { LocationsGateway } from "./locations.gateway";
import { LocationsService } from "./locations.service";
import { MqttIngestService } from "./mqtt-ingest.service";
import { ApiKeyGuard } from "./api-key.guard";

@Module({
  controllers: [LocationsController],
  providers: [
    LocationsService,
    LocationsGateway,
    MqttIngestService,
    ApiKeyGuard,
  ],
})
export class LocationsModule {}
