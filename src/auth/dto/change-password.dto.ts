import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class ChangePasswordDto {

  @ApiProperty({
    example: "OldPassword123",
    description: "Current password"
  })
  @IsString()
  currentPassword: string


  @ApiProperty({
    example: "NewStrongPassword123",
    description: "New password"
  })
  @IsString()
  @Length(6, 50)
  newPassword: string

}