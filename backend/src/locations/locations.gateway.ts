import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { LocationsService } from "./locations.service";

@WebSocketGateway({ namespace: "/live", cors: { origin: true } })
export class LocationsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Namespace;

  constructor(private readonly svc: LocationsService) {}

  afterInit() {
    this.svc.stream.subscribe((p) => this.server.emit("position", p));
  }

  async handleConnection(client: Socket) {
    client.emit("snapshot", await this.svc.lastPositions());
  }
}
