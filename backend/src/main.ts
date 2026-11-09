import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { WsAdapter } from "@nestjs/platform-ws";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  if (!process.env.API_KEY || !process.env.DATABASE_URL)
    throw new Error("Faltan API_KEY y/o DATABASE_URL en .env");

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), "public"));
  const port = process.env.PORT ?? 3000;
  await app.listen(port, "0.0.0.0");
  console.log(`API lista en http://localhost:${port}`);
}
bootstrap();
