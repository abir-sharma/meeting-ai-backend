import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsEnum } from 'class-validator';

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  PAIRED = 'PAIRED',
}

export class CreateDeviceDto {

  @ApiProperty({
    example: 'device-abc123',
    description: 'Unique device identifier',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    example: 'Conference Room Speaker',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '65f123abc45de67890123456',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  pairedUserId?: string;

  @ApiProperty({
    enum: DeviceStatus,
    example: DeviceStatus.OFFLINE,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}