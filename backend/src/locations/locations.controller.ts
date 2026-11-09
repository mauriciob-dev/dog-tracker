import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiKeyGuard } from "./api-key.guard";
import { CreateLocationDto } from "./create-location.dto";
import { LocationsService } from "./locations.service";

@Controller()
export class LocationsController {
  constructor(private readonly svc: LocationsService) {}

  @Post("locations")
  @UseGuards(ApiKeyGuard)
  @HttpCode(201)
  async create(@Body() dto: CreateLocationDto) {
    return (await this.svc.ingest(dto)) ?? { duplicate: true };
  }

  @Get("devices/last")
  last() {
    return this.svc.lastPositions();
  }

  @Get("devices/:id/track")
  track(
    @Param("id") id: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.track(id, from, to, limit ? Number(limit) : 1000);
  }
}
