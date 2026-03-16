import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {

  @ApiProperty({
    example: "abir@gmail.com",
    required: false
  })
  email?: string;

  @ApiProperty({
    example: "8585838338",
    required: false
  })
  mobile?: string;

  @ApiPropertyOptional({
    example: "StrongPassword123"
  })
  password?: string;

  @ApiProperty({
    example: "Abir Sharma"
  })
  name: string;

  @ApiPropertyOptional({
    example: "Physics Wallah"
  })
  organization?: string;

}