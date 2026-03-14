import { PartialType } from '@nestjs/swagger';
import { CreateMeetingSpeakerSegmentDto } from './create-meeting-speaker-segment.dto';

export class UpdateMeetingSpeakerSegmentDto extends PartialType(CreateMeetingSpeakerSegmentDto) {}
