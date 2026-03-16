import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Length, Matches } from "class-validator";

export class SendOtpDto {
  @ApiProperty({
    example: "8585838338"
  })
  @IsString()
  @Length(10, 10)
  mobile: string
}