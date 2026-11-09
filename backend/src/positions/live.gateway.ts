import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer as WsServer } from "ws";
import { keyMatches } from "./api-key.guard";
import { PositionsService } from "./positions.service";

@WebSocketGateway({ path: "/ws" })
export class LiveGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly log = new Logger("WS");
  @WebSocketServer() server!: WsServer;

  constructor(private readonly svc: PositionsService) {}

  afterInit() {
    this.svc.stream.subscribe((p) => {
      const msg = JSON.stringify(p);
      for (const c of this.server.clients)
        if (c.readyState === WebSocket.OPEN) c.send(msg);
    });
  }

  handleConnection(client: WebSocket, req: IncomingMessage) {
    const key = new URL(req.url ?? "", "http://x").searchParams.get("key");
    if (!keyMatches(key)) {
      this.log.warn("conexión rechazada: clave inválida");
      client.close(1008, "unauthorized");
    }
  }
}
