// dto/mobile-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MobileLoginDto {
  @ApiProperty({ example: "8948372881" })
  @IsString()
  @Length(10, 10)
  mobile: string;
}