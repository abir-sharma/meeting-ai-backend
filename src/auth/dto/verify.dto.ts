import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString, Matches } from "class-validator"

export class VerifyOtpDto {

  @ApiProperty({ example: "8585927441" })
  @Matches(/^\d{10}$/, { message: 'Mobile must be a 10-digit number' })
  @IsOptional()
  @IsString()
  mobile: string

  @ApiProperty({ example: "858323" })
  @IsString()
  otp: string
}