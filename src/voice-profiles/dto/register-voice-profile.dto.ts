import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterVoiceDto {

  @ApiProperty({
    example: 'Abir Sharma',
    description: 'Name of the speaker',
  })

  @ApiProperty({
    example: '64f8a3d2c9e77f4a2a1b1234',
    description: 'User ID associated with this voice',
  })
  @IsString()
  userId!: string;

  // @ApiProperty({
  //   type: 'string',
  //   format: 'binary',
  //   description: 'Upload MP3/WAV voice file',
  // })
  // audio!: any;
}