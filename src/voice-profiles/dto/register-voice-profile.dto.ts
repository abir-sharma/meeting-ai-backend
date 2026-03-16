import { ApiProperty } from '@nestjs/swagger';

export class RegisterVoiceDto {

  @ApiProperty({
    example: "Abir Sharma",
    description: "Name of the speaker"
  })
  name: string;

  @ApiProperty({
    example: "64f8a3d2c9e77f4a2a1b1234",
    description: "User ID"
  })
  userId: string;

}