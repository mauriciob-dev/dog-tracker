import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const expected = process.env.DEVICE_API_KEY ?? "dev-key-change-me";
    if (req.headers["x-api-key"] !== expected)
      throw new UnauthorizedException();
    return true;
  }
}
