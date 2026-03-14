import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateMeetingSpeakerSegmentDto {

  @ApiProperty({
    example: "67d1ab234567890123456789",
    description: "Meeting ID",
  })
  @IsMongoId()
  meetingId: string;

  @ApiProperty({
    example: "67cf0a23412e912345678901",
    description: "Speaker User ID",
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  speakerId?: string;

  @ApiProperty({
    example: 12.3,
    description: "Segment start time in seconds",
  })
  @IsNumber()
  startTime: number;

  @ApiProperty({
    example: 16.8,
    description: "Segment end time in seconds",
  })
  @IsNumber()
  endTime: number;

  @ApiProperty({
    example: "We should launch the new feature next month.",
  })
  @IsString()
  text: string;
}