import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Subject } from "rxjs";
import { DbService } from "../db/db.service";
import { CreateLocationDto } from "./create-location.dto";

export interface Position {
  deviceId: string;
  ts: string;
  lat: number;
  lng: number;
  speed: number | null;
  sats: number | null;
  hdop: number | null;
  batteryMv: number | null;
}

const COLS = `device_id AS "deviceId", ts, lat, lng, speed, sats, hdop, battery_mv AS "batteryMv"`;

@Injectable()
export class LocationsService {
  readonly stream = new Subject<Position>();

  constructor(private readonly db: DbService) {}

  async ingest(dto: CreateLocationDto): Promise<Position | null> {
    await this.db.query(
      `INSERT INTO devices(id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [dto.deviceId],
    );

    const rows = await this.db.query<Position>(
      `INSERT INTO positions (device_id, ts, lat, lng, speed, sats, hdop, battery_mv)
       VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6, $7, $8)
       ON CONFLICT (device_id, ts) DO NOTHING
       RETURNING ${COLS}`,
      [
        dto.deviceId,
        dto.ts ?? null,
        dto.lat,
        dto.lng,
        dto.speed ?? null,
        dto.sats ?? null,
        dto.hdop ?? null,
        dto.batteryMv ?? null,
      ],
    );

    const pos = rows[0] ?? null; // null = duplicado (reintento del dispositivo)
    if (pos) this.stream.next(pos);
    return pos;
  }

  /** Para MQTT: valida un JSON crudo igual que el pipe HTTP. */
  async ingestRaw(raw: unknown) {
    const dto = plainToInstance(CreateLocationDto, raw);
    const errors = await validate(dto, { whitelist: true });
    if (errors.length) {
      throw new Error(
        errors
          .map((e) => Object.values(e.constraints ?? {}).join(","))
          .join("; "),
      );
    }
    return this.ingest(dto);
  }

  lastPositions() {
    return this.db.query<Position>(
      `SELECT DISTINCT ON (device_id) ${COLS} FROM positions ORDER BY device_id, ts DESC`,
    );
  }

  track(deviceId: string, from?: string, to?: string, limit = 1000) {
    return this.db.query<Position>(
      `SELECT ${COLS} FROM positions
       WHERE device_id = $1
         AND ts BETWEEN COALESCE($2::timestamptz, now() - interval '1 day')
                    AND COALESCE($3::timestamptz, now())
       ORDER BY ts DESC LIMIT $4`,
      [deviceId, from ?? null, to ?? null, Math.min(limit, 5000)],
    );
  }
}
