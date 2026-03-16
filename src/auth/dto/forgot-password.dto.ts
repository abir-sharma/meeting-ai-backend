import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

export class ForgotPasswordDto {

  @ApiProperty({
    example: "abir@example.com",
    description: "Registered user email address"
  })
  @IsEmail()
  email: string

}