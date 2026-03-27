// dto/link-mobile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

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

export class LinkProfileDto {
  @ApiProperty({ example: "email | mobile" })
  @IsString()
  type: 'email' | 'mobile';

  @ApiProperty({example:"8588398838"})
  @IsOptional()
  @IsString()
  @Length(10, 10)
  mobile?: string;

  @ApiProperty({example:"857335"})
  @IsOptional()
  @IsString()
  @Length(6, 6)
  otp?: string;

  @ApiProperty({ example: "abir@gmail.com" })
  @IsOptional()
  @IsString()
  email?: string

}