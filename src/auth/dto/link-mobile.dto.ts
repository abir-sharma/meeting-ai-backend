// dto/link-mobile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LinkMobileDto {
  @ApiProperty({example:"8588398838"})
  @IsString()
  @Length(10, 10)
  mobile: string;

  @ApiProperty({example:"857335"})
  @IsString()
  @Length(6, 6)
  otp: string;
}