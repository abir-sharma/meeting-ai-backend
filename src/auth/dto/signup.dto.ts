import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator"

export class SignupDto {

  @ApiProperty({ example: "abir@gmail.com" })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string

  @ApiProperty({ example: "StrongPassword123" })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string

  @ApiProperty({ example: "Abir Sharma" })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string

  @ApiProperty({ example: "Physics Wallah" })
  @IsOptional()
  @IsString()
  organization?: string

  @ApiProperty({ example: "8585927441" })
  @Matches(/^\d{10}$/, { message: 'Mobile must be a 10-digit number' })
  @IsOptional()
  mobile?: string
}