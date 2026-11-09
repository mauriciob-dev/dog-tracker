import { io } from "socket.io-client";

const s = io(process.env.WS_URL ?? "http://localhost:3000/live");
s.on("connect", () => console.log("conectado"));
s.on("snapshot", (list) => console.log("snapshot:", list));
s.on("position", (p) => console.log("position:", p.deviceId, p.lat, p.lng));
