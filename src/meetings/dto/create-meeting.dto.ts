import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum MeetingStatus {
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateMeetingDto {

  @ApiProperty({
    example: "67cf0a23412e912345678900",
    description: "Device MongoDB ID",
  })
  @IsMongoId()
  deviceId: string;

  @ApiProperty({
    example: "67cf0a23412e912345678901",
    description: "User who created the meeting",
  })
  @IsMongoId()
  createdBy: string;

  @ApiProperty({
    example: "https://storage.example.com/audio/meeting123.mp3",
  })
  @IsString()
  audioUrl: string;

  @ApiProperty({
    example: "Discussion about product roadmap and upcoming features.",
    required: false,
  })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiProperty({
    example: "Team discussed roadmap and agreed to launch beta next month.",
    required: false,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    enum: MeetingStatus,
    example: MeetingStatus.RECORDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @ApiProperty({
    example: "2026-03-13T10:00:00Z",
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    example: "2026-03-13T11:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}