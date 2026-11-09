import { connect } from "mqtt";

const API = process.env.API_URL ?? "http://localhost:3000";
const KEY = process.env.DEVICE_API_KEY ?? "dev-key-change-me";
const MODE = process.env.MODE ?? "http"; // http | mqtt
const MQTT_URL = process.env.MQTT_URL ?? "mqtt://localhost:1883";
const INTERVAL_S = Number(process.env.INTERVAL_S ?? 5);
const CENTER = {
  lat: Number(process.env.LAT ?? 4.5794),
  lng: Number(process.env.LNG ?? -74.2168),
};
const RADIUS_M = 150;
const M_PER_DEG = 111_320;

interface Dog {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  battery: number;
}

const dogs: Dog[] = ["perro-1", "perro-2", "perro-3"].map((id, i) => ({
  id,
  lat: CENTER.lat + (i - 1) * 0.0002,
  lng: CENTER.lng + (i - 1) * 0.0002,
  heading: Math.random() * Math.PI * 2,
  battery: 4150 - i * 20,
}));

const mqttClient = MODE === "mqtt" ? connect(MQTT_URL) : null;

function step(d: Dog) {
  const north = (d.lat - CENTER.lat) * M_PER_DEG;
  const east =
    (d.lng - CENTER.lng) * M_PER_DEG * Math.cos((CENTER.lat * Math.PI) / 180);

  if (Math.hypot(north, east) > RADIUS_M)
    d.heading = Math.atan2(-east, -north); // volver al centro
  else d.heading += (Math.random() - 0.5) * 1.2;

  const speed = Math.random() < 0.2 ? 0 : 0.5 + Math.random() * 1.5; // m/s, a veces parado
  const dist = speed * INTERVAL_S;
  d.lat += (dist * Math.cos(d.heading)) / M_PER_DEG;
  d.lng +=
    (dist * Math.sin(d.heading)) /
    (M_PER_DEG * Math.cos((CENTER.lat * Math.PI) / 180));
  d.battery = Math.max(3300, d.battery - 1);

  return {
    deviceId: d.id,
    ts: new Date().toISOString(),
    lat: Number(d.lat.toFixed(6)),
    lng: Number(d.lng.toFixed(6)),
    speed: Number(speed.toFixed(2)),
    sats: 6 + Math.floor(Math.random() * 6),
    hdop: Number((0.8 + Math.random() * 1.5).toFixed(1)),
    batteryMv: d.battery,
  };
}

async function send(p: ReturnType<typeof step>) {
  if (mqttClient) {
    mqttClient.publish(`dogs/${p.deviceId}/location`, JSON.stringify(p), {
      qos: 1,
    });
  } else {
    const r = await fetch(`${API}/locations`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY },
      body: JSON.stringify(p),
    });
    if (!r.ok) console.warn(p.deviceId, r.status, await r.text());
  }
  console.log(
    `${p.deviceId} ${p.lat},${p.lng} v=${p.speed}m/s bat=${p.batteryMv}mV`,
  );
}

console.log(`Simulando 3 perros (${MODE}) cada ${INTERVAL_S}s...`);
setInterval(
  () =>
    dogs.forEach((d) => send(step(d)).catch((e) => console.warn(e.message))),
  INTERVAL_S * 1000,
);
