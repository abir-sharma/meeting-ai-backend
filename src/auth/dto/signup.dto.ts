import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {

  @ApiProperty({ example: "abir@gmail.com" })
  email: string;

  @ApiProperty({ example: "StrongPassword123" })
  password: string;

  @ApiProperty({ example: "Abir Sharma" })
  name: string;

  @ApiProperty({ example: "Physics Wallah" })
  organization: string;

}