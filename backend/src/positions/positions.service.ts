import { BadRequestException, Injectable } from "@nestjs/common";
import { Subject } from "rxjs";
import { DbService } from "../db/db.service";
import { CreatePositionDto } from "./create-position.dto";

export interface Position {
  id: string;
  deviceId: string;
  lat: number;
  lon: number;
  speed: number | null;
  hdop: number | null;
  recordedAt: string;
}

const COLS = `id, device_id AS "deviceId", ST_Y(geom::geometry) AS lat,
  ST_X(geom::geometry) AS lon, speed, hdop, recorded_at AS "recordedAt"`;

@Injectable()
export class PositionsService {
  readonly stream = new Subject<Position>();

  constructor(private readonly db: DbService) {}

  async create(dto: CreatePositionDto): Promise<Position> {
    if (dto.lat === 0 && dto.lon === 0)
      throw new BadRequestException("posición (0,0) rechazada");

    const rows = await this.db.query<Position>(
      `INSERT INTO positions (device_id, geom, speed, hdop)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5)
       RETURNING ${COLS}`,
      [dto.deviceId ?? "perro1", dto.lon, dto.lat, dto.speed ?? null, dto.hdop ?? null],
    );
    this.stream.next(rows[0]);
    return rows[0];
  }

  async latest(deviceId?: string): Promise<Position | null> {
    const rows = await this.db.query<Position>(
      `SELECT ${COLS} FROM positions
       WHERE ($1::text IS NULL OR device_id = $1)
       ORDER BY recorded_at DESC, id DESC LIMIT 1`,
      [deviceId ?? null],
    );
    return rows[0] ?? null;
  }

  history(limit: number, deviceId?: string): Promise<Position[]> {
    return this.db.query<Position>(
      `SELECT ${COLS} FROM positions
       WHERE ($1::text IS NULL OR device_id = $1)
       ORDER BY recorded_at DESC, id DESC LIMIT $2`,
      [deviceId ?? null, limit],
    );
  }
}
