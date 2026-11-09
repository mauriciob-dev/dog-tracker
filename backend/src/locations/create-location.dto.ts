import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateLocationDto {
  @IsString()
  @Length(1, 32)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  deviceId!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @IsISO8601()
  ts?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  speed?: number; // m/s

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(64)
  sats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hdop?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  batteryMv?: number;
}
