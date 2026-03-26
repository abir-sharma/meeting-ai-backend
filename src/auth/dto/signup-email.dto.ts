// dto/email-signup.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class EmailSignupDto {
  @ApiProperty({ example: "abir@gmail.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "strongPassword98" })
  @IsString()
  @MinLength(6)
  password: string;
}