// dto/mobile-signup.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MobileSignupDto {
  @ApiProperty({ example: "Abir sharma" })
  @IsString()
  name: string;

  @ApiProperty({ example: "8585838338" })
  @IsString()
  @Length(10, 10)
  mobile: string;
}