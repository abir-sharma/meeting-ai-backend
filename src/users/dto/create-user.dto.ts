import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {

  @ApiPropertyOptional({
    example: "abir@gmail.com",
  })
  email?: string;

  @ApiPropertyOptional({
    example: "8585838338",
  })
  mobile?: string;

  @ApiPropertyOptional({
    example: "StrongPassword123"
  })
  password?: string;

  @ApiPropertyOptional({   // ✅ FIX HERE
    example: "Abir Sharma"
  })
  name?: string;

  @ApiPropertyOptional({
    example: "Physics Wallah"
  })
  organization?: string;
}