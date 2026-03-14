import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {

  @ApiProperty({ example: "abir@gmail.com" })
  email: string;

  @ApiProperty({ example: "StrongPassword123" })
  password: string;

}