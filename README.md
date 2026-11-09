# dog-tracker

Rastreador GPS en tiempo real para perros pinscher miniatura (uso urbano, Colombia).
Proyecto de aprendizaje y portafolio, con la meta de gastar lo mínimo (precios en COP).

```
ESP32 + 4G (LilyGO T-A7670SA)  --HTTP POST-->  Backend NestJS  -->  PostgreSQL + PostGIS
                                                     |
                                                     +--WebSocket-->  Mapa Leaflet (navegador)
```

## Estructura

| Carpeta | Contenido |
|---|---|
| `backend/` | API NestJS (TypeScript), WebSocket y mapa en `public/` |
| `firmware/` | PlatformIO, board `esp32dev`, framework Arduino (C++) |

## Estado por fases

1. GPS → backend: **hecha**
2. Persistencia PostGIS + mapa en vivo por WebSocket: **hecha, falta prueba con hardware**
3. Geocercas y alertas push
4. Batería (deep sleep, intervalos adaptativos) y carcasa
5. Comportamiento con acelerómetro
6. Camino a producto (PCB, homologación CRC, piloto)

## Backend

Requisitos: Node 20+, Docker.

```bash
cd backend
cp .env.example .env        # edita API_KEY (y DB_PORT / DATABASE_URL si 5432 está ocupado)
npm install
docker compose up -d --wait # PostGIS en 127.0.0.1
npm run start:dev           # http://localhost:3000
```

Abre `http://localhost:3000/` y escribe la clave cuando la pida.

### API

Todas las rutas exigen el header `x-api-key` (valor de `API_KEY`).

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/positions` | `{ lat, lon, speed?, hdop?, deviceId? }` (`deviceId` por defecto `perro1`). Rechaza lat/lon inválidos y (0,0) |
| GET | `/positions/latest` | Última posición |
| GET | `/positions?limit=` | Historial, más reciente primero (1–1000, por defecto 100) |
| WS | `/ws?key=API_KEY` | Emite cada posición nueva como JSON |

```bash
curl -H "x-api-key: $API_KEY" -H "content-type: application/json" \
  -d '{"lat":4.6097,"lon":-74.0817,"speed":1.2,"hdop":1.5}' \
  http://localhost:3000/positions
```

## Firmware

Hardware: LilyGO T-A7670SA R2 (ESP32 + 4G Cat-1 + GPS) con batería 18650.
Descarta fixes con HDOP ≥ 5 o posición (0,0) y envía cada 15 s.

```bash
cd firmware
cp include/secrets.h.example include/secrets.h   # URL del backend y API_KEY (ignorado por git)
pio run -t upload
```

## Seguridad

- No se versionan `.env`, `firmware/include/secrets.h`, URLs de túneles ni coordenadas reales.
- El WebSocket recibe la clave por query string: aceptable para uso personal, no para producto.
- Batería de litio 18650: usa protección y carga supervisada.
- GPS entre edificios da saltos: por eso se filtra por HDOP.
