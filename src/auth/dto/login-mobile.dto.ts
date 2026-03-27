// dto/mobile-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class MobileLoginDto {
  @ApiProperty({ example: "8948372881" })
  @IsString()
  @Length(10, 10)
  mobile: string;
}

export class LoginDto {
  @ApiProperty({ example: "email | mobile" })
  @IsString()
  type: 'email' | 'mobile';

  @ApiProperty({ example: "8948372881" })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  mobile?: string;

  @ApiProperty({ example: "abir@gmail.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "strongPassword98" })
  @IsOptional()
  @IsString()
  password?: string;
}