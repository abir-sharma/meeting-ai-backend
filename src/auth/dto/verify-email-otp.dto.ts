import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString, Matches } from "class-validator"

export class VerifyEmailOtpDto {

  @ApiProperty({ example: "abir@gmail.com" })
  @IsString()
  email: string

  @ApiProperty({ example: "858323" })
  @IsString()
  otp: string

}
