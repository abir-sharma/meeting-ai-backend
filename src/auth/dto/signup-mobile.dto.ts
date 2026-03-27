// dto/mobile-signup.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class MobileSignupDto {
  @ApiProperty({ example: "Abir sharma" })
  @IsString()
  name: string;

  @ApiProperty({ example: "8585838338" })
  @IsString()
  @Length(10, 10)
  mobile: string;
}

export class SignupDto {
  @ApiProperty({ example: "email | mobile" })
  @IsString()
  type: 'email' | 'mobile';

  @ApiProperty({ example: "Abir sharma" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: "8585838338" })
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
  @MinLength(6)
  password?: string;
}