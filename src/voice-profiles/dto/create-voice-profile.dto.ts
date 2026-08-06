import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateVoiceProfileDto {

  @ApiProperty({
    example: 'Abir Sharma',
    description: 'Name of the speaker',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '64f8a3d2c9e77f4a2a1b1234',
    description: 'User ID associated with this voice',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    example: [0.12, 0.34, 0.56],
    description: 'Voice embedding vector',
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  voiceEmbedding!: number[];


}