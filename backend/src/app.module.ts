import { Module } from "@nestjs/common";
import { DbModule } from "./db/db.module";
import { PositionsModule } from "./positions/positions.module";

@Module({ imports: [DbModule, PositionsModule] })
export class AppModule {}
