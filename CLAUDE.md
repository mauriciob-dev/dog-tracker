# Rastreador GPS para perros (dog-tracker)

Proyecto de aprendizaje, portafolio y posible producto en Colombia (precios en COP, gastar lo mínimo).
Rastreador en tiempo real para 3 perros pinscher miniatura (4-5 kg), uso urbano en Soacha.

## Estructura
- backend/  → NestJS (TypeScript)
- firmware/ → PlatformIO, board esp32dev, framework arduino (C++)

## Hardware (validado en Fase 1)
- LilyGO T-A7670SA R2 (ESP32 + 4G Cat-1 + GPS integrado), batería 18650.
- Pines: TX=26, RX=27, PWRKEY=4, POWERON=12, RESET=5. UART 115200.
- Encendido: preguntar AT primero; si no responde, UN solo pulso PWRKEY de 1,2 s.
- Operador Claro (732101), APN internet.comcel.com.co.
- GPS: AT+CGNSSPWR=1 y AT+CGNSSINFO. Lat/lon en grados decimales (no ddmm.mmmm).
  Campos: p[5]=lat, p[6]=N/S, p[7]=lon, p[8]=E/W, p[12]=velocidad, p[15]=HDOP.
- Filtro: descartar HDOP >= 5 y posición (0,0).
- Envío HTTP: AT+HTTPINIT/HTTPPARA/HTTPDATA/HTTPACTION=1, header x-api-key vía USERDATA.
- Intervalo actual: 15 s fijo (sin deep sleep todavía).

## Backend actual
- POST /positions, GET /positions/latest, GET /positions.
- Valida lat/lon, rechaza (0,0), protegido con x-api-key (env API_KEY).
- Expuesto con Cloudflare Tunnel (URL temporal).

## Fases
1. GPS → backend (HECHA)
2. Persistencia PostgreSQL+PostGIS + mapa en vivo WebSocket (EN CURSO)
3. Geocercas y alertas push
4. Batería (deep sleep, intervalos adaptativos) y carcasa
5. Comportamiento con acelerómetro (IA)
6. Camino a producto (PCB, homologación CRC, piloto)

## Reglas
- Respuestas en español, pasos cortos, código completo.
- Advertir riesgos: batería de litio, GPS entre edificios (saltos, filtrar por HDOP).
- NUNCA commitear .env, claves, URLs del túnel ni coordenadas reales de mi casa.
- No tocar el firmware salvo que la tarea lo pida; el firmware actual debe seguir funcionando sin cambios.