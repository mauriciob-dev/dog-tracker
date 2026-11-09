import { Module } from "@nestjs/common";
import { ApiKeyGuard } from "./api-key.guard";
import { LiveGateway } from "./live.gateway";
import { PositionsController } from "./positions.controller";
import { PositionsService } from "./positions.service";

@Module({
  controllers: [PositionsController],
  providers: [PositionsService, LiveGateway, ApiKeyGuard],
})
export class PositionsModule {}
