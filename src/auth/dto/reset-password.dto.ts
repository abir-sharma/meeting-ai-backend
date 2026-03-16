import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Length } from 'class-validator'

export class ResetPasswordDto {

  @ApiProperty({
    example: "abir@example.com",
    description: "Registered user email"
  })
  @IsEmail()
  email: string


  @ApiProperty({
    example: "1234",
    description: "OTP received on email"
  })
  @IsString()
  @Length(4, 6)
  otp: string


  @ApiProperty({
    example: "NewStrongPassword123",
    description: "New password"
  })
  @IsString()
  @Length(6, 50)
  newPassword: string

}