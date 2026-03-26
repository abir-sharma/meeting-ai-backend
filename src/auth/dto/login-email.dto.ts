// dto/email-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class EmailLoginDto {
  @ApiProperty({ example: "abir@gmail.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "strongPassword98" })
  @IsString()
  password: string;
}