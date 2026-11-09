import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiKeyGuard } from "./api-key.guard";
import { CreatePositionDto } from "./create-position.dto";
import { PositionsService } from "./positions.service";

@Controller("positions")
@UseGuards(ApiKeyGuard)
export class PositionsController {
  constructor(private readonly svc: PositionsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePositionDto) {
    return this.svc.create(dto);
  }

  @Get("latest")
  async latest(@Query("deviceId") deviceId?: string) {
    const p = await this.svc.latest(deviceId);
    if (!p) throw new NotFoundException("sin posiciones");
    return p;
  }

  @Get()
  history(@Query("limit") limit?: string, @Query("deviceId") deviceId?: string) {
    const n = Math.min(Math.max(Math.trunc(Number(limit)) || 100, 1), 1000);
    return this.svc.history(n, deviceId);
  }
}
