CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS positions (
  id          BIGSERIAL PRIMARY KEY,
  device_id   TEXT NOT NULL,
  geom        GEOGRAPHY(Point, 4326) NOT NULL,
  speed       REAL,
  hdop        REAL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS positions_geom_idx ON positions USING GIST (geom);
CREATE INDEX IF NOT EXISTS positions_device_time_idx ON positions (device_id, recorded_at DESC);
